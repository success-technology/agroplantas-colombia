"""API transaccional: cuota, catálogo y orquestación de inferencia ML."""

import json
import os
import random
import time
import hashlib
import re
from pathlib import Path
from datetime import datetime, timedelta

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().with_name(".env"))

import httpx
import numpy as np
import uvicorn
from fastapi import Depends, FastAPI, File, Header, HTTPException, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.middleware.base import BaseHTTPMiddleware

from class_names_util import load_class_names
from prediction_utils import analyze_predictions
from recommendations import generate_recommendations
from schemas import AnalysisSummary, PredictionResponse, PredictionResult, Probability

from database import Base, engine, get_db, migrate_user_name_change_column
from sqlalchemy.dialects.postgresql import insert as postgresql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.orm import Session
from sqlalchemy import case, or_
from auth_deps import get_current_user_optional
from db_models import AnalysisQuota, User
from routers import auth as auth_router
from routers import history as history_router
from security import AuthRateLimitMiddleware

app = FastAPI(
    title="AgroPlantas Colombia API",
    description="Identificación de plantas agrícolas y malezas con IA",
    version="2.2.0",
)

# En producción, define la variable de entorno ALLOWED_ORIGINS con la URL
# real de tu frontend (por ejemplo: https://agroplantas.vercel.app), separadas
# por coma si necesitas más de una. En desarrollo local, si no se define, se
# permite únicamente los orígenes locales de Vite.
_allowed_origins_env = os.environ.get("ALLOWED_ORIGINS")
allowed_origins = (
    [o.strip() for o in _allowed_origins_env.split(",") if o.strip()]
    if _allowed_origins_env
    else ["http://localhost:3000", "http://127.0.0.1:3000"]
)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Agrega cabeceras HTTP para reducir riesgos comunes en el navegador."""

    async def dispatch(self, request, call_next):
        """Aplica cabeceras defensivas a todas las respuestas del API."""
        response = await call_next(request)
        if os.environ.get("APP_ENV", "").lower() == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(self), microphone=(), geolocation=()"
        return response


app.add_middleware(AuthRateLimitMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Guest-ID"],
    expose_headers=["X-Guest-Remaining", "X-Analysis-Remaining", "X-Analysis-Reset-At"],
)

if os.environ.get("APP_ENV", "").lower() == "production":
    if os.environ.get("JWT_SECRET", "dev-secret-inseguro-cambiar-en-produccion") == "dev-secret-inseguro-cambiar-en-produccion":
        raise RuntimeError("En producción debes configurar JWT_SECRET con un valor aleatorio y secreto.")
    if not allowed_origins or "*" in allowed_origins:
        raise RuntimeError("En producción debes configurar ALLOWED_ORIGINS con los dominios permitidos.")

from supported_species import get_supported_species

Base.metadata.create_all(bind=engine)
migrate_user_name_change_column()
app.include_router(auth_router.router)
app.include_router(history_router.router)

# URL del microservicio de ML (backend/main.py ya NO carga TensorFlow él
# mismo — se descubrió que TensorFlow + una conexión real a Postgres en el
# mismo proceso causaba un Segmentation fault reproducible en Render.
# Ahora TensorFlow vive aislado en ml_service/, y este backend le pide las
# predicciones por HTTP. En local, ambos servicios corren en puertos
# distintos (backend en 8000, ml_service en 8001 por defecto).
ML_SERVICE_URL = os.environ.get(
    "ML_SERVICE_URL",
    "https://agroplantas-ml.onrender.com"
).rstrip("/")
CONFIDENCE_THRESHOLD = 0.50
FREE_PREDICTION_LIMIT = 6
ANALYSIS_WINDOW = timedelta(hours=24)


def _guest_hash(guest_id: str | None) -> str:
    """Valida el identificador del invitado y devuelve su hash no reversible."""
    if not guest_id or not re.fullmatch(r"[A-Za-z0-9-]{16,80}", guest_id):
        raise HTTPException(status_code=400, detail="Identificador de invitado inválido.")
    return hashlib.sha256(guest_id.encode("utf-8")).hexdigest()


def _analysis_subject_hash(user: User | None, guest_id: str | None) -> str:
    """Deriva una clave de cuota separada para cuentas y sesiones invitadas."""
    subject = f"user:{user.id}" if user else f"guest:{_guest_hash(guest_id)}"
    return hashlib.sha256(subject.encode("utf-8")).hexdigest()


def _analysis_quota_status(subject_hash: str, db: Session) -> dict:
    """Calcula intentos restantes y fecha de reinicio sin modificar la cuota."""
    quota = db.query(AnalysisQuota).filter_by(subject_hash=subject_hash).first()
    now = datetime.utcnow()
    if not quota or now >= quota.window_started_at + ANALYSIS_WINDOW:
        return {"attempts": 0, "remaining": FREE_PREDICTION_LIMIT, "reset_at": None}
    return {
        "attempts": quota.attempts,
        "remaining": max(0, FREE_PREDICTION_LIMIT - quota.attempts),
        "reset_at": (quota.window_started_at + ANALYSIS_WINDOW).isoformat() + "Z",
    }


def _consume_analysis_attempt(subject_hash: str, db: Session) -> dict:
    """Incrementa atómicamente el contador de análisis de una ventana de 24 h."""
    now = datetime.utcnow()
    reset_before = now - ANALYSIS_WINDOW
    insert = sqlite_insert if engine.dialect.name == "sqlite" else postgresql_insert
    statement = insert(AnalysisQuota).values(
        subject_hash=subject_hash,
        attempts=1,
        window_started_at=now,
        updated_at=now,
    )
    statement = statement.on_conflict_do_update(
        index_elements=["subject_hash"],
        set_={
            "attempts": case(
                (AnalysisQuota.window_started_at <= reset_before, 1),
                else_=AnalysisQuota.attempts + 1,
            ),
            "window_started_at": case(
                (AnalysisQuota.window_started_at <= reset_before, now),
                else_=AnalysisQuota.window_started_at,
            ),
            "updated_at": now,
        },
        where=or_(
            AnalysisQuota.window_started_at <= reset_before,
            AnalysisQuota.attempts < FREE_PREDICTION_LIMIT,
        ),
    )
    result = db.execute(statement)
    if result.rowcount == 0:
        db.rollback()
        status = _analysis_quota_status(subject_hash, db)
        raise HTTPException(
            status_code=429,
            detail="Alcanzaste el límite de 6 análisis gratuitos por cada período de 24 horas.",
            headers={
                "X-Analysis-Remaining": "0",
                "X-Analysis-Reset-At": status["reset_at"] or "",
                "X-Guest-Remaining": "0",
            },
        )
    db.commit()
    return _analysis_quota_status(subject_hash, db)

# Carpeta donde vive el dataset de entrenamiento ya preparado (una subcarpeta
# por clase, con nombre exacto "Cultivo___Estado"), usada para mostrar una
# foto real de muestra en la ficha de la Biblioteca de plantas.
#
# Orden de búsqueda: 1) variable de entorno DATASET_TRAIN_DIR si se define;
# 2) carpeta liviana `backend/sample_images/` (una foto chica por clase,
#    generada con scripts/curate_sample_images.py — esta SÍ es apta para
#    subir a un servidor en la nube); 3) el dataset completo de entrenamiento
#    en el equipo local (pesa varios GB, solo existe en desarrollo).
_sample_images_dir = Path(__file__).resolve().parent / "sample_images"
_full_dataset_dir = Path(__file__).resolve().parents[1] / "data" / "raw" / "PlantVillage" / "train"

if os.environ.get("DATASET_TRAIN_DIR"):
    DATASET_TRAIN_DIR = Path(os.environ["DATASET_TRAIN_DIR"])
elif _sample_images_dir.is_dir():
    DATASET_TRAIN_DIR = _sample_images_dir
else:
    DATASET_TRAIN_DIR = _full_dataset_dir
IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")


def find_sample_image(class_name: str) -> Path | None:
    """Busca una imagen de muestra del dataset local para una clase válida."""
    """Busca una imagen de muestra dentro de la carpeta de esa clase en el
    dataset de entrenamiento. Devuelve None si la carpeta o las imágenes
    no existen (por ejemplo, si el dataset no está presente en este equipo)."""
    class_dir = DATASET_TRAIN_DIR / class_name
    if not class_dir.is_dir():
        return None
    candidates = sorted(
        f for f in class_dir.iterdir()
        if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS
    )
    if not candidates:
        return None
    # Semilla fija por clase para que la imagen "de muestra" no cambie en cada
    # solicitud, pero sí varíe de una clase a otra.
    random.seed(class_name)
    return random.choice(candidates)


@app.get("/")
async def root():
    """Devuelve identidad, versión y estado básico del backend."""
    return {
        "message": "AgroPlantas Colombia — API de identificación vegetal",
        "version": "2.2.0",
        "status": "operational",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """Combina estado del API, servicio ML, clases y métricas registradas."""
    metrics_path = Path(__file__).resolve().parents[1] / "models" / "training_metrics.json"
    metrics = {}
    if metrics_path.exists():
        with open(metrics_path, encoding="utf-8-sig") as f:
            metrics = json.load(f)

    class_names = load_class_names()

    ml_service_status = "unreachable"
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{ML_SERVICE_URL}/health")
            if resp.status_code == 200:
                ml_service_status = resp.json()
    except httpx.HTTPError:
        pass

    return {
        "status": "healthy",
        "ml_service": ml_service_status,
        "classes": class_names,
        "num_classes": len(class_names),
        "training_metrics": metrics or None,
        "model_trained": bool(metrics) and isinstance(ml_service_status, dict),
    }


@app.get("/api/classes")
async def list_classes():
    """Publica el orden de etiquetas que reconoce el modelo de estado."""
    return {"classes": load_class_names()}


@app.get("/api/supported-species")
async def supported_species():
    """Expone la lista de especies admitidas por las reglas de reconocimiento."""
    return {"species": get_supported_species(), "count": len(get_supported_species())}


@app.get("/api/plant-info/{class_name}")
async def plant_info(class_name: str):
    """Entrega la ficha completa del catálogo sin requerir una fotografía.
    Usada por la Biblioteca de plantas para el detalle de cada estado."""
    if class_name not in load_class_names():
        raise HTTPException(status_code=404, detail="Esa clase no existe en el modelo actual")

    # Confianza fija y alta: esto es una ficha de catálogo, no una predicción real,
    # así que no debe disparar los avisos de "confianza baja" de generate_recommendations.
    info = generate_recommendations(class_name, 0.95, None)

    # La descripción generada por generate_recommendations está pensada para el
    # resultado de una predicción real ("Identificación: X (Y% confianza)."),
    # lo cual no aplica aquí porque no hay ninguna foto real de por medio.
    # Se quita esa frase inicial, dejando solo la descripción del estado.
    prefix_end = info.description.find(". ")
    if info.description.startswith("Identificación:") and prefix_end != -1:
        info.description = info.description[prefix_end + 2:]

    has_sample_image = find_sample_image(class_name) is not None

    return {"className": class_name, "plantInfo": info, "hasSampleImage": has_sample_image}


@app.get("/api/plant-image/{class_name}")
async def plant_image(class_name: str):
    """Entrega una fotografía de muestra del dataset de entrenamiento
    para la clase indicada. 404 si el dataset no está disponible en este
    equipo o no hay imágenes para esa clase."""
    image_path = find_sample_image(class_name)
    if not image_path:
        raise HTTPException(
            status_code=404,
            detail="No hay una imagen de muestra disponible para esta clase en este equipo.",
        )
    return FileResponse(image_path)


@app.get("/api/guest/quota")
def get_guest_quota(
    x_guest_id: str | None = Header(default=None, alias="X-Guest-ID"),
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Consulta la cuota actual del usuario autenticado o del invitado."""
    subject_hash = _analysis_subject_hash(current_user, x_guest_id)
    quota = _analysis_quota_status(subject_hash, db)
    return {
        "authenticated": current_user is not None,
        "plan": "free",
        "limit": FREE_PREDICTION_LIMIT,
        "window_hours": 24,
        **quota,
    }


@app.post("/api/predict", response_model=PredictionResponse)
async def predict(
    response: Response,
    file: UploadFile = File(...),
    x_guest_id: str | None = Header(default=None, alias="X-Guest-ID"),
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Coordina cuota, validación de imagen, inferencia y recomendaciones.

    Pasos: valida archivo y sujeto, consume un intento, llama a `ml_service`,
    interpreta probabilidades, prepara datos agronómicos y forma la respuesta.
    """
    start_time = time.time()

    try:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="El archivo debe ser una imagen válida")

        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Imagen demasiado grande (máx. 10 MB)")

        subject_hash = _analysis_subject_hash(current_user, x_guest_id)
        quota = _consume_analysis_attempt(subject_hash, db)
        response.headers["X-Analysis-Remaining"] = str(quota["remaining"])
        response.headers["X-Guest-Remaining"] = str(quota["remaining"])
        if quota["reset_at"]:
            response.headers["X-Analysis-Reset-At"] = quota["reset_at"]

        # La predicción real la hace el microservicio ML (aislado, con
        # TensorFlow) — este backend solo reenvía la imagen y procesa la
        # respuesta.
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                ml_response = await client.post(
                    f"{ML_SERVICE_URL}/predict",
                    files={"file": (file.filename, contents, file.content_type)},
                )
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=503,
                detail=f"No se pudo conectar con el servicio de identificación: {e}",
            ) from e

        if ml_response.status_code != 200:
            try:
                detail = ml_response.json().get("detail", ml_response.text)
            except Exception:
                detail = ml_response.text
            raise HTTPException(status_code=ml_response.status_code, detail=detail)

        ml_data = ml_response.json()

        class_names = ml_data["class_names"]

        predictions = np.array(
            ml_data["probabilities"],
            dtype=np.float32,
        )

        if len(predictions) != len(class_names):
            raise HTTPException(
                status_code=500,
                detail="Desajuste entre modelo y clases",
            )

        # Probabilidades del modelo específico de especies.
        species_class_names = ml_data.get(
            "species_class_names",
            [],
        )

        species_probabilities = np.array(
            ml_data.get(
                "species_probabilities",
                [],
            ),
            dtype=np.float32,
        )

        print("=== BACKEND ML DEBUG ===")
        print("Species names:", species_class_names)
        print("Species probabilities:", species_probabilities)
        print("Species count:", len(species_probabilities))
        print("========================")

        analysis_raw = analyze_predictions(
            class_names,
            predictions,
            species_class_names=species_class_names,
            species_probabilities=species_probabilities,
        )

        print("=== ANALYSIS DEBUG ===")
        print("Final class:", analysis_raw.get("finalClass"))
        print("Species name:", analysis_raw.get("speciesName"))
        print("Species confidence:", analysis_raw.get("speciesConfidence"))
        print("Alternative species:", analysis_raw.get("alternativeSpecies"))
        print("======================")

        final_class = analysis_raw["finalClass"]
        confidence = analysis_raw["confidence"]
        final_class = analysis_raw["finalClass"]
        confidence = analysis_raw["confidence"]

        probabilities = [
            Probability(className=class_names[i], probability=float(predictions[i]))
            for i in range(len(class_names))
        ]
        probabilities.sort(key=lambda p: p.probability, reverse=True)

        plant_info = generate_recommendations(final_class, confidence, analysis_raw)

        analysis = AnalysisSummary(
            recognized=analysis_raw.get("recognized", True),
            speciesName=analysis_raw["speciesName"],
            speciesConfidence=analysis_raw["speciesConfidence"],
            statusLabel=analysis_raw["statusLabel"],
            conditionShort=analysis_raw["conditionShort"],
            isHealthy=analysis_raw["isHealthy"],
            hasPest=analysis_raw["hasPest"],
            hasDisease=analysis_raw["hasDisease"],
            uncertain=analysis_raw["uncertain"],
            alternativeSpecies=analysis_raw["alternativeSpecies"],
            supportedSpecies=analysis_raw.get("supportedSpecies", []),
            rejectionReason=analysis_raw.get("rejectionReason"),
            weakGuessSpecies=analysis_raw.get("weakGuessSpecies"),
            weakGuessConfidence=analysis_raw.get("weakGuessConfidence"),
        )

        low_conf = not analysis_raw.get("recognized", True) or (
            confidence < CONFIDENCE_THRESHOLD or analysis_raw["uncertain"]
        )

        result = PredictionResult(
            className=final_class,
            confidence=confidence,
            probabilities=probabilities,
            analysis=analysis,
            plantInfo=plant_info,
            recommendations=plant_info,
            lowConfidence=low_conf,
        )

        return PredictionResponse(
            success=True,
            prediction=result,
            processingTime=time.time() - start_time,
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e)) from e


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), reload=True)

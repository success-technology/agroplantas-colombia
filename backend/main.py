import json
import os
import random
import time
from pathlib import Path

import httpx
import numpy as np
import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from class_names_util import load_class_names
from prediction_utils import analyze_predictions
from recommendations import generate_recommendations
from schemas import AnalysisSummary, PredictionResponse, PredictionResult, Probability

from database import Base, engine
from routers import auth as auth_router
from routers import history as history_router

app = FastAPI(
    title="AgroPlantas Colombia API",
    description="Identificación de plantas agrícolas y malezas con IA",
    version="2.2.0",
)

# En producción, define la variable de entorno ALLOWED_ORIGINS con la URL
# real de tu frontend (por ejemplo: https://agroplantas.vercel.app), separadas
# por coma si necesitas más de una. En desarrollo local, si no se define, se
# permite cualquier origen para no complicar el trabajo diario.
_allowed_origins_env = os.environ.get("ALLOWED_ORIGINS")
allowed_origins = (
    [o.strip() for o in _allowed_origins_env.split(",")] if _allowed_origins_env else ["*"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from supported_species import get_supported_species

Base.metadata.create_all(bind=engine)
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
    return {
        "message": "AgroPlantas Colombia — API de identificación vegetal",
        "version": "2.2.0",
        "status": "operational",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    metrics_path = Path(__file__).resolve().parents[1] / "models" / "training_metrics.json"
    metrics = {}
    if metrics_path.exists():
        with open(metrics_path, encoding="utf-8") as f:
            metrics = json.load(f)

    class_names = load_class_names()

    ml_service_status = "unreachable"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
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
    return {"classes": load_class_names()}


@app.get("/api/supported-species")
async def supported_species():
    return {"species": get_supported_species(), "count": len(get_supported_species())}


@app.get("/api/plant-info/{class_name}")
async def plant_info(class_name: str):
    """Ficha completa de una clase del catálogo (sin necesidad de subir foto).
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
    """Devuelve una fotografía real de muestra del dataset de entrenamiento
    para la clase indicada. 404 si el dataset no está disponible en este
    equipo o no hay imágenes para esa clase."""
    image_path = find_sample_image(class_name)
    if not image_path:
        raise HTTPException(
            status_code=404,
            detail="No hay una imagen de muestra disponible para esta clase en este equipo.",
        )
    return FileResponse(image_path)


@app.post("/api/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)):
    start_time = time.time()

    try:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="El archivo debe ser una imagen válida")

        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Imagen demasiado grande (máx. 10 MB)")

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
        predictions = np.array(ml_data["probabilities"], dtype=np.float32)

        if len(predictions) != len(class_names):
            raise HTTPException(status_code=500, detail="Desajuste entre modelo y clases")

        analysis_raw = analyze_predictions(class_names, predictions)
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
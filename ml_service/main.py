"""
Microservicio de inferencia de AgroPlantas Colombia.
Solo carga los modelos y realiza predicciones.
"""

import io
import os

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel

from models.predictor import ModelPredictor


app = FastAPI(
    title="AgroPlantas Colombia — ML Service",
    version="1.0.0",
)


_allowed_origins_env = os.environ.get("ALLOWED_ORIGINS")

allowed_origins = (
    [o.strip() for o in _allowed_origins_env.split(",")]
    if _allowed_origins_env
    else ["*"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


predictor = ModelPredictor()


class PredictOut(BaseModel):
    class_names: list[str]
    probabilities: list[float]

    # Nueva salida del modelo específico de especies.
    species_class_names: list[str] = []
    species_probabilities: list[float] = []


@app.get("/")
async def root():
    return {
        "service": "ml-service",
        "status": "operational",
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "model_loaded": predictor.model is not None,
        "model_trained": predictor.is_ready(),
        "num_classes": len(predictor.get_class_names()),
        "has_species_stage": predictor.has_species_stage(),
        "num_species": len(
            predictor.get_species_class_names()
        ),
    }


@app.get("/classes")
async def classes():
    return {
        "classes": predictor.get_class_names(),
        "species": predictor.get_species_class_names(),
    }


@app.post("/predict", response_model=PredictOut)
async def predict(file: UploadFile = File(...)):
    if (
        not file.content_type
        or not file.content_type.startswith("image/")
    ):
        raise HTTPException(
            status_code=400,
            detail="El archivo debe ser una imagen válida",
        )

    contents = await file.read()

    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Imagen demasiado grande (máx. 10 MB)",
        )

    if not predictor.is_ready():
        raise HTTPException(
            status_code=503,
            detail="Modelo no entrenado",
        )

    try:
        image = Image.open(
            io.BytesIO(contents)
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"No se pudo leer la imagen: {e}",
        ) from e

    predictions = predictor.predict_image(image)

    class_names = predictor.get_class_names()

    if len(predictions) != len(class_names):
        raise HTTPException(
            status_code=500,
            detail="Desajuste entre modelo y clases",
        )

    species_probabilities = (
        predictor.get_species_probabilities()
    )

    species_class_names = (
        predictor.get_species_class_names()
    )

    if species_probabilities is None:
        species_probabilities = []

    if len(species_probabilities) != len(
        species_class_names
    ):
        species_probabilities = []

    print("=== SPECIES DEBUG ===")
    print("Species names:", species_class_names)
    print("Species probabilities:", species_probabilities)
    print("Species count:", len(species_probabilities))
    print("=====================")

    return PredictOut(
        class_names=class_names,
        probabilities=[
            float(p)
            for p in predictions
        ],
        species_class_names=species_class_names,
        species_probabilities=[
            float(p)
            for p in species_probabilities
        ],
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(
            os.environ.get("PORT", 8001)
        ),
        loop="asyncio",
    )
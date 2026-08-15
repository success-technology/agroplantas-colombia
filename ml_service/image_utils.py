"""Preprocesamiento de imágenes alineado con el entrenamiento."""
from __future__ import annotations

import numpy as np
from PIL import Image
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

IMG_SIZE = 224


def center_crop_square(img: Image.Image) -> Image.Image:
    """Recorte cuadrado al centro — enfoque en la planta/hoja."""
    img = img.convert("RGB")
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    return img.crop((left, top, left + side, top + side))


def preprocess_pil(img: Image.Image, size: int = IMG_SIZE) -> np.ndarray:
    """
    IMPORTANTE: MobileNetV2 fue preentrenado en ImageNet esperando sus
    imágenes normalizadas con `preprocess_input` (deja los valores
    aproximadamente entre -1 y 1, con tratamiento específico por canal),
    NO con un simple `/255.0` (que las deja entre 0 y 1). Usar la
    normalización equivocada degrada la calidad de las características que
    extrae la base congelada del modelo durante la transferencia de
    aprendizaje — este archivo y el notebook de entrenamiento en Colab
    DEBEN usar exactamente la misma normalización, o el modelo entrena con
    una distribución de píxeles y predice con otra.
    """
    cropped = center_crop_square(img)
    resized = cropped.resize((size, size), Image.Resampling.LANCZOS)
    arr = np.array(resized, dtype=np.float32)
    arr = preprocess_input(arr)
    return arr


def tta_variants(img: Image.Image) -> list[np.ndarray]:
    """UNA sola vista de la imagen (sin espejo ni recorte extra).

    Antes promediaba 3 variantes (normal + espejo + recorte de zoom) para
    ser más robusto con fotos de campo. Se redujo a 1 sola porque en la CPU
    gratuita y compartida de Render, 3 variantes × 2 modelos (especie +
    estado) = 6 pasadas del modelo por foto tardaban lo suficiente como
    para que el propio proxy de Render cortara la conexión con un 502
    (confirmado: el timeout ocurría incluso llamando al ml_service
    directamente, sin el backend de por medio). Si en el futuro se aloja en
    un plan con más CPU, vale la pena reactivar el promedio de variantes.
    """
    base = center_crop_square(img)
    return [preprocess_pil(base)]
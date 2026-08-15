"""Lee models/class_names.json directamente del disco, sin pasar por
TensorFlow ni por el ModelPredictor — el backend principal ya NO carga
TensorFlow en absoluto (esa responsabilidad quedó aislada en ml_service/),
pero varias rutas (Biblioteca, especies soportadas, validación de clase)
necesitan la lista de nombres de clase. Como es solo un JSON, no hay
ninguna razón para necesitar TensorFlow para leerlo."""
import json
from pathlib import Path

CLASS_NAMES_PATH = Path(__file__).resolve().parent.parent / "models" / "class_names.json"


def load_class_names() -> list[str]:
    if not CLASS_NAMES_PATH.exists():
        return []
    try:
        with open(CLASS_NAMES_PATH, encoding="utf-8") as f:
            raw = json.load(f)
    except (json.JSONDecodeError, OSError):
        return []

    if isinstance(raw, list):
        return raw
    if isinstance(raw, dict):
        # Colab a veces lo guarda como {"0": "Clase A", "1": "Clase B", ...}
        # (las llaves de un dict en JSON siempre son texto) — normalizamos
        # a una lista real ordenada por índice.
        return [raw[str(i)] for i in range(len(raw))]
    return []
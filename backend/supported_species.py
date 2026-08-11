"""Especies que el modelo YA fue entrenado para reconocer (según models/class_names.json).

IMPORTANTE: esta lista se deriva del modelo REALMENTE cargado, no de toda la
base de conocimiento en plant_knowledge.py. Así evitamos anunciar cultivos
(ej. Café, Cacao) que ya tienen ficha agronómica escrita pero cuyo dataset
todavía no se incorporó al entrenamiento — para no confundir al usuario con
una lista que promete más de lo que el modelo actual puede reconocer.
"""
from __future__ import annotations

import json
from pathlib import Path

from plant_knowledge import PLANT_NAMES_ES

CLASS_NAMES_PATH = Path(__file__).parent.parent / "models" / "class_names.json"

# Umbral: por debajo de esto NO afirmamos una especie (evita "uva" al 30% con orégano)
MIN_CLASS_CONFIDENCE = 0.55
MIN_SPECIES_CONFIDENCE = 0.48
MIN_GAP_TOP_TWO_SPECIES = 0.12


def _load_trained_plant_keys() -> set[str]:
    """Lee las clases reales del modelo entrenado (models/class_names.json)."""
    if not CLASS_NAMES_PATH.exists():
        return set()
    try:
        with open(CLASS_NAMES_PATH, encoding="utf-8") as f:
            class_names: list[str] = json.load(f)
    except (json.JSONDecodeError, OSError):
        return set()

    plant_keys: set[str] = set()
    for name in class_names:
        plant_key = name.split("___", 1)[0].strip()
        plant_keys.add(plant_key)
    return plant_keys


def _build_supported_species() -> list[str]:
    trained_keys = _load_trained_plant_keys()
    if not trained_keys:
        # Sin class_names.json (modo demo sin modelo entrenado): usar la base
        # de conocimiento completa para no dejar la lista vacía.
        return sorted({name for name, _, _ in PLANT_NAMES_ES.values()})
    names = {
        PLANT_NAMES_ES[key][0]
        for key in trained_keys
        if key in PLANT_NAMES_ES
    }
    return sorted(names)


# Se calcula una vez al iniciar el backend (cuando arranca uvicorn / se recarga).
SUPPORTED_SPECIES_ES: list[str] = _build_supported_species()


def get_supported_species() -> list[str]:
    return SUPPORTED_SPECIES_ES.copy()
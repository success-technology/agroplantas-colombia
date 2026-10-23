"""Análisis inteligente: especie + estado (sano / enfermedad / plaga)."""
from __future__ import annotations

from collections import defaultdict

import numpy as np

from plant_knowledge import PLANT_NAMES_ES, normalize_class_name
from supported_species import (
    MIN_CLASS_CONFIDENCE,
    MIN_GAP_TOP_TWO_SPECIES,
    MIN_SPECIES_CONFIDENCE,
    get_supported_species,
)


def _split_class(class_name: str) -> tuple[str, str]:
    if "___" in class_name:
        return class_name.split("___", 1)
    return class_name, "healthy"


def _species_label(plant_key: str) -> str:
    if plant_key in PLANT_NAMES_ES:
        return PLANT_NAMES_ES[plant_key][0]

    return plant_key.replace("_", " ").replace(",", "").strip()


def _is_recognized(
    final_conf: float,
    species_conf: float,
    alt_species: list[dict],
) -> bool:
    if final_conf < MIN_CLASS_CONFIDENCE:
        return False

    if species_conf < MIN_SPECIES_CONFIDENCE:
        return False

    if len(alt_species) >= 2:
        gap = (
            alt_species[0]["probability"]
            - alt_species[1]["probability"]
        )

        if gap < MIN_GAP_TOP_TWO_SPECIES and final_conf < 0.72:
            return False

    return True


def analyze_predictions(
    class_names: list[str],
    probabilities: np.ndarray,
    species_class_names: list[str] | None = None,
    species_probabilities: np.ndarray | None = None,
) -> dict:

    # ============================================================
    # 1. PROBABILIDADES DEL MODELO DE ESTADO
    # ============================================================

    state_species_probs: dict[str, float] = defaultdict(float)
    by_species: dict[
        str, list[tuple[str, str, float]]
    ] = defaultdict(list)

    for name, prob in zip(class_names, probabilities):
        p = float(prob)

        plant_key, cond = _split_class(name)

        state_species_probs[plant_key] += p

        by_species[plant_key].append(
            (name, cond, p)
        )

    # ============================================================
    # 2. CLASE DE ESTADO MÁS PROBABLE
    # ============================================================

    global_idx = int(np.argmax(probabilities))

    global_class = class_names[global_idx]
    global_conf = float(probabilities[global_idx])

    # ============================================================
    # 3. MODELO REAL DE ESPECIES
    # ============================================================

    has_real_species_model = (
        species_class_names is not None
        and species_probabilities is not None
        and len(species_class_names) == len(species_probabilities)
        and len(species_class_names) >= 2
    )

    if has_real_species_model:

        # Aseguramos que las probabilidades estén dentro de [0, 1].
        species_probabilities = np.clip(
            np.asarray(species_probabilities, dtype=np.float32),
            0.0,
            1.0,
        )

        # Normalizamos por seguridad.
        species_total = float(
            np.sum(species_probabilities)
        )

        if species_total > 0:
            species_probabilities = (
                species_probabilities / species_total
            )

        species_pairs = sorted(
            zip(
                species_class_names,
                species_probabilities,
            ),
            key=lambda x: float(x[1]),
            reverse=True,
        )

        best_species_key = species_pairs[0][0]
        species_conf = float(species_pairs[0][1])

        # Las 5 especies realmente predichas por el modelo.
        alt_species = [
            {
                "speciesKey": species_key,
                "speciesName": _species_label(species_key),
                "probability": round(
                    float(probability),
                    4,
                ),
            }
            for species_key, probability in species_pairs[:5]
        ]

    else:
        # ========================================================
        # COMPATIBILIDAD CON MODELOS ANTIGUOS
        # ========================================================

        best_species_key = max(
            state_species_probs,
            key=state_species_probs.get,
        )

        species_conf = float(
            state_species_probs[best_species_key]
        )

        alt_species = sorted(
            [
                {
                    "speciesKey": key,
                    "speciesName": _species_label(key),
                    "probability": round(
                        value,
                        4,
                    ),
                }
                for key, value in state_species_probs.items()
            ],
            key=lambda x: -x["probability"],
        )[:5]

    # ============================================================
    # 4. ESTADO MÁS PROBABLE DENTRO DE LA ESPECIE DETECTADA
    # ============================================================

    # Normalmente el modelo de estado y el de especie coincidirán.
    # Si la especie del modelo real existe entre las 93 clases,
    # buscamos el estado más probable de esa especie.

    if best_species_key in by_species:

        best_in_species = max(
            by_species[best_species_key],
            key=lambda x: x[2],
        )

        species_class, species_cond, class_conf = (
            best_in_species
        )

    else:
        # Si por alguna razón el modelo de especie devuelve una
        # especie que no tiene clases en el modelo de estado,
        # usamos la clase global.
        species_class = global_class
        species_cond = _split_class(global_class)[1]
        class_conf = global_conf

    # ============================================================
    # 5. CLASE FINAL
    # ============================================================

    if (
        species_class in class_names
        and species_conf >= 0.30
        and class_conf >= 0.15
    ):
        final_class = species_class
        final_conf = class_conf

    else:
        final_class = global_class
        final_conf = global_conf

        # Si el modelo de especie no existe, mantenemos
        # compatibilidad con el comportamiento anterior.
        if not has_real_species_model:
            best_species_key, _ = _split_class(
                global_class
            )

            species_conf = state_species_probs.get(
                best_species_key,
                global_conf,
            )

    # ============================================================
    # 6. RECONOCIMIENTO
    # ============================================================

    recognized = _is_recognized(
        final_conf,
        species_conf,
        alt_species,
    )

    (
        _,
        plant_es,
        _,
        category,
        _,
        cond_es,
        kind,
    ) = normalize_class_name(final_class)

    is_healthy = kind == "healthy"
    has_pest = kind == "pest"
    has_disease = kind in (
        "fungal",
        "bacterial",
        "viral",
        "citrus",
    )

    # ============================================================
    # 7. ESPECIE NO RECONOCIDA
    # ============================================================

    if not recognized:
        return {
            "recognized": False,
            "finalClass": final_class,
            "confidence": final_conf,
            "speciesKey": best_species_key,
            "speciesName": "Especie no identificada",
            "speciesConfidence": float(
                np.clip(species_conf, 0.0, 1.0)
            ),
            "category": "Fuera del catálogo",
            "statusLabel": "No disponible en el modelo",
            "conditionShort": (
                "La imagen no coincide con suficiente "
                "certeza con los cultivos entrenados"
            ),
            "isHealthy": False,
            "hasPest": False,
            "hasDisease": False,
            "conditionFull": cond_es,
            "alternativeSpecies": alt_species,
            "uncertain": True,
            "supportedSpecies": get_supported_species(),
            "rejectionReason": (
                f"Confianza muy baja ({final_conf * 100:.0f}%). "
                "Plantas como orégano, café, yuca o plátano "
                "no están en el dataset de entrenamiento."
            ),
            "weakGuessSpecies": (
                _species_label(best_species_key)
                if final_conf >= 0.15
                else None
            ),
            "weakGuessConfidence": final_conf,
        }

    # ============================================================
    # 8. ESTADO DE LA PLANTA
    # ============================================================

    if is_healthy:
        status_label = "Planta sana"
        condition_short = (
            "Sin enfermedad ni plaga detectada"
        )

    elif has_pest:
        status_label = "Con plaga"
        condition_short = (
            cond_es.split("(")[0].strip()
        )

    elif has_disease:
        status_label = "Con enfermedad"
        condition_short = (
            cond_es.split("(")[0].strip()
        )

    else:
        status_label = "Requiere revisión"
        condition_short = cond_es

    # ============================================================
    # 9. RESULTADO FINAL
    # ============================================================

    return {
        "recognized": True,
        "finalClass": final_class,
        "confidence": final_conf,
        "speciesKey": best_species_key,
        "speciesName": plant_es,
        "speciesConfidence": float(
            np.clip(species_conf, 0.0, 1.0)
        ),
        "category": category,
        "statusLabel": status_label,
        "conditionShort": condition_short,
        "isHealthy": is_healthy,
        "hasPest": has_pest,
        "hasDisease": has_disease,
        "conditionFull": cond_es,
        "alternativeSpecies": alt_species,
        "uncertain": final_conf < 0.65,
        "supportedSpecies": get_supported_species(),
        "rejectionReason": None,
        "weakGuessSpecies": None,
        "weakGuessConfidence": None,
    }
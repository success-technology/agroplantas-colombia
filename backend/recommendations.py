"""Ficha agronómica detallada — una ficha única por cada clase del dataset."""
from __future__ import annotations

import json
from pathlib import Path

from plant_knowledge import (
    DISEASE_TEMPLATES,
    colombia_regions,
    normalize_class_name,
    season_for,
)
from schemas import EnvironmentalFactors, PlantInfo

CATALOG_PATH = Path(__file__).parent / "data" / "plant_catalog.json"


def _load_catalog() -> dict:
    if CATALOG_PATH.exists():
        with open(CATALOG_PATH, encoding="utf-8") as f:
            return json.load(f)
    return {}


def _find_catalog_entry(catalog: dict, class_name: str) -> dict | None:
    if class_name in catalog:
        return catalog[class_name]
    return None


def _health_status(kind: str, plant_es: str, cond_es: str) -> str:
    if kind == "healthy":
        return f"{plant_es} — Sano"
    if kind == "pest":
        return f"{plant_es} — Afectado por plaga"
    if kind == "viral":
        return f"{plant_es} — Afectado por virus"
    if kind == "bacterial":
        return f"{plant_es} — Afectado por bacteria"
    if kind == "citrus":
        return f"{plant_es} — Enfermedad grave (cítricos)"
    return f"{plant_es} — Afectado por enfermedad fúngica"


def _severity(kind: str, confidence: float) -> str:
    if kind == "healthy":
        base = "low"
    elif kind in ("viral", "citrus"):
        base = "high"
    elif kind in ("fungal", "bacterial", "pest"):
        base = "high"
    else:
        base = "medium"
    if confidence < 0.45:
        return "medium"
    return base


def build_plant_info(class_name: str, confidence: float) -> PlantInfo:
    """Genera ficha única según la clase predicha por el modelo."""
    catalog = _load_catalog()
    entry = _find_catalog_entry(catalog, class_name)
    if entry:
        return _from_catalog(entry, class_name, confidence)

    _, plant_es, scientific, category, cond_key, cond_es, kind = normalize_class_name(class_name)
    template = DISEASE_TEMPLATES.get(kind, DISEASE_TEMPLATES["fungal"])

    is_healthy = kind == "healthy"
    has_pest = kind == "pest"
    has_disease = kind in ("fungal", "bacterial", "viral", "citrus")

    health = _health_status(kind, plant_es, cond_es)
    severity = _severity(kind, confidence)

    title = plant_es

    description = (
        f"Identificación: **{class_name}** ({(confidence * 100):.1f}% confianza). "
        if not is_healthy
        else f"Cultivo de **{plant_es}** en estado saludable ({(confidence * 100):.1f}% confianza). "
    )
    description += cond_es + "."

    env_by_kind = {
        "fungal": ("15–28 °C", ">80% humedad favorece infección", "Ventilación adecuada"),
        "bacterial": ("20–30 °C", "Salpicadura y lluvia dispersan bacteria", "Evitar mojar hojas al regar"),
        "viral": ("25–35 °C", "Vectores activos con calor", "Proteger de insectos vectores"),
        "pest": ("22–32 °C", "Sequía estresa planta y favorece ácaros", "Monitorear envés de hojas"),
        "healthy": ("Según cultivo", "Evitar estrés hídrico", "Luz según requerimiento del cultivo"),
        "citrus": ("20–32 °C", "Humedad moderada", "Sol pleno en frutales"),
    }
    temp, hum, sun = env_by_kind.get(kind, env_by_kind["fungal"])

    return PlantInfo(
        title=title,
        description=description.replace("**", ""),
        severity=severity,
        plantType=plant_es,
        scientificName=scientific or None,
        category=category,
        healthStatus=health,
        condition=cond_es,
        hasPest=has_pest,
        hasDisease=has_disease,
        pestOrDiseaseName=None if is_healthy else cond_es,
        treatment=list(template["treatment"]),
        possibleCauses=list(template["causes"]),
        season=season_for(kind, plant_es),
        colombiaRegions=colombia_regions(category, plant_es),
        prevention=list(template["prevention"]),
        actions=list(template["treatment"][:4]),
        environmental=EnvironmentalFactors(
            temperature=temp,
            humidity=hum,
            sunlight=sun,
        ),
        additionalNotes=(
            "Valide en campo con un técnico agrícola antes de aplicar químicos."
            if confidence < 0.65
            else None
        ),
    )


def _from_catalog(entry: dict, class_name: str, confidence: float) -> PlantInfo:
    env = entry.get("environmental", {})
    severity = entry.get("severity", "medium")
    if confidence < 0.5:
        severity = "medium"

    return PlantInfo(
        title=entry.get("title", class_name),
        description=entry.get("description", ""),
        severity=severity,
        plantType=entry.get("plantType", class_name),
        scientificName=entry.get("scientificName"),
        category=entry.get("category", "Cultivo"),
        healthStatus=entry.get("healthStatus", "Requiere verificación"),
        condition=entry.get("condition", ""),
        hasPest=entry.get("hasPest", False),
        hasDisease=entry.get("hasDisease", False),
        pestOrDiseaseName=entry.get("pestOrDiseaseName"),
        treatment=entry.get("treatment", entry.get("actions", [])),
        possibleCauses=entry.get("possibleCauses", []),
        season=entry.get("season", ""),
        colombiaRegions=entry.get("colombiaRegions", []),
        prevention=entry.get("prevention", []),
        actions=entry.get("actions", []),
        environmental=EnvironmentalFactors(
            temperature=env.get("temperature", "Consultar clima local"),
            humidity=env.get("humidity", "Monitorear humedad"),
            sunlight=env.get("sunlight", "Luz solar adecuada"),
        ),
        additionalNotes=entry.get("additionalNotes"),
    )


def build_unknown_plant_info(analysis: dict) -> PlantInfo:
    """Ficha cuando la planta NO está en el catálogo (orégano, café, etc.)."""
    supported = analysis.get("supportedSpecies", [])
    weak = analysis.get("weakGuessSpecies")
    weak_conf = analysis.get("weakGuessConfidence") or 0
    reason = analysis.get("rejectionReason", "")

    guess_note = ""
    if weak and weak_conf:
        guess_note = (
            f" El modelo intentó adivinar «{weak}» con solo {(weak_conf * 100):.0f}% de confianza — "
            "no use ese resultado como verdad."
        )

    return PlantInfo(
        title="Especie no identificada",
        description=(
            "La imagen no coincide con suficiente certeza con los cultivos que conoce el sistema. "
            + reason
            + guess_note
        ),
        severity="medium",
        plantType="No identificada en el catálogo",
        scientificName=None,
        category="Fuera del catálogo",
        healthStatus="Análisis no disponible",
        condition="No se puede determinar plaga ni enfermedad sin identificar la especie correctamente.",
        hasPest=False,
        hasDisease=False,
        pestOrDiseaseName=None,
        treatment=[
            "Identifique la planta con un agrónomo o guía de campo local",
            "Si necesita diagnóstico automático, use fotos de cultivos soportados (ver lista)",
            "Para orégano, hierbas o cultivos colombianos: ampliar el dataset y reentrenar el modelo",
        ],
        possibleCauses=[
            "La especie no fue incluida en el entrenamiento (dataset PlantVillage)",
            "Foto muy diferente a hoja sobre fondo claro del dataset",
            "Varias especies posibles con probabilidades repartidas (confusión del modelo)",
        ],
        season="N/A — especie no catalogada",
        colombiaRegions=["Aplicable cuando se agregue la especie al entrenamiento"],
        prevention=[
            "Consultar listado de especies soportadas antes de usar la app",
            "Tomar foto cercana de una hoja del cultivo soportado",
        ],
        actions=supported[:8] if supported else [],
        environmental=EnvironmentalFactors(
            temperature="—",
            humidity="—",
            sunlight="—",
        ),
        additionalNotes="Cultivos que SÍ reconoce: " + ", ".join(supported) + ".",
    )


def generate_recommendations(class_name: str, confidence: float, analysis: dict | None = None) -> PlantInfo:
    if analysis and not analysis.get("recognized", True):
        return build_unknown_plant_info(analysis)
    return build_plant_info(class_name, confidence)

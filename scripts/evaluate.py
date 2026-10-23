"""
Evalúa el modelo entrenado sobre el conjunto TEST.

Uso:
    python scripts/evaluate.py
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.preprocessing.image import ImageDataGenerator


IMG_SIZE = 224


def load_class_names(path: Path) -> list[str]:
    """Carga class_names.json en formato lista o diccionario índice -> clase."""

    with open(path, encoding="utf-8") as f:
        raw = json.load(f)

    if isinstance(raw, list):
        return raw

    if isinstance(raw, dict):
        try:
            return [
                raw[str(i)]
                for i in range(len(raw))
            ]
        except KeyError as exc:
            raise SystemExit(
                f"class_names.json tiene índices incompletos: {exc}"
            )

    raise SystemExit(
        "Formato inválido en class_names.json. "
        "Debe ser una lista o un diccionario índice -> clase."
    )


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--data",
        default="data/processed",
    )

    parser.add_argument(
        "--model",
        default="models/plant_classifier.keras",
    )

    parser.add_argument(
        "--output",
        default="models/evaluation_report.json",
    )

    args = parser.parse_args()

    model_path = Path(args.model)

    if not model_path.exists():
        raise SystemExit(
            f"Modelo no encontrado: {model_path}"
        )

    class_names_path = (
        model_path.parent / "class_names.json"
    )

    if not class_names_path.exists():
        raise SystemExit(
            f"No existe: {class_names_path}"
        )

    class_names = load_class_names(
        class_names_path
    )

    # ---------------------------------------------------------
    # Dataset TEST
    # ---------------------------------------------------------

    test_dir = Path(args.data) / "test"

    if not test_dir.exists():
        raise SystemExit(
            "No existe el conjunto TEST:\n"
            f"{test_dir}\n\n"
            "No se utilizará VAL como sustituto de TEST."
        )

    datagen = ImageDataGenerator(
        preprocessing_function=preprocess_input
    )

    test_gen = datagen.flow_from_directory(
        test_dir,
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=32,
        class_mode="categorical",
        shuffle=False,
    )

    dataset_class_names = sorted(
        test_gen.class_indices,
        key=lambda name: test_gen.class_indices[name],
    )

    # ---------------------------------------------------------
    # Validación de clases
    # ---------------------------------------------------------

    print(f"Clases en class_names.json: {len(class_names)}")
    print(f"Clases en TEST:             {len(dataset_class_names)}")

    if len(class_names) != len(dataset_class_names):
        raise SystemExit(
            "\nERROR: cantidad de clases inconsistente.\n"
            f"class_names.json: {len(class_names)}\n"
            f"dataset TEST:     {len(dataset_class_names)}"
        )

    if class_names != dataset_class_names:
        print(
            "\nERROR: el orden de las clases no coincide."
        )

        for i, (json_name, dataset_name) in enumerate(
            zip(class_names, dataset_class_names)
        ):
            if json_name != dataset_name:
                print(
                    f"  Índice {i}: "
                    f"JSON='{json_name}' | "
                    f"TEST='{dataset_name}'"
                )

        raise SystemExit(
            "\nEvaluación detenida para evitar "
            "una matriz de confusión incorrecta."
        )

    # ---------------------------------------------------------
    # Cargar modelo
    # ---------------------------------------------------------

    print("\nCargando modelo...")

    model = tf.keras.models.load_model(
        model_path
    )

    output_classes = model.output_shape[-1]

    print(
        f"Salidas del modelo:          {output_classes}"
    )

    if output_classes != len(class_names):
        raise SystemExit(
            "\nERROR: el modelo y class_names.json "
            "no tienen la misma cantidad de clases.\n"
            f"Modelo: {output_classes}\n"
            f"JSON:   {len(class_names)}"
        )

    if test_gen.num_classes != output_classes:
        raise SystemExit(
            "\nERROR: el modelo y TEST "
            "no tienen la misma cantidad de clases.\n"
            f"Modelo: {output_classes}\n"
            f"TEST:   {test_gen.num_classes}"
        )

    # ---------------------------------------------------------
    # Predicción
    # ---------------------------------------------------------

    print(
        f"\nEvaluando {test_gen.samples} imágenes..."
    )

    predictions = model.predict(
        test_gen,
        verbose=1,
    )

    y_pred = np.argmax(
        predictions,
        axis=1,
    )

    y_true = test_gen.classes

    accuracy = float(
        np.mean(y_pred == y_true)
    )

    # ---------------------------------------------------------
    # Métricas
    # ---------------------------------------------------------

    report = classification_report(
        y_true,
        y_pred,
        labels=list(range(len(class_names))),
        target_names=class_names,
        output_dict=True,
        zero_division=0,
    )

    cm = confusion_matrix(
        y_true,
        y_pred,
        labels=list(range(len(class_names))),
    ).tolist()

    # ---------------------------------------------------------
    # Guardar resultado
    # ---------------------------------------------------------

    result = {
        "model": str(model_path),
        "dataset": str(test_dir),
        "accuracy": accuracy,
        "num_samples": int(len(y_true)),
        "num_classes": len(class_names),
        "class_names": class_names,
        "preprocessing": (
            "tensorflow.keras.applications."
            "mobilenet_v2.preprocess_input"
        ),
        "classification_report": report,
        "confusion_matrix": cm,
        "recommendations_for_pilot": [
            "Probar con fotos tomadas en campo.",
            "Evaluar diferentes condiciones de iluminación.",
            "Registrar casos con baja confianza.",
            "Comparar resultados con identificación experta.",
            "Documentar especies no reconocidas.",
        ],
    }

    output_path = Path(args.output)
    output_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with open(
        output_path,
        "w",
        encoding="utf-8",
    ) as f:
        json.dump(
            result,
            f,
            ensure_ascii=False,
            indent=2,
        )

    print("\n" + "=" * 60)
    print(
        f"PRECISIÓN TEST: {accuracy:.2%}"
    )
    print(
        f"MUESTRAS:        {len(y_true)}"
    )
    print(
        f"CLASES:          {len(class_names)}"
    )
    print("=" * 60)

    print(
        f"\nReporte guardado en:\n"
        f"{output_path.resolve()}"
    )


if __name__ == "__main__":
    main()
"""
Evalúa el modelo entrenado: precisión, matriz de confusión, reporte para piloto.
Uso: python scripts/evaluate.py
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix
from tensorflow.keras.preprocessing.image import ImageDataGenerator

IMG_SIZE = 224


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="data/processed")
    parser.add_argument("--model", default="models/plant_classifier.keras")
    parser.add_argument("--output", default="models/evaluation_report.json")
    args = parser.parse_args()

    model_path = Path(args.model)
    if not model_path.exists():
        raise SystemExit(f"Modelo no encontrado: {model_path}. Entrena con scripts/train.py")

    with open(Path(args.model).parent / "class_names.json", encoding="utf-8") as f:
        class_names = json.load(f)

    test_dir = Path(args.data) / "test"
    if not test_dir.exists():
        test_dir = Path(args.data) / "val"

    datagen = ImageDataGenerator(rescale=1.0 / 255)
    test_gen = datagen.flow_from_directory(
        test_dir,
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=32,
        class_mode="categorical",
        shuffle=False,
    )

    model = tf.keras.models.load_model(model_path)
    predictions = model.predict(test_gen, verbose=1)
    y_pred = np.argmax(predictions, axis=1)
    y_true = test_gen.classes
    labels = sorted(test_gen.class_indices, key=lambda k: test_gen.class_indices[k])

    report = classification_report(y_true, y_pred, target_names=labels, output_dict=True)
    cm = confusion_matrix(y_true, y_pred).tolist()
    accuracy = float(np.mean(y_pred == y_true))

    result = {
        "accuracy": accuracy,
        "num_samples": int(len(y_true)),
        "classification_report": report,
        "confusion_matrix": cm,
        "class_names": labels,
        "recommendations_for_pilot": [
            "Probar con fotos tomadas en campo (luz natural, diferentes ángulos)",
            "Registrar casos donde la confianza sea menor al 60%",
            "Comparar resultados con identificación de agrónomo local",
            "Documentar especies no reconocidas para ampliar el dataset",
        ],
    }

    out = Path(args.output)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"✓ Precisión en test: {accuracy:.2%}")
    print(f"✓ Reporte guardado: {out.resolve()}")


if __name__ == "__main__":
    main()

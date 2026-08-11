"""
Entrena una CNN (MobileNetV2 + transfer learning) para clasificación de plantas.
Uso: python scripts/train.py --data data/processed
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path

import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from tensorflow.keras.preprocessing.image import ImageDataGenerator

IMG_SIZE = 224
DEFAULT_EPOCHS = 15
DEFAULT_BATCH = 32


def build_model(num_classes: int) -> tf.keras.Model:
    base = MobileNetV2(
        weights="imagenet",
        include_top=False,
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
    )
    base.trainable = False

    inputs = tf.keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
    x = base(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)
    return models.Model(inputs, outputs)


def create_generators(data_dir: Path, batch_size: int):
    train_datagen = ImageDataGenerator(
        rescale=1.0 / 255,
        rotation_range=25,
        width_shift_range=0.15,
        height_shift_range=0.15,
        shear_range=0.1,
        zoom_range=0.2,
        horizontal_flip=True,
        brightness_range=[0.8, 1.2],
        fill_mode="nearest",
    )
    val_datagen = ImageDataGenerator(rescale=1.0 / 255)

    train_gen = train_datagen.flow_from_directory(
        data_dir / "train",
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=batch_size,
        class_mode="categorical",
        shuffle=True,
    )
    val_gen = val_datagen.flow_from_directory(
        data_dir / "val",
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=batch_size,
        class_mode="categorical",
        shuffle=False,
    )
    return train_gen, val_gen


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="data/processed")
    parser.add_argument("--output", default="models")
    parser.add_argument("--epochs", type=int, default=DEFAULT_EPOCHS)
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH)
    parser.add_argument("--fine-tune-epochs", type=int, default=5)
    args = parser.parse_args()

    data_dir = Path(args.data)
    if not (data_dir / "train").exists():
        raise SystemExit(
            f"Ejecuta primero: python scripts/prepare_dataset.py\n"
            f"No existe {data_dir / 'train'}"
        )

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    train_gen, val_gen = create_generators(data_dir, args.batch_size)
    num_classes = train_gen.num_classes
    class_names = sorted(train_gen.class_indices, key=lambda k: train_gen.class_indices[k])

    model = build_model(num_classes)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    callbacks = [
        EarlyStopping(patience=5, restore_best_weights=True, monitor="val_accuracy"),
        ReduceLROnPlateau(factor=0.5, patience=3, min_lr=1e-6),
        ModelCheckpoint(
            str(output_dir / "best_weights.keras"),
            save_best_only=True,
            monitor="val_accuracy",
        ),
    ]

    print(f"Entrenando {num_classes} clases: {class_names}")
    history = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=args.epochs,
        callbacks=callbacks,
    )

    # Fine-tuning: descongelar últimas capas de MobileNetV2
    base_layer = model.layers[1]
    if hasattr(base_layer, "trainable"):
        base_layer.trainable = True
        for layer in base_layer.layers[:-30]:
            layer.trainable = False
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
            loss="categorical_crossentropy",
            metrics=["accuracy"],
        )
        model.fit(
            train_gen,
            validation_data=val_gen,
            epochs=args.fine_tune_epochs,
            callbacks=callbacks,
        )

    model_path = output_dir / "plant_classifier.keras"
    model.save(model_path)

    with open(output_dir / "class_names.json", "w", encoding="utf-8") as f:
        json.dump(class_names, f, ensure_ascii=False, indent=2)

    metrics = {
        "trained_at": datetime.now().isoformat(),
        "num_classes": num_classes,
        "class_names": class_names,
        "final_train_accuracy": float(history.history["accuracy"][-1]),
        "final_val_accuracy": float(history.history["val_accuracy"][-1]),
        "epochs_trained": len(history.history["accuracy"]),
        "img_size": IMG_SIZE,
        "architecture": "MobileNetV2 + CNN",
    }
    with open(output_dir / "training_metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, ensure_ascii=False, indent=2)

    print(f"\nOK Modelo guardado: {model_path}")
    print(f"OK Precision validacion: {metrics['final_val_accuracy']:.2%}")


if __name__ == "__main__":
    main()

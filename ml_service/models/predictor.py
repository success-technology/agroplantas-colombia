"""Carga y ejecuta los modelos MobileNetV2 de especie y estado fitosanitario."""

import json
import os
from pathlib import Path

import numpy as np
import tensorflow as tf
from PIL import Image
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2

from image_utils import tta_variants

IMG_SIZE = 224
MODELS_DIR = Path(__file__).resolve().parents[2] / "models"

SPECIES_MARGIN = 0.25


class ModelPredictor:
    """Mantiene los modelos en memoria y convierte imágenes en probabilidades."""

    def __init__(self, model_path: str | None = None):
        """Inicializa estado y carga primero el clasificador de condición."""
        self.model: tf.keras.Model | None = None
        self.class_names: list[str] = []

        self.species_model: tf.keras.Model | None = None
        self.species_class_names: list[str] = []

        self.model_loaded = False

        # Últimas probabilidades de especie calculadas en la inferencia.
        self.last_species_probabilities: np.ndarray | None = None

        self.load_model(model_path)
        self.load_species_model()

    def load_model(self, model_path: str | None = None):
        """Carga el modelo de 93 clases o prepara su arquitectura con pesos disponibles."""
        keras_path = MODELS_DIR / "plant_classifier.keras"
        weights_path = MODELS_DIR / "best_weights.keras"
        class_names_path = MODELS_DIR / "class_names.json"

        if class_names_path.exists():
            with open(class_names_path, encoding="utf-8") as f:
                self.class_names = self._load_ordered_names(json.load(f))
        else:
            self.class_names = []

        if keras_path.exists():
            self.model = tf.keras.models.load_model(str(keras_path))
            self.model_loaded = True
            print(
                f"Modelo de estado cargado: {keras_path} "
                f"({len(self.class_names)} clases)"
            )
            return

        if model_path and os.path.exists(model_path):
            self.model = tf.keras.models.load_model(model_path)
            self.model_loaded = True
            return

        if not self.class_names:
            raise RuntimeError(
                "No hay modelo entrenado. Ejecuta prepare_dataset.py "
                "y el notebook de entrenamiento."
            )

        num_classes = len(self.class_names)

        base_model = MobileNetV2(
            weights="imagenet",
            include_top=False,
            input_shape=(IMG_SIZE, IMG_SIZE, 3),
        )
        base_model.trainable = False

        inputs = tf.keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
        x = base_model(inputs, training=False)
        x = layers.GlobalAveragePooling2D()(x)
        x = layers.Dropout(0.3)(x)
        outputs = layers.Dense(num_classes, activation="softmax")(x)
        self.model = models.Model(inputs, outputs)

        if weights_path.exists() and num_classes >= 2:
            self.model.load_weights(str(weights_path))
            self.model_loaded = True

    @staticmethod
    def _load_ordered_names(raw):
        """Normaliza etiquetas JSON a una lista en el orden de salida Softmax."""
        if isinstance(raw, (list, tuple)):
            return list(raw)

        if isinstance(raw, dict):
            if all(str(i) in raw for i in range(len(raw))):
                return [raw[str(i)] for i in range(len(raw))]

            raise ValueError(
                "El archivo de clases debe contener una lista ordenada "
                "o un diccionario con índices numéricos."
            )

        raise ValueError(
            f"Formato inesperado para nombres de clase: {type(raw)}"
        )

    def load_species_model(self):
        """Carga opcionalmente el clasificador auxiliar de especies."""
        species_keras_path = MODELS_DIR / "species_classifier.keras"
        species_names_path = MODELS_DIR / "species_class_names.json"

        if not (
            species_keras_path.exists()
            and species_names_path.exists()
        ):
            print(
                "Aviso: no se encontró el clasificador de especie "
                "(etapa 1). Se predice solo con el modelo de estado."
            )
            return

        with open(species_names_path, encoding="utf-8") as f:
            self.species_class_names = self._load_ordered_names(
                json.load(f)
            )

        self.species_model = tf.keras.models.load_model(
            str(species_keras_path)
        )

        print(
            f"Modelo de especie cargado: {species_keras_path} "
            f"({len(self.species_class_names)} especies)"
        )

    def has_species_stage(self) -> bool:
        """Indica si se puede usar el filtro de especies en esta instancia."""
        return (
            self.species_model is not None
            and len(self.species_class_names) >= 2
        )

    @staticmethod
    def _species_of(class_name: str) -> str:
        """Obtiene la clave de especie antes del separador de condición."""
        return (
            class_name.split("___")[0]
            if "___" in class_name
            else class_name
        )

    def _apply_species_gate(
        self,
        state_probs: np.ndarray,
        species_probs: np.ndarray,
    ) -> np.ndarray:
        """Filtra y renormaliza clases de estado según la salida de especies."""
        top_species_prob = float(np.max(species_probs))

        keep_species = {
            self.species_class_names[i]
            for i, p in enumerate(species_probs)
            if p >= top_species_prob * SPECIES_MARGIN
        }

        mask = np.array(
            [
                1.0
                if self._species_of(c) in keep_species
                else 0.0
                for c in self.class_names
            ]
        )

        gated = state_probs * mask
        total = gated.sum()

        if total <= 0:
            return state_probs

        return gated / total

    def predict(
        self,
        image_array: np.ndarray,
    ) -> np.ndarray:
        """Ejecuta redes sobre un lote y aplica el filtro si existe segunda etapa."""
        if self.model is None:
            raise ValueError("El modelo no está cargado")

        state_probs = self.model.predict(
            image_array,
            verbose=0,
        )

        # Guardamos la salida REAL del modelo de especie.
        if self.has_species_stage():
            species_probs = self.species_model.predict(
                image_array,
                verbose=0,
            )

            self.last_species_probabilities = np.mean(
                species_probs,
                axis=0,
            )

            gated = np.stack(
                [
                    self._apply_species_gate(
                        state_probs[i],
                        species_probs[i],
                    )
                    for i in range(state_probs.shape[0])
                ]
            )

            return gated

        self.last_species_probabilities = None

        return state_probs

    def predict_image(
        self,
        pil_image: Image.Image,
    ) -> np.ndarray:
        """Preprocesa una foto, ejecuta inferencia y promedia las vistas generadas."""
        variants = tta_variants(pil_image)

        if not variants:
            raise ValueError(
                "No se pudo generar una vista válida de la imagen."
            )

        batch = np.stack(variants, axis=0)

        predictions = self.predict(batch)

        return np.mean(predictions, axis=0)

    def get_species_probabilities(self) -> np.ndarray | None:
        """Devuelve probabilidades de especie acotadas entre cero y uno."""
        if self.last_species_probabilities is None:
            return None

        return np.clip(
            self.last_species_probabilities,
            0.0,
            1.0,
        )

    def get_species_class_names(self) -> list[str]:
        """Devuelve etiquetas ordenadas de la etapa de especie."""
        return self.species_class_names

    def get_class_names(self) -> list[str]:
        """Devuelve etiquetas ordenadas de la etapa de condición."""
        return self.class_names

    def is_ready(self) -> bool:
        """Confirma que hay un modelo cargado y más de una clase utilizable."""
        return (
            self.model_loaded
            and len(self.class_names) >= 2
        )

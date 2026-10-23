"""
Entrenamiento CNN AgroPlantas Colombia
---------------------------------------

Etapa 1:
    Especie -> 21 clases

Etapa 2:
    Estado fitosanitario -> 93 clases

Características:
- MobileNetV2 + ImageNet
- Entrada 224x224
- preprocess_input
- Data augmentation solo en entrenamiento
- Class weights con límite para evitar pesos extremos
- EarlyStopping
- ReduceLROnPlateau
- ModelCheckpoint
- Fine-tuning de las últimas 30 capas
- Validación independiente
- No utiliza test durante el entrenamiento

Uso:

"""

from __future__ import annotations

import argparse    
import json
import math
from datetime import datetime
from pathlib import Path

import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.callbacks import (
    EarlyStopping,
    ModelCheckpoint,
    ReduceLROnPlateau,
)


# ============================================================
# CONFIGURACIÓN
# ============================================================

IMG_SIZE = 224
DEFAULT_BATCH = 32

DEFAULT_EPOCHS = 12
DEFAULT_FINE_TUNE_EPOCHS = 5

SEED = 42

# Evita que una clase con 5 imágenes tenga un peso
# exageradamente alto durante la función de pérdida.
MAX_CLASS_WEIGHT = 8.0


# ============================================================
# CATÁLOGO OFICIAL
# ============================================================

CLASS_NAMES = [
    "Algodon___Bacteriosis",
    "Algodon___Marchitez",
    "Algodon___RizadoViral",
    "Algodon___Sana",

    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
    "Apple___healthy",

    "Arroz___Bacteriosis",
    "Arroz___Blast",
    "Arroz___ManchaParda",
    "Arroz___Tungro",

    "Blueberry___healthy",

    "Cacao___Antracnosis",
    "Cacao___CSSVD",
    "Cacao___MazorcaNegra",
    "Cacao___PerforadorMazorca",
    "Cacao___SanaHoja",
    "Cacao___SanaMazorca",

    "Cafe___AcaroRojo",
    "Cafe___Cercospora",
    "Cafe___Minador",
    "Cafe___Phoma",
    "Cafe___Roya",
    "Cafe___Sana",

    "CanaDeAzucar___Amarillamiento",
    "CanaDeAzucar___Bacteriosis",
    "CanaDeAzucar___Mosaico",
    "CanaDeAzucar___PudricionRoja",
    "CanaDeAzucar___Roya",
    "CanaDeAzucar___Sana",

    "Citricos___Cancro",
    "Citricos___ManchaNegra",
    "Citricos___Melanosis",
    "Citricos___Sana",
    "Citricos___Verdeamiento",

    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight",
    "Corn_(maize)___healthy",

    "Frijol___ManchaAngular",
    "Frijol___Roya",
    "Frijol___Sana",

    "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy",

    "Guayaba___Cancro",
    "Guayaba___Fitoftora",
    "Guayaba___Mancha",
    "Guayaba___Momificacion",
    "Guayaba___PudricionEstilar",
    "Guayaba___Roya",
    "Guayaba___Sana",
    "Guayaba___Sarna",

    "Mango___Antracnosis",
    "Mango___CancroBacteriano",
    "Mango___FumaginaNegra",
    "Mango___Marchitez",
    "Mango___MildiuPolvoso",
    "Mango___MoscaAgalla",
    "Mango___PicudoCortador",
    "Mango___Sana",

    "Orange___Haunglongbing_(Citrus_greening)",

    "Papaya___InsectoPerforador",
    "Papaya___ManchaBacteriana",
    "Papaya___ManchaNecroticaAmarilla",
    "Papaya___Sana",

    "Platano___Cordana",
    "Platano___Pestalotiopsis",
    "Platano___Sana",
    "Platano___Sigatoka",

    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",

    "Raspberry___healthy",

    "Strawberry___Leaf_scorch",
    "Strawberry___healthy",

    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy",

    "Yuca___AcaroVerde",
    "Yuca___Bacteriosis",
    "Yuca___MosaicoViral",
    "Yuca___RayadoPardo",
    "Yuca___Sana",
]


# ============================================================
# ESPECIES
# ============================================================

SPECIES_NAMES = [
    "Algodon",
    "Apple",
    "Arroz",
    "Blueberry",
    "Cacao",
    "Cafe",
    "CanaDeAzucar",
    "Citricos",
    "Corn_(maize)",
    "Frijol",
    "Grape",
    "Guayaba",
    "Mango",
    "Orange",
    "Papaya",
    "Platano",
    "Potato",
    "Raspberry",
    "Strawberry",
    "Tomato",
    "Yuca",
]


def get_species_from_class(class_name: str) -> str:
    """
    Extrae la especie desde el nombre oficial de la clase.

    Ejemplo:
        Mango___Antracnosis
        -> Mango

        Tomato___Late_blight
        -> Tomato
    """

    return class_name.split("___", 1)[0]


# ============================================================
# MODELO
# ============================================================

def build_model(num_classes: int) -> tf.keras.Model:

    base = MobileNetV2(
        weights="imagenet",
        include_top=False,
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
    )

    base.trainable = False

    inputs = tf.keras.Input(
        shape=(IMG_SIZE, IMG_SIZE, 3)
    )

    x = base(inputs, training=False)

    x = layers.GlobalAveragePooling2D()(x)

    x = layers.Dropout(0.30)(x)

    x = layers.Dense(
        256,
        activation="relu",
    )(x)

    x = layers.Dropout(0.20)(x)

    outputs = layers.Dense(
        num_classes,
        activation="softmax",
    )(x)

    return models.Model(
        inputs=inputs,
        outputs=outputs,
    )


# ============================================================
# AUGMENTATION
# ============================================================

def build_augmentation():

    return tf.keras.Sequential(
        [
            layers.RandomFlip(
                "horizontal"
            ),

            layers.RandomRotation(
                0.08
            ),

           layers.RandomZoom(
                height_factor=(-0.05, 0.08),
                width_factor=(-0.05, 0.08),
            ),

            layers.RandomTranslation(
                height_factor=0.08,
                width_factor=0.08,
            ),

            layers.RandomContrast(
                0.10
            ),
        ],
        name="data_augmentation",
    )


# ============================================================
# DATASET BASE
# ============================================================

def load_dataset(
    directory: Path,
    class_names: list[str],
    batch_size: int,
    shuffle: bool,
):

    return tf.keras.utils.image_dataset_from_directory(
        directory,
        labels="inferred",
        label_mode="int",
        class_names=class_names,
        image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=batch_size,
        shuffle=shuffle,
        seed=SEED if shuffle else None,
    )


# ============================================================
# PREPROCESAMIENTO
# ============================================================

def preprocess_dataset(
    dataset,
    augmentation=None,
):

    def process(images, labels):

        images = tf.cast(
            images,
            tf.float32,
        )

        if augmentation is not None:
            images = augmentation(
                images,
                training=True,
            )

        images = preprocess_input(
            images
        )

        return images, labels

    return dataset.map(
        process,
        num_parallel_calls=tf.data.AUTOTUNE,
    )


# ============================================================
# CLASS WEIGHTS
# ============================================================

def calculate_class_weights(
    dataset,
    num_classes: int,
):

    counts = [0] * num_classes

    for _, labels in dataset:

        labels_np = labels.numpy()

        for label in labels_np:
            counts[int(label)] += 1

    total = sum(counts)

    if total == 0:
        raise RuntimeError(
            "El dataset de entrenamiento está vacío."
        )

    weights = {}

    for class_id, count in enumerate(counts):

        if count == 0:
            weights[class_id] = 1.0
            continue

        # Peso balanceado estándar.
        weight = total / (
            num_classes * count
        )

        # Limitar pesos extremos.
        weight = min(
            weight,
            MAX_CLASS_WEIGHT,
        )

        weights[class_id] = float(weight)

    return weights, counts


# ============================================================
# CLASS WEIGHTS POR ESPECIE
# ============================================================

def calculate_species_weights(
    state_dataset,
    state_class_names,
):

    species_to_id = {
        name: i
        for i, name in enumerate(SPECIES_NAMES)
    }

    counts = [0] * len(SPECIES_NAMES)

    for _, state_labels in state_dataset:

        for state_id in state_labels.numpy():

            state_name = state_class_names[
                int(state_id)
            ]

            species = get_species_from_class(
                state_name
            )

            species_id = species_to_id[
                species
            ]

            counts[species_id] += 1

    total = sum(counts)

    weights = {}

    for species_id, count in enumerate(counts):

        if count == 0:
            weights[species_id] = 1.0
            continue

        weight = total / (
            len(SPECIES_NAMES) * count
        )

        weight = min(
            weight,
            MAX_CLASS_WEIGHT,
        )

        weights[species_id] = float(weight)

    return weights, counts


# ============================================================
# CONVERTIR LABEL DE ESTADO -> ESPECIE
# ============================================================

def convert_state_to_species_dataset(
    dataset,
    state_class_names,
):

    species_to_id = {
        name: i
        for i, name in enumerate(SPECIES_NAMES)
    }

    mapping = []

    for state_name in state_class_names:

        species = get_species_from_class(
            state_name
        )

        if species not in species_to_id:

            raise RuntimeError(
                f"Especie no encontrada: {species}"
            )

        mapping.append(
            species_to_id[species]
        )

    mapping = tf.constant(
        mapping,
        dtype=tf.int32,
    )

    def convert(images, state_labels):

        species_labels = tf.gather(
            mapping,
            state_labels,
        )

        return images, species_labels

    return dataset.map(
        convert,
        num_parallel_calls=tf.data.AUTOTUNE,
    )


# ============================================================
# CALLBACKS
# ============================================================

def create_callbacks(
    output_dir: Path,
    checkpoint_name: str,
):

    return [
        EarlyStopping(
            monitor="val_loss",
            patience=6,
            restore_best_weights=True,
            verbose=1,
        ),

        ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=3,
            min_lr=1e-7,
            verbose=1,
        ),

        ModelCheckpoint(
            filepath=str(
                output_dir / checkpoint_name
            ),
            monitor="val_loss",
            save_best_only=True,
            verbose=1,
        ),
    ]


# ============================================================
# ENTRENAMIENTO DE UNA ETAPA
# ============================================================

def train_stage(
    name: str,
    model: tf.keras.Model,
    train_dataset,
    val_dataset,
    class_weights,
    output_dir: Path,
    initial_epochs: int,
    fine_tune_epochs: int,
):

    print("")
    print("=" * 70)
    print(f"ENTRENAMIENTO: {name}")
    print("=" * 70)

    # --------------------------------------------------------
    # ETAPA INICIAL
    # --------------------------------------------------------

    model.compile(
        optimizer=tf.keras.optimizers.Adam(
            learning_rate=1e-3
        ),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    callbacks = create_callbacks(
        output_dir,
        (
            "species_best_weights.keras"
            if name == "species"
            else "best_weights.keras"
        ),
    )

    print("")
    print("Fase 1: MobileNetV2 congelado")

    history_initial = model.fit(
        train_dataset,
        validation_data=val_dataset,
        epochs=initial_epochs,
        class_weight=class_weights,
        callbacks=callbacks,
    )

    initial_epochs_trained = len(
        history_initial.history["loss"]
    )

    # --------------------------------------------------------
    # FINE-TUNING
    # --------------------------------------------------------

    base = None

    for layer in model.layers:

        if isinstance(
            layer,
            tf.keras.Model,
        ):
            if "mobilenet" in layer.name.lower():
                base = layer
                break

    if base is None:
        raise RuntimeError(
            "No se encontró el backbone MobileNetV2."
        )

    print("")
    print("Fase 2: Fine-tuning")

    base.trainable = True

    # Congelar todo excepto las últimas 30 capas.
    for layer in base.layers[:-30]:
        layer.trainable = False

    # BatchNormalization permanece congelada
    # para evitar inestabilidad con datasets pequeños.
    for layer in base.layers[-30:]:

        if isinstance(
            layer,
            layers.BatchNormalization,
        ):
            layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(
            learning_rate=1e-5
        ),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    history_finetune = model.fit(
        train_dataset,
        validation_data=val_dataset,
        epochs=fine_tune_epochs,
        class_weight=class_weights,
        callbacks=callbacks,
    )

    fine_tune_epochs_trained = len(
        history_finetune.history["loss"]
    )

    # --------------------------------------------------------
    # RECUPERAR MEJOR CHECKPOINT
    # --------------------------------------------------------

    checkpoint_name = (
        "species_best_weights.keras"
        if name == "species"
        else "best_weights.keras"
    )

    checkpoint_path = (
        output_dir / checkpoint_name
    )

    if checkpoint_path.exists():

        print(
            f"\nCargando mejor modelo: "
            f"{checkpoint_path}"
        )

        model.load_weights(
            checkpoint_path
        )

    # --------------------------------------------------------
    # MÉTRICAS
    # --------------------------------------------------------

    final_train_accuracy = float(
        history_finetune.history[
            "accuracy"
        ][-1]
    )

    final_val_accuracy = float(
        history_finetune.history[
            "val_accuracy"
        ][-1]
    )

    return {
        "model": model,
        "initial_epochs_trained": initial_epochs_trained,
        "fine_tune_epochs_trained": fine_tune_epochs_trained,
        "final_train_accuracy": final_train_accuracy,
        "final_val_accuracy": final_val_accuracy,
    }


# ============================================================
# MAIN
# ============================================================

def main():

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--data",
        default=r"C:\Users\maryoris copete\Downloads\AgroPlantas_Final",
    )

    parser.add_argument(
        "--output",
        default="models",
    )

    parser.add_argument(
        "--epochs",
        type=int,
        default=DEFAULT_EPOCHS,
    )

    parser.add_argument(
        "--fine-tune-epochs",
        type=int,
        default=DEFAULT_FINE_TUNE_EPOCHS,
    )

    parser.add_argument(
        "--batch-size",
        type=int,
        default=DEFAULT_BATCH,
    )

    args = parser.parse_args()

    data_dir = Path(
        args.data
    )

    output_dir = Path(
        args.output
    )

    output_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    # ========================================================
    # VALIDACIONES
    # ========================================================

    for split in (
        "train",
        "val",
        "test",
    ):

        split_dir = data_dir / split

        if not split_dir.exists():

            raise SystemExit(
                f"No existe: {split_dir}"
            )

    # ========================================================
    # VERIFICAR LAS 93 CLASES
    # ========================================================

    available_classes = sorted(
        [
            directory.name
            for directory in (
                data_dir / "train"
            ).iterdir()
            if directory.is_dir()
        ]
    )

    expected_classes = sorted(
        CLASS_NAMES
    )

    if available_classes != expected_classes:

        missing = sorted(
            set(expected_classes)
            - set(available_classes)
        )

        extra = sorted(
            set(available_classes)
            - set(expected_classes)
        )

        raise SystemExit(
            "\nError en las clases.\n"
            f"Faltantes: {missing}\n"
            f"Extra: {extra}\n"
        )

    print("")
    print("=" * 70)
    print("AGROPLANTAS COLOMBIA")
    print("ENTRENAMIENTO DE DOS ETAPAS")
    print("=" * 70)

    print("")
    print(f"Dataset : {data_dir}")
    print(f"Clases  : {len(CLASS_NAMES)}")
    print(f"Especies: {len(SPECIES_NAMES)}")

    # ========================================================
    # DATASETS DE ESTADO
    # ========================================================

    print("")
    print("Cargando dataset de estados...")

    train_state_raw = load_dataset(
        data_dir / "train",
        CLASS_NAMES,
        args.batch_size,
        shuffle=True,
    )

    val_state_raw = load_dataset(
        data_dir / "val",
        CLASS_NAMES,
        args.batch_size,
        shuffle=False,
    )

    # ========================================================
    # CLASS WEIGHTS ESTADO
    # ========================================================

    print("")
    print("Calculando class weights de estados...")

    state_weights, state_counts = (
        calculate_class_weights(
            train_state_raw,
            len(CLASS_NAMES),
        )
    )

    # ========================================================
    # DATA AUGMENTATION
    # ========================================================

    augmentation = build_augmentation()

    train_state = preprocess_dataset(
        train_state_raw,
        augmentation,
    )

    val_state = preprocess_dataset(
        val_state_raw,
        None,
    )

    train_state = train_state.prefetch(
        tf.data.AUTOTUNE
    )

    val_state = val_state.prefetch(
        tf.data.AUTOTUNE
    )

    # ========================================================
    # ETAPA 1: ESPECIE
    # ========================================================

    print("")
    print("=" * 70)
    print("ETAPA 1: CLASIFICACIÓN DE ESPECIE")
    print("=" * 70)

    train_species = convert_state_to_species_dataset(
        train_state,
        CLASS_NAMES,
    )

    val_species = convert_state_to_species_dataset(
        val_state,
        CLASS_NAMES,
    )

    species_weights, species_counts = (
        calculate_species_weights(
            train_state_raw,
            CLASS_NAMES,
        )
    )

    species_model = build_model(
        len(SPECIES_NAMES)
    )

    species_result = train_stage(
        name="species",
        model=species_model,
        train_dataset=train_species,
        val_dataset=val_species,
        class_weights=species_weights,
        output_dir=output_dir,
        initial_epochs=args.epochs,
        fine_tune_epochs=args.fine_tune_epochs,
    )

    species_model = species_result["model"]

    species_model_path = (
        output_dir /
        "species_classifier.keras"
    )

    species_model.save(
        species_model_path
    )

    with open(
        output_dir / "species_class_names.json",
        "w",
        encoding="utf-8",
    ) as f:

        json.dump(
            SPECIES_NAMES,
            f,
            ensure_ascii=False,
            indent=2,
        )

    print("")
    print(
        f"OK Especie guardada: "
        f"{species_model_path}"
    )

    # ========================================================
    # ETAPA 2: ESTADO FITOSANITARIO
    # ========================================================

    print("")
    print("=" * 70)
    print("ETAPA 2: CLASIFICACIÓN DE ESTADO")
    print("=" * 70)

    state_model = build_model(
        len(CLASS_NAMES)
    )

    state_result = train_stage(
        name="state",
        model=state_model,
        train_dataset=train_state,
        val_dataset=val_state,
        class_weights=state_weights,
        output_dir=output_dir,
        initial_epochs=args.epochs,
        fine_tune_epochs=args.fine_tune_epochs,
    )

    state_model = state_result["model"]

    state_model_path = (
        output_dir /
        "plant_classifier.keras"
    )

    state_model.save(
        state_model_path
    )

    with open(
        output_dir / "class_names.json",
        "w",
        encoding="utf-8",
    ) as f:

        json.dump(
            CLASS_NAMES,
            f,
            ensure_ascii=False,
            indent=2,
        )

    print("")
    print(
        f"OK Estado guardado: "
        f"{state_model_path}"
    )

    # ========================================================
    # MÉTRICAS
    # ========================================================

    metrics = {

        "trained_at":
            datetime.now().isoformat(),

        "architecture":
            "MobileNetV2 en dos etapas "
            "(especie -> estado)",

        "preprocessing":
            "tensorflow.keras.applications.mobilenet_v2.preprocess_input",

        "img_size":
            IMG_SIZE,

        "batch_size":
            args.batch_size,

        "num_species":
            len(SPECIES_NAMES),

        "num_state_classes":
            len(CLASS_NAMES),

        "species_stage": {

            "class_names":
                SPECIES_NAMES,

            "class_counts":
                species_counts,

            "class_weights":
                {
                    SPECIES_NAMES[k]: v
                    for k, v in species_weights.items()
                },

            "final_train_accuracy":
                species_result[
                    "final_train_accuracy"
                ],

            "final_val_accuracy":
                species_result[
                    "final_val_accuracy"
                ],

            "initial_epochs_trained":
                species_result[
                    "initial_epochs_trained"
                ],

            "fine_tune_epochs_trained":
                species_result[
                    "fine_tune_epochs_trained"
                ],
        },

        "state_stage": {

            "class_names":
                CLASS_NAMES,

            "class_counts":
                state_counts,

            "class_weights":
                {
                    CLASS_NAMES[k]: v
                    for k, v in state_weights.items()
                },

            "final_train_accuracy":
                state_result[
                    "final_train_accuracy"
                ],

            "final_val_accuracy":
                state_result[
                    "final_val_accuracy"
                ],

            "initial_epochs_trained":
                state_result[
                    "initial_epochs_trained"
                ],

            "fine_tune_epochs_trained":
                state_result[
                    "fine_tune_epochs_trained"
                ],
        },

        "augmentation": [
            "RandomFlip(horizontal)",
            "RandomRotation(0.08)",
            "RandomZoom",
            "RandomTranslation",
            "RandomContrast(0.10)",
        ],

        "fine_tuning":
            "Últimas 30 capas de MobileNetV2, "
            "BatchNormalization congelada",

        "max_class_weight":
            MAX_CLASS_WEIGHT,

        "dataset":
            str(data_dir),
    }

    with open(
        output_dir / "training_metrics.json",
        "w",
        encoding="utf-8",
    ) as f:

        json.dump(
            metrics,
            f,
            ensure_ascii=False,
            indent=2,
        )

    # ========================================================
    # RESUMEN
    # ========================================================

    print("")
    print("=" * 70)
    print("ENTRENAMIENTO COMPLETADO")
    print("=" * 70)

    print("")
    print(
        f"Especie - train accuracy: "
        f"{species_result['final_train_accuracy']:.2%}"
    )

    print(
        f"Especie - val accuracy:   "
        f"{species_result['final_val_accuracy']:.2%}"
    )

    print("")

    print(
        f"Estado - train accuracy:   "
        f"{state_result['final_train_accuracy']:.2%}"
    )

    print(
        f"Estado - val accuracy:     "
        f"{state_result['final_val_accuracy']:.2%}"
    )

    print("")
    print(
        f"Modelo especie: "
        f"{species_model_path}"
    )

    print(
        f"Modelo estado:  "
        f"{state_model_path}"
    )

    print(
        f"Métricas:       "
        f"{output_dir / 'training_metrics.json'}"
    )


if __name__ == "__main__":
    main()
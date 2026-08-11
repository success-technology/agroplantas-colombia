"""
Descarga el dataset público 'cassava' de TensorFlow Datasets (Makerere
University AI Lab + NaCRRI Uganda — fotos reales de campo, anotadas por
expertos) y lo exporta como carpetas de imágenes, en el mismo formato
"folder" que ya usan el resto de fuentes de tu manifiesto (Cafe, Cacao,
Mango, etc.): una subcarpeta por estado, nombrada tal cual aparece en
label_map.

Reemplaza a la fuente anterior de Yuca (tipo "csv" en el manifiesto), que
tenía etiquetas inconsistentes confirmadas visualmente.

Uso:
    pip install tensorflow-datasets --break-system-packages   (si hace falta)
    python descargar_yuca_tfds.py

Genera la carpeta ./yuca_tfds/ con esta estructura (mueve esta carpeta a
data/raw/yuca_tfds antes del siguiente paso):
    yuca_tfds/
      Bacteriosis/
      RayadoPardo/
      AcaroVerde/
      MosaicoViral/
      Sana/

Después, en data/dataset_manifest.json, reemplaza la fuente "Yuca" (tipo
"csv") por:

    {
      "crop": "Yuca",
      "type": "folder",
      "path": "data/raw/yuca_tfds",
      "label_map": {
        "Bacteriosis": "Bacteriosis",
        "RayadoPardo": "RayadoPardo",
        "AcaroVerde": "AcaroVerde",
        "MosaicoViral": "MosaicoViral",
        "Sana": "Sana"
      },
      "_nota": "Dataset 'cassava' de TensorFlow Datasets (Makerere AI Lab + NaCRRI Uganda), reemplaza a la fuente CSV anterior por etiquetas inconsistentes confirmadas visualmente."
    }

Y vuelve a correr prepare_dataset.py.
"""
from pathlib import Path

import tensorflow_datasets as tfds
from PIL import Image

OUTPUT_DIR = Path("./yuca_tfds")

# Mapeo de las etiquetas originales del dataset (inglés, siglas) a los
# nombres de estado que ya usa el proyecto (español, mismos que las otras
# 4 clases de Yuca que SÍ estaban bien: no se tocan sus nombres).
LABEL_MAP = {
    "cbb": "Bacteriosis",       # Cassava Bacterial Blight
    "cbsd": "RayadoPardo",      # Cassava Brown Streak Disease
    "cgm": "AcaroVerde",        # Cassava Green Mite/Mottle
    "cmd": "MosaicoViral",      # Cassava Mosaic Disease
    "healthy": "Sana",
}


def export_split(ds, class_names, split_name: str, counters: dict):
    for example in tfds.as_numpy(ds):
        label_idx = example["label"]
        label_name = class_names[label_idx]
        if label_name not in LABEL_MAP:
            continue  # clase "unknown" u otra que no nos interesa

        estado = LABEL_MAP[label_name]
        class_dir = OUTPUT_DIR / estado
        class_dir.mkdir(parents=True, exist_ok=True)

        counters[estado] = counters.get(estado, 0) + 1
        out_path = class_dir / f"{split_name}_{counters[estado]:05d}.jpg"

        img = Image.fromarray(example["image"]).convert("RGB")
        img.save(out_path, "JPEG", quality=90)


def main():
    print("Descargando dataset 'cassava' de TensorFlow Datasets...")
    print("(la primera vez puede tardar varios minutos, según tu conexión)")

    ds_train, info = tfds.load("cassava", split="train", with_info=True)
    ds_val = tfds.load("cassava", split="validation")
    ds_test = tfds.load("cassava", split="test")

    class_names = info.features["label"].names
    print(f"Clases originales del dataset: {class_names}")

    counters = {}
    export_split(ds_train, class_names, "train", counters)
    print("Split train exportado.")
    export_split(ds_val, class_names, "val", counters)
    print("Split validation exportado.")
    export_split(ds_test, class_names, "test", counters)
    print("Split test exportado.")

    print("\nResumen de imágenes exportadas por estado:")
    for estado, count in sorted(counters.items()):
        print(f"  {estado}: {count} imágenes")

    print(f"\nListo. Carpeta generada en: {OUTPUT_DIR.resolve()}")
    print("Siguiente paso: mueve esta carpeta a data/raw/yuca_tfds, reemplaza")
    print("la fuente 'Yuca' (tipo csv) en data/dataset_manifest.json por una")
    print("de tipo 'folder' apuntando ahí (ver el bloque JSON de ejemplo al")
    print("inicio de este archivo), y vuelve a correr prepare_dataset.py.")


if __name__ == "__main__":
    main()
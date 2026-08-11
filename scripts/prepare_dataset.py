"""
Prepara el dataset de Kaggle para entrenamiento.

MODO 1 — Fuente única (comportamiento original, sin cambios):
  python scripts/prepare_dataset.py --input data/raw

  Estructuras soportadas:
    1. ImageFolder: data/raw/<clase>/*.jpg
    2. Plant Seedlings: data/raw/train/<especie>/
    3. PlantVillage: data/raw/PlantVillage/train/<Cultivo___Estado>/
    4. PlantVillage directo: data/raw/train/<Cultivo___Estado>/

MODO 2 — Múltiples fuentes combinadas (nuevo):
  python scripts/prepare_dataset.py --manifest data/dataset_manifest.json --dry-run
  python scripts/prepare_dataset.py --manifest data/dataset_manifest.json

  El manifiesto (JSON) describe varias fuentes de dataset, cada una con su
  propio cultivo y su propio mapeo de etiquetas. Cada fuente puede ser:
    - type "folder": carpetas por clase (como PlantVillage)
    - type "csv": imágenes en una carpeta plana + un CSV con las etiquetas
      (así viene, por ejemplo, el dataset "Cassava Leaf Disease Classification")

  Usa --dry-run primero para ver qué clases detecta ANTES de copiar archivos.
  Si alguna carpeta/valor no tiene mapeo en el manifiesto, se avisa por
  consola y se usa el nombre original tal cual (para que nada se pierda
  silenciosamente).

Salida (ambos modos): data/processed/{train,val,test}/<clase>/
"""
from __future__ import annotations

import argparse
import csv
import json
import random
import shutil
from pathlib import Path

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".JPG", ".JPEG", ".PNG"}


def _collect_images(folder: Path) -> list[Path]:
    return [
        f for f in folder.rglob("*")
        if f.is_file() and f.suffix in IMAGE_EXTENSIONS
    ]


def _is_class_folder(folder: Path) -> bool:
    """Carpeta de clase: contiene imágenes directamente o en un nivel."""
    if not folder.is_dir() or folder.name.startswith("."):
        return False
    images = _collect_images(folder)
    return len(images) > 0


def _scan_train_root(train_root: Path) -> dict[str, list[Path]]:
    """Escanea un directorio train/ con subcarpetas por clase."""
    classes: dict[str, list[Path]] = {}
    for item in sorted(train_root.iterdir()):
        if not _is_class_folder(item):
            continue
        images = _collect_images(item)
        if images:
            classes[item.name] = images
    return classes


def find_class_folders(root: Path) -> dict[str, list[Path]]:
    """Detecta carpetas de clases en múltiples layouts de Kaggle."""
    search_paths: list[Path] = []

    # Rutas típicas PlantVillage / Kaggle
    for candidate in [
        root,
        root / "train",
        root / "PlantVillage" / "train",
        root / "plantvillage" / "train",
    ]:
        if candidate.is_dir():
            search_paths.append(candidate)

    # Buscar cualquier carpeta train/ con ≥3 subcarpetas con imágenes
    for train_dir in root.rglob("train"):
        if train_dir.is_dir() and train_dir not in search_paths:
            subdirs = [d for d in train_dir.iterdir() if d.is_dir()]
            if len(subdirs) >= 3:
                search_paths.append(train_dir)

    best: dict[str, list[Path]] = {}
    for search_root in search_paths:
        found = _scan_train_root(search_root)
        if len(found) > len(best):
            best = found

    # Fallback: carpetas de clase directamente bajo root
    if len(best) < 2:
        direct: dict[str, list[Path]] = {}
        for item in sorted(root.iterdir()):
            if _is_class_folder(item):
                direct[item.name] = _collect_images(item)
        if len(direct) > len(best):
            best = direct

    return best


# ---------------------------------------------------------------------------
# Modo multi-fuente (manifiesto)
# ---------------------------------------------------------------------------

def _normalize(s: str) -> str:
    """Normaliza un nombre para comparar sin importar mayúsculas, espacios,
    guiones o guiones bajos: 'Coffee Rust' y 'coffee_rust' quedan iguales."""
    return "".join(ch for ch in s.lower() if ch.isalnum())


def _map_label(raw_name: str, label_map: dict[str, str]) -> tuple[str, bool]:
    """Empareja raw_name contra las claves de label_map de forma flexible.
    Devuelve (nombre_final, se_encontro_mapeo).

    Orden de prioridad (importante): coincidencia EXACTA primero. Sin esto,
    una carpeta genérica como 'Tomato_leaf' (sana) podía quedar atrapada por
    una clave más larga y específica como 'Tomato leaf bacterial spot' —
    porque 'tomatoleaf' es subcadena de 'tomatoleafbacterialspot' — y
    terminaba mal etiquetada como enferma. Bug real encontrado en PlantDoc."""
    norm_raw = _normalize(raw_name)

    # 1) Coincidencia exacta — máxima prioridad, sin ambigüedad posible
    for key in label_map:
        if _normalize(key) == norm_raw:
            return label_map[key], True

    # 2) La clave del label_map está contenida en el nombre de carpeta
    #    (ej. carpeta 'healthy_leaf' contiene la clave 'healthy')
    best_key = None
    best_len = 0
    for key in label_map:
        norm_key = _normalize(key)
        if norm_key and norm_key in norm_raw:
            if len(norm_key) > best_len:
                best_key = key
                best_len = len(norm_key)
    if best_key is not None:
        return label_map[best_key], True

    # 3) Último recurso: el nombre de carpeta está contenido en una clave
    #    más larga (menos confiable — puede dar falsos positivos con
    #    nombres cortos genéricos, por eso va al final y no por longitud)
    for key in label_map:
        norm_key = _normalize(key)
        if norm_key and norm_raw in norm_key:
            return label_map[key], True

    return raw_name, False


def scan_folder_source(source: dict) -> dict[str, list[Path]]:
    """Fuente tipo 'folder': carpetas por clase (como PlantVillage)."""
    path = Path(source["path"])
    if not path.exists():
        print(f"  ! Ruta no encontrada, se omite: {path}")
        return {}
    crop = source["crop"]
    label_map = source.get("label_map", {})
    raw_classes = find_class_folders(path)

    mapped: dict[str, list[Path]] = {}
    for raw_name, images in raw_classes.items():
        mapped_label, found = _map_label(raw_name, label_map)
        if not found and label_map:
            print(f"  ! Sin mapeo para carpeta '{raw_name}' en {crop} "
                  f"— se usa tal cual. Revisa el manifiesto si no es correcto.")
        final_name = f"{crop}___{mapped_label}"
        mapped.setdefault(final_name, []).extend(images)
    return mapped


def scan_remap_source(source: dict) -> dict[str, list[Path]]:
    """Fuente tipo 'remap': igual que 'folder', pero el label_map apunta
    DIRECTAMENTE al nombre final de clase ya existente (sin agregarle
    prefijo de cultivo). Sirve para sumar imagenes de campo a una clase
    que ya viene de otra fuente (ej. PlantDoc reforzando Corn_(maize)___healthy)."""
    path = Path(source["path"])
    if not path.exists():
        print(f"  ! Ruta no encontrada, se omite: {path}")
        return {}
    label_map = source.get("label_map", {})
    raw_classes = find_class_folders(path)

    mapped: dict[str, list[Path]] = {}
    for raw_name, images in raw_classes.items():
        final_name, found = _map_label(raw_name, label_map)
        if not found:
            print(f"  ! Sin mapeo para carpeta '{raw_name}' — se omite (no se sabe a qué clase existente pertenece).")
            continue
        mapped.setdefault(final_name, []).extend(images)
    return mapped


def scan_csv_source(source: dict) -> dict[str, list[Path]]:
    """Fuente tipo 'csv': imágenes en carpeta plana + CSV con las etiquetas
    (formato del dataset 'Cassava Leaf Disease Classification', entre otros)."""
    path = Path(source["path"])
    csv_path = path / source["csv_file"]
    images_dir = path / source["images_subdir"]
    if not csv_path.exists() or not images_dir.exists():
        print(f"  ! CSV o carpeta de imágenes no encontrados, se omite: {path}")
        print(f"    Esperaba: {csv_path} y {images_dir}")
        return {}

    crop = source["crop"]
    label_map = source.get("label_map", {})
    image_col = source.get("image_col", "image_id")
    label_col = source.get("label_col", "label")

    mapped: dict[str, list[Path]] = {}
    unmapped_seen: set[str] = set()
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            img_path = images_dir / row[image_col]
            if not img_path.exists():
                continue
            raw_label = str(row[label_col])
            mapped_label, found = _map_label(raw_label, label_map)
            if not found and raw_label not in unmapped_seen:
                unmapped_seen.add(raw_label)
                print(f"  ! Sin mapeo para etiqueta '{raw_label}' en {crop} "
                      f"— se usa tal cual. Revisa el manifiesto si no es correcto.")
            final_name = f"{crop}___{mapped_label}"
            mapped.setdefault(final_name, []).append(img_path)
    return mapped


def scan_raw_source(source: dict) -> dict[str, list[Path]]:
    """Fuente tipo 'raw': reutiliza tal cual el escaneo original de
    find_class_folders(), SIN agregar prefijo de cultivo ni renombrar nada.
    Pensada para reincorporar un dataset que ya trae sus clases completas
    (como PlantVillage, con carpetas 'Tomato___healthy')."""
    path = Path(source["path"])
    if not path.exists():
        print(f"  ! Ruta no encontrada, se omite: {path}")
        return {}
    return find_class_folders(path)


def load_manifest(manifest_path: Path) -> list[dict]:
    with open(manifest_path, encoding="utf-8") as f:
        data = json.load(f)
    return data["sources"]


def merge_sources(sources: list[dict]) -> dict[str, list[Path]]:
    combined: dict[str, list[Path]] = {}
    for source in sources:
        crop = source.get("crop", "?")
        stype = source.get("type", "folder")
        print(f"\nEscaneando fuente: {crop}  (ruta={source['path']}, tipo={stype})")
        if stype == "csv":
            found = scan_csv_source(source)
        elif stype == "raw":
            found = scan_raw_source(source)
        elif stype == "remap":
            found = scan_remap_source(source)
        else:
            found = scan_folder_source(source)
        for name, images in found.items():
            combined.setdefault(name, []).extend(images)
        total = sum(len(v) for v in found.values())
        print(f"  -> {len(found)} clase(s), {total} imagen(es)")
    return combined


# ---------------------------------------------------------------------------
# Split y copia (común a ambos modos)
# ---------------------------------------------------------------------------

def split_and_copy(
    classes: dict[str, list[Path]],
    output_dir: Path,
    train_ratio: float,
    val_ratio: float,
    seed: int,
    max_per_class: int | None,
) -> dict[str, int]:
    random.seed(seed)
    stats = {"train": 0, "val": 0, "test": 0, "classes": len(classes)}

    for class_name, images in classes.items():
        shuffled = images.copy()
        random.shuffle(shuffled)
        if max_per_class and len(shuffled) > max_per_class:
            shuffled = shuffled[:max_per_class]

        n = len(shuffled)
        if n == 0:
            continue

        n_train = max(1, int(n * train_ratio))
        n_val = max(1, int(n * val_ratio)) if n > 2 else 0
        n_test = n - n_train - n_val
        if n_test < 0:
            n_test = 0
            n_val = n - n_train

        splits = {
            "train": shuffled[:n_train],
            "val": shuffled[n_train : n_train + n_val],
            "test": shuffled[n_train + n_val :],
        }

        # Sanitiza el nombre de clase para usarlo como nombre de archivo
        safe_class_name = class_name.replace("/", "-").replace("\\", "-")

        for split_name, files in splits.items():
            if not files:
                continue
            dest_dir = output_dir / split_name / class_name
            dest_dir.mkdir(parents=True, exist_ok=True)
            for i, src in enumerate(files):
                dest = dest_dir / f"{safe_class_name}_{i}{src.suffix.lower()}"
                shutil.copy2(src, dest)
                stats[split_name] += 1

    return stats


def main():
    parser = argparse.ArgumentParser(description="Preparar dataset de plantas desde Kaggle")
    parser.add_argument("--input", default="data/raw", help="Carpeta con dataset descomprimido (modo fuente única)")
    parser.add_argument("--manifest", default=None, help="JSON con múltiples fuentes a combinar (modo multi-fuente)")
    parser.add_argument("--dry-run", action="store_true", help="Solo muestra qué se detectaría, sin copiar archivos")
    parser.add_argument("--output", default="data/processed", help="Carpeta de salida")
    parser.add_argument("--train-ratio", type=float, default=0.7)
    parser.add_argument("--val-ratio", type=float, default=0.15)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument(
        "--max-per-class",
        type=int,
        default=400,
        help="Máximo imágenes por clase (0 = todas). Default 400 para entrenar más rápido "
             "y equilibrar clases con muy distinto tamaño (ej. Yuca 21k vs Banano 900).",
    )
    args = parser.parse_args()

    if args.manifest:
        manifest_path = Path(args.manifest)
        if not manifest_path.exists():
            raise SystemExit(f"No existe el manifiesto: {manifest_path}")
        with open(manifest_path, encoding="utf-8") as f:
            manifest_data = json.load(f)
        sources = manifest_data.get("sources", [])
        classes = merge_sources(sources)

        exclude = set(manifest_data.get("exclude_classes", []))
        if exclude:
            removed = [name for name in classes if name in exclude]
            for name in removed:
                del classes[name]
            print(f"\nExcluidas por manifiesto ({len(removed)}): {', '.join(sorted(removed))}")
    else:
        root = Path(args.input)
        if not root.exists():
            raise SystemExit(f"No existe {root}. Ver docs/GUIA_DATASET.md")
        classes = find_class_folders(root)

    if len(classes) < 2:
        raise SystemExit(
            f"Solo se encontraron {len(classes)} clase(s).\n"
            "Revisa las rutas de entrada/manifiesto."
        )

    print(f"\n{'=' * 60}")
    print(f"TOTAL COMBINADO: {len(classes)} clases")
    print(f"{'=' * 60}")
    for name in sorted(classes.keys()):
        print(f"  - {name}: {len(classes[name])} imagen(es)")

    if args.dry_run:
        print("\n(dry-run) No se copió ningún archivo. Ajusta el manifiesto si algo se ve mal.")
        return

    output = Path(args.output)
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)

    max_pc = args.max_per_class if args.max_per_class > 0 else None
    stats = split_and_copy(
        classes, output, args.train_ratio, args.val_ratio, args.seed, max_pc
    )

    print(f"\nOK {stats['classes']} clases procesadas")
    print(f"  Train: {stats['train']} | Val: {stats['val']} | Test: {stats['test']}")
    print(f"  Salida: {output.resolve()}")
    

if __name__ == "__main__":
    main() 
"""
Reorganiza el dataset "Sugarcane Leaf Disease Dataset" (Mendeley, 9424skmnrk)
descargado en Windows, al esquema de carpetas que espera prepare_dataset.py
para la fuente de CañaDeAzúcar (tipo "folder").

REEMPLAZA por completo las subcarpetas Sana/Mosaico/PudricionRoja/Roya/
Amarillamiento con las fotos nuevas. NO toca Bacteriosis (se queda igual,
ya tiene buen desempeño).

AJUSTA estas dos rutas antes de correr, según lo que confirmes:

    SOURCE_DIR  -> donde descomprimiste el dataset de Mendeley
                   (la carpeta que tiene Healthy/Mosaic/RedRot/Rust/Yellow)
    TARGET_DIR  -> la carpeta actual de CañaDeAzúcar dentro de tu data/raw
                   (confirma el nombre exacto antes de correr este script)

Uso:
    python reorganizar_cana_azucar.py
"""
import shutil
from pathlib import Path

# --- RUTAS CONFIRMADAS ---
SOURCE_DIR = Path(r"C:\Users\USUARIO\Downloads\PROTOTIPO PLANTAS IA\data\raw\canadeazucar")
TARGET_DIR = Path(r"C:\Users\USUARIO\Downloads\PROTOTIPO PLANTAS IA\data\raw\cana_azucar")
# --------------------------------

# Mapeo: carpeta origen (dataset Mendeley, recién bajado) -> carpeta destino
# (carpeta vieja del proyecto). Los nombres de carpeta YA coinciden (ambos
# en inglés) -- prepare_dataset.py se encarga de traducir a español después.
# BacterialBlights NO está en este mapeo a propósito: no se toca.
FOLDER_MAP = {
    "Healthy": "Healthy",
    "Mosaic": "Mosaic",
    "RedRot": "RedRot",
    "Rust": "Rust",
    "Yellow": "Yellow",
}


def main():
    if not SOURCE_DIR.exists():
        raise SystemExit(f"No existe SOURCE_DIR: {SOURCE_DIR}\n"
                          f"Ajusta la ruta al inicio del script.")
    if not TARGET_DIR.exists():
        raise SystemExit(f"No existe TARGET_DIR: {TARGET_DIR}\n"
                          f"Confirma el nombre exacto de la carpeta de CañaDeAzúcar "
                          f"en tu data/raw antes de correr este script.")

    print(f"Origen : {SOURCE_DIR}")
    print(f"Destino: {TARGET_DIR}\n")

    for origen_nombre, destino_nombre in FOLDER_MAP.items():
        origen = SOURCE_DIR / origen_nombre
        destino = TARGET_DIR / destino_nombre

        if not origen.exists():
            print(f"[AVISO] No se encontró '{origen}', se omite.")
            continue

        if destino.exists():
            n_borradas = sum(1 for _ in destino.iterdir())
            shutil.rmtree(destino)
            print(f"Borradas {n_borradas} fotos viejas en '{destino_nombre}/'")

        shutil.copytree(origen, destino)
        n_nuevas = sum(1 for _ in destino.iterdir())
        print(f"Copiadas {n_nuevas} fotos nuevas: '{origen_nombre}/' -> '{destino_nombre}/'")

    print("\nListo. Bacteriosis no fue modificada (se dejó igual a propósito).")
    print("Siguiente paso: correr prepare_dataset.py (con --dry-run primero).")


if __name__ == "__main__":
    main()

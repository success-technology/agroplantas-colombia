# Guía del Dataset — Kaggle Plants

## Paso 1: Crear cuenta y API en Kaggle

1. Registrarse en [kaggle.com](https://www.kaggle.com)
2. En **Account → API → Create New Token** descargar `kaggle.json`
3. Colocar en `C:\Users\<usuario>\.kaggle\kaggle.json`

## Paso 2: Instalar CLI de Kaggle

```powershell
pip install kaggle
```

## Paso 3: Descargar un dataset

### Opción A — Plant Seedlings (malezas + cultivos, ideal para empezar)

```powershell
kaggle competitions download -c plant-seedlings-classification -p data/raw
Expand-Archive data/raw/plant-seedlings-classification.zip -DestinationPath data/raw
```

### Opción B — PlantVillage (enfermedades en tomate, papa, etc.)

```powershell
kaggle datasets download -d abdallahalidev/plantvillage-dataset -p data/raw
Expand-Archive data/raw/plantvillage-dataset.zip -DestinationPath data/raw
```

### Opción C — Descarga manual

1. Ir a https://www.kaggle.com/datasets?tags=7306-Plants
2. Elegir dataset → Download
3. Descomprimir todo en `data/raw/`

## Paso 4: Preparar para entrenamiento

```powershell
python scripts/prepare_dataset.py --input data/raw
```

Esto crea:
```
data/processed/
├── train/<clase>/*.jpg
├── val/<clase>/*.jpg
└── test/<clase>/*.jpg
```

Proporciones por defecto: 70% train, 15% val, 15% test.

## Estructuras reconocidas automáticamente

| Formato | Ejemplo |
|---------|---------|
| Carpetas por clase | `data/raw/Maize/img001.png` |
| Plant Seedlings | `data/raw/train/Common wheat/...` |
| PlantVillage | `data/raw/Tomato___Late_blight/...` |

## Ampliar con datos colombianos

Para cumplir el objetivo de contexto local:

1. Tomar fotos en finca (mínimo 50 por especie)
2. Crear carpeta `data/raw/MiCultivo_Colombia/`
3. Volver a ejecutar `prepare_dataset.py` y `train.py`

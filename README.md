# AgroPlantas Colombia

Plataforma de identificación automática de plantas agrícolas y malezas mediante **Redes Neuronales Convolucionales (CNN)**, orientada al monitoreo de cultivos en Colombia.

## Objetivos cubiertos

| Objetivo | Implementación |
|----------|----------------|
| Dataset estructurado | `scripts/prepare_dataset.py` + carpeta `data/` |
| Modelo CNN | MobileNetV2 + transfer learning en `scripts/train.py` |
| Aplicación web | React + FastAPI (`frontend/` + `backend/`) |
| Evaluación piloto | `scripts/evaluate.py` + `docs/EVALUACION_PILOTO.md` |

## Inicio rápido (2 días)

### Día 1 — Dataset y entrenamiento

1. **Descargar dataset de Kaggle** (tag [Plants](https://www.kaggle.com/datasets?tags=7306-Plants)):

   Recomendados para empezar:
   - [Plant Seedlings Dataset](https://www.kaggle.com/competitions/plant-seedlings-classification) — 12 especies/malezas
   - [PlantVillage](https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset) — cultivos + enfermedades
   - [New Plant Diseases](https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset)

2. Descomprimir en `data/raw/`

3. Preparar y entrenar:

> **Importante:** Usa **Python 3.11** (no 3.14). En Windows: `py -3.11`

```powershell
py -3.11 -m venv .venv311
.\.venv311\Scripts\Activate.ps1
pip install -r requirements.txt

python scripts/prepare_dataset.py --input data/raw
python scripts/train.py --data data/processed --epochs 15
python scripts/evaluate.py
```

### Día 2 — Aplicación web

```powershell
# Terminal 1 — Backend
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

Abrir **http://localhost:3000** y subir una imagen de planta.

O usar el script automático:

```powershell
.\iniciar.ps1
```

## Estructura del proyecto

PROTOTIPO PLANTAS IA/
│
├── README.md                 # Guía principal del proyecto
├── requirements.txt          # Dependencias Python (TensorFlow, FastAPI…)
├── iniciar.ps1               # Arranque rápido backend + frontend
├── docker-compose.yml        # Despliegue con Docker
├── .gitignore
│
├── backend/                  # API e inferencia con IA
│   ├── main.py               # FastAPI — endpoints /api/predict, /health
│   ├── schemas.py            # Modelos de respuesta (Pydantic)
│   ├── recommendations.py    # Fichas agronómicas por clase
│   ├── prediction_utils.py   # Agrupa por especie + detecta “no reconocida”
│   ├── plant_knowledge.py    # Nombres en español, enfermedades, tratamientos
│   ├── supported_species.py  # Lista de 14 cultivos soportados
│   ├── image_utils.py        # Preprocesamiento y TTA de imágenes
│   ├── Dockerfile
│   ├── data/
│   │   └── plant_catalog.json  # Info detallada por cultivo/enfermedad
│   └── models/
│       └── predictor.py      # Carga MobileNetV2 y predice
│
├── frontend/                 # Aplicación web (React + Vite)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── Dockerfile
│   ├── docs/
│   │   └── METODOLOGIA.md
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── types.ts
│       ├── index.css
│       └── components/
│           ├── Header.tsx
│           ├── UploadZone.tsx      # Subir imagen
│           ├── ResultsCard.tsx     # Resultado (especie, plaga, enfermedad)
│           ├── ModelStatus.tsx
│           ├── FeatureGrid.tsx
│           └── LoadingSpinner.tsx
│
├── scripts/                  # Pipeline de ML
│   ├── prepare_dataset.py    # raw → processed (train/val/test)
│   ├── train.py              # Entrena la CNN
│   └── evaluate.py           # Métricas y reporte
│
├── data/
│   ├── raw/                  # Dataset Kaggle descomprimido
│   │   └── PlantVillage/
│   │       ├── train/        # Carpetas: Tomato___healthy, etc.
│   │       └── val/
│   └── processed/            # Generado por prepare_dataset.py
│       ├── train/            # 38 clases × imágenes
│       ├── val/
│       └── test/
│
├── models/                   # Artefactos entrenados (no subir a git si son grandes)
│   ├── plant_classifier.keras
│   ├── best_weights.keras
│   ├── class_names.json
│   ├── training_metrics.json
│   └── evaluation_report.json
│
└── docs/
    ├── GUIA_DATASET.md       # Cómo descargar y preparar Kaggle
    └── EVALUACION_PILOTO.md  # Protocolo de pruebas con usuarios

## API

| Endpoint | Descripción |
|----------|-------------|
| `GET /health` | Estado del modelo y clases |
| `GET /api/classes` | Lista de especies |
| `POST /api/predict` | Subir imagen → predicción |
| `GET /docs` | Documentación Swagger |

## Docker

```powershell
docker-compose up --build
```

## Notas

- Sin modelo entrenado, la API funciona en **modo demostración** (arquitectura base).
- Tras entrenar, se generan `models/plant_classifier.keras` y `models/class_names.json`.
- Las recomendaciones agronómicas están en `backend/data/plant_catalog.json` (ampliable).

## Licencia

Prototipo académico — uso educativo e investigación agrícola.
# PROTOTIPO-PLANTAS-IA
# PROTOTIPO-PLANTAS-IA

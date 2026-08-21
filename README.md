# AgroPlantas Colombia

Plataforma de identificación automática de plantas agrícolas y detección de plagas/enfermedades mediante **Redes Neuronales Convolucionales (CNN)**, orientada al monitoreo de cultivos en Colombia.

**En producción:** https://agroplantas-colombia.vercel.app

## Objetivos cubiertos

| Objetivo | Implementación |
|----------|----------------|
| Dataset estructurado | `scripts/prepare_dataset.py` — 93 clases, 21 especies, 16+ fuentes |
| Modelo CNN de dos etapas | MobileNetV2 (especie → estado) en `scripts/train.py` |
| Aplicación web | React + FastAPI, con autenticación real y persistencia en base de datos |
| Despliegue en producción | Vercel (frontend) + Render (backend + ml_service) + Supabase (PostgreSQL) |

## Arquitectura

El sistema se divide en **tres servicios independientes**:

- **`backend/`** — FastAPI. Autenticación de usuarios (JWT + bcrypt), historial de identificaciones, catálogo de plantas y biblioteca. Reenvía cada imagen al `ml_service` por HTTP; no carga TensorFlow.
- **`ml_service/`** — FastAPI. Aloja exclusivamente el modelo entrenado (TensorFlow/Keras) y expone `/health` y `/predict`. Sin dependencia de base de datos.
- **`frontend/`** — React + Vite + TypeScript.

> Esta separación (backend / ml_service) no fue el diseño inicial: se adoptó tras detectar que TensorFlow y una conexión activa a PostgreSQL en el mismo proceso causaban un *segmentation fault* reproducible en producción.

## Inicio rápido (desarrollo local)

> **Importante:** Usa **Python 3.11** (no 3.14). En Windows: `py -3.11`

### 1. Backend

```powershell
cd backend
py -3.11 -m venv .venv311
.\.venv311\Scripts\Activate.ps1
pip install -r ..\requirements-backend.txt
uvicorn main:app --reload --port 8000
```

### 2. Servicio de inferencia (ml_service)

```powershell
cd ml_service
pip install -r ..\requirements-ml.txt
uvicorn main:app --reload --port 8001
```

### 3. Frontend

```powershell
cd frontend
npm install
```

Crea el archivo `frontend/.env` (no se sube a git) con:

```
VITE_API_URL=http://localhost:8000
```

```powershell
npm run dev
```

Abrir **http://localhost:3000** y subir una imagen de planta.

> Si `backend` no encuentra el `ml_service` local, revisa la variable de entorno `ML_SERVICE_URL` (por defecto apunta al servicio en Render).

### Entrenamiento del modelo (opcional — el modelo ya entrenado vive en `models/`)

```powershell
python scripts/prepare_dataset.py --input data/raw
python scripts/train.py --data data/processed --epochs 15
python scripts/evaluate.py
```

## Estructura del proyecto

```
agroplantas-colombia/
│
├── README.md
├── requirements-backend.txt    # Dependencias del backend (SIN TensorFlow, a propósito)
├── requirements-ml.txt         # Dependencias del ml_service (incluye TensorFlow)
├── docker-compose.yml
│
├── backend/                    # API transaccional (sin TensorFlow)
│   ├── main.py                  # Endpoints /api/predict, /health, /api/plant-info, etc.
│   ├── database.py               # Conexión SQLAlchemy (PostgreSQL en producción)
│   ├── db_models.py
│   ├── auth_utils.py / auth_deps.py
│   ├── routers/
│   │   ├── auth.py               # Registro / login (JWT + bcrypt)
│   │   └── history.py            # Historial de identificaciones por usuario
│   ├── schemas.py / schemas_auth.py
│   ├── recommendations.py        # Fichas agronómicas por clase
│   ├── prediction_utils.py       # Agrupa por especie + detecta "no reconocida"
│   ├── plant_knowledge.py        # Nombres en español, enfermedades, tratamientos
│   ├── supported_species.py      # Especies reales que el modelo entrenado reconoce
│   └── class_names_util.py
│
├── ml_service/                 # Servicio de inferencia aislado (TensorFlow/Keras)
│   ├── main.py                   # Endpoints /health, /predict
│   ├── image_utils.py            # Preprocesamiento y TTA de imágenes
│   └── models/
│       └── predictor.py          # Carga el modelo y predice
│
├── frontend/                   # Aplicación web (React + Vite + TypeScript)
│   ├── .env                     # VITE_API_URL (no se sube a git)
│   └── src/
│       ├── pages/                # IdentificarPage, AjustesPage, BibliotecaPage, etc.
│       ├── lib/                  # authStore, historyStore
│       └── components/
│           ├── UploadZone.tsx
│           ├── ResultsCard.tsx
│           ├── ModelStatus.tsx
│           └── ...
│
├── scripts/                    # Pipeline de entrenamiento
│   ├── prepare_dataset.py
│   ├── train.py
│   └── evaluate.py
│
├── models/                     # Artefactos entrenados
│   ├── species_classifier.keras
│   ├── state_best_weights.keras
│   ├── plant_classifier.keras
│   ├── class_names.json         # {"0": "Algodon___Bacteriosis", ...}
│   └── training_metrics.json
│
└── docs/
```

## API (backend)

| Endpoint | Descripción |
|----------|-------------|
| `GET /health` | Estado del backend, del ml_service y del modelo |
| `GET /api/classes` | Lista completa de las 93 clases |
| `GET /api/supported-species` | Las 21 especies que el modelo reconoce |
| `POST /api/predict` | Subir imagen → predicción |
| `GET /api/plant-info/{class_name}` | Ficha agronómica completa de una clase |
| `POST /auth/register` / `/auth/login` | Autenticación de usuarios |
| `GET /history` | Historial de identificaciones del usuario autenticado |
| `GET /docs` | Documentación Swagger |

## Despliegue en producción

- **Frontend:** Vercel (Root Directory: `frontend`)
- **Backend:** Render.com — Web Service, variable `ML_SERVICE_URL` apuntando al ml_service
- **Servicio de inferencia:** Render.com — Web Service independiente, sin base de datos
- **Base de datos:** Supabase (PostgreSQL)

## Notas

- Los datasets crudos (`data/raw/`, `data/processed/`) **no se suben a git** por su tamaño; solo el modelo ya entrenado (`models/*.keras`) viaja en el repositorio.
- Si `model_trained` en `/health` no está en `true`, el frontend muestra un aviso de modo demostración (normalmente porque el `ml_service` de Render está dormido tras inactividad — su plan gratuito hiberna a los 15 minutos).
- Las recomendaciones agronómicas se generan dinámicamente en `backend/recommendations.py` a partir de `plant_knowledge.py`.
- El `requirements.txt` en la raíz del proyecto es una versión anterior, previa a separar backend y ml_service; para desarrollo local, usa `requirements-backend.txt` y `requirements-ml.txt` por separado.

## Licencia

Prototipo académico — uso educativo e investigación agrícola.
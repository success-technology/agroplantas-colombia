# Metodología — AgroPlantas Colombia

## 1. Recopilación y estructuración del dataset

- Fuente principal: datasets públicos Kaggle (tag Plants)
- Complemento recomendado: imágenes de campo en Colombia
- Pipeline: `scripts/prepare_dataset.py` → división train/val/test estratificada

## 2. Modelo de aprendizaje profundo

| Componente | Detalle |
|------------|---------|
| Arquitectura | MobileNetV2 (transfer learning ImageNet) |
| Cabeza | GlobalAveragePooling + Dense + Softmax |
| Optimizador | Adam |
| Augmentación | Rotación, zoom, flip, brillo |
| Fine-tuning | Últimas 30 capas descongeladas |

**Justificación:** MobileNetV2 es liviano, rápido en inferencia y adecuado para despliegue en zonas rurales con hardware limitado.

## 3. Interfaz web

- **Frontend:** React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** FastAPI, validación Pydantic, CORS habilitado
- **Flujo:** Upload → CNN → Probabilidades + recomendaciones agronómicas

## 4. Evaluación

- Técnica: `scripts/evaluate.py` (sklearn classification_report)
- Humana: protocolo en `docs/EVALUACION_PILOTO.md`

## Diagrama de arquitectura

```
[Usuario] → [React App] → POST /api/predict → [FastAPI]
                                              ↓
                                    [MobileNetV2 CNN]
                                              ↓
                              [Clase + Confianza + Recomendaciones]
```

## Contexto colombiano

El catálogo `backend/data/plant_catalog.json` vincula clases del modelo con:
- Nombres en español
- Recomendaciones de manejo
- Severidad (cultivo sano / maleza / enfermedad)

Se actualiza al agregar nuevas clases tras reentrenar.

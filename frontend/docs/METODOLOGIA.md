# Metodología de datos y modelo de AgroPlantas Colombia

## 1. Datos y clases

El catálogo versionado del modelo actual contiene **93 clases de estado** agrupadas en **21 especies**. Los nombres deben seguir la convención `Especie___Condición`; `class_names.json` y `species_class_names.json` fijan el orden de salida Softmax. Las imágenes y los conjuntos derivados no se almacenan en Git.

Antes de entrenar, inspecciona las fuentes, licencias, etiquetas, duplicados y distribución por clase. Separa train, validation y test sin permitir que imágenes duplicadas o del mismo origen filtren información entre particiones. Documenta procedencia y limitaciones por cada fuente.

## 2. Arquitectura y entrenamiento

| Parámetro | Implementación |
|---|---|
| Backbone | MobileNetV2 preentrenada con ImageNet, `include_top=False` |
| Entrada | RGB, 224 × 224 |
| Normalización | `tf.keras.applications.mobilenet_v2.preprocess_input` |
| Cabeza | GlobalAveragePooling2D, Dropout, Dense (256/ReLU), Dropout y Dense/Softmax |
| Optimizador | Adam; tasa inicial 1e-3 y fine-tuning 1e-5 |
| Pérdida | sparse categorical cross-entropy |
| Desbalance | pesos de clase, limitados para evitar magnitudes excesivas |
| Aumentación | flip horizontal, rotación, zoom, traslación y contraste; solo en entrenamiento |
| Fine-tuning | últimas 30 capas de MobileNetV2; BatchNormalization sigue congelada |
| Estabilización | EarlyStopping, ReduceLROnPlateau y ModelCheckpoint |

Se entrena una red que predice especie y otra que predice condición. La red de especie restringe las probabilidades de la red de estado a especies plausibles. Esta estructura reduce clases incompatibles, pero una predicción de alta confianza no garantiza que la imagen sea de campo ni que la recomendación sustituya a un agrónomo.

## 3. Preprocesamiento e inferencia

`ml_service/image_utils.py` recorta el centro a proporción cuadrada, convierte a RGB, redimensiona y aplica la normalización esperada por MobileNetV2. El artefacto actual utiliza una sola vista por imagen por latencia del servicio; aunque la función conserve el nombre `tta_variants`, no genera actualmente espejo y zoom adicionales. Entrenamiento e inferencia deben mantener exactamente el mismo tamaño y normalización.

`ml_service/models/predictor.py` carga `species_classifier.keras` y `plant_classifier.keras` junto con las listas ordenadas de etiquetas. Su filtro de especie conserva clases cuya probabilidad de especie alcanza el 25% de la máxima y renormaliza la salida. `backend/prediction_utils.py` elige clase/estado final, alternativas y umbrales de rechazo. `backend/recommendations.py` convierte la clase final en ficha de orientación agronómica.

## 4. Scripts y artefactos

```powershell
python scripts/prepare_dataset.py --input data/raw
python scripts/train.py --data data/processed --epochs 12
python scripts/evaluate.py --data data/processed
```

- `prepare_dataset.py`: descubre clases, aplica mapeos del manifiesto y construye particiones.
- `train.py`: entrena primero especie y después estado; guarda modelos, pesos y `training_metrics.json`.
- `evaluate.py`: calcula métricas y matriz de confusión solo sobre `data/processed/test`. No sustituye TEST por validation.
- `models/`: modelos desplegables, índices de clases, métricas de entrenamiento y reporte de evaluación.

Los valores guardados el 2 de agosto de 2026 incluyen accuracy de validación 0.9599 (especie) y 0.8553 (estado). Son resultados de validación del entrenamiento, no de campo.

## 5. Evaluación pendiente y criterio de publicación

El `models/evaluation_report.json` presente reporta únicamente la clase `PlantVillage` y 8.147 muestras; no evalúa las 93 clases. No debe citarse su accuracy 1.0 como desempeño del modelo actual. Para publicar métricas, generar test independiente con todas las clases, verificar sus etiquetas y ejecutar `scripts/evaluate.py`. Después realizar el protocolo con especialistas/fotos de campo descrito en [docs/EVALUACION_PILOTO.md](../../docs/EVALUACION_PILOTO.md).

Las decisiones de arquitectura, la secuencia de cada petición y el catálogo de funciones están en [docs/ARQUITECTURA.md](../../docs/ARQUITECTURA.md).

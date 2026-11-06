# Metodología de AgroPlantas Colombia

El sistema combina una aplicación React/TypeScript, una API FastAPI de negocio/persistencia y un microservicio FastAPI independiente para inferencia TensorFlow. La separación mantiene autenticación/base de datos fuera del proceso que carga las redes neuronales.

## Fases del desarrollo y procesamiento

1. **Preparar datos:** recolectar imágenes con licencia/atribución conocidas, normalizar etiquetas de especie/estado y crear particiones independientes train, validation y test.
2. **Entrenar redes:** transferencia de aprendizaje MobileNetV2 para 21 especies y otra red para 93 estados; primero se congela el backbone ImageNet y después se afina parcialmente.
3. **Inferir:** preprocesar imágenes a RGB 224×224 con la misma normalización del entrenamiento, predecir especie y estado, y filtrar las clases de estado por la especie probable.
4. **Interpretar:** aplicar reglas de confianza/rechazo, catálogo y recomendaciones para construir una respuesta en español.
5. **Entregar la función web:** carga/cámara, resultado, historial, cuenta, preferencias, soporte y monitoreo operativo.
6. **Validar antes de producción:** evaluar con test independiente y fotos tomadas en campo; revisar conectividad, seguridad, accesibilidad, restauración y configuración de terceros.

## Métodos y funciones principales

- `scripts/prepare_dataset.py`: analiza carpetas/manifiestos y divide/clasifica archivos.
- `scripts/train.py`: define la arquitectura, aumentación, pesos por clase, etapas de entrenamiento y métricas.
- `ml_service/models/predictor.py`: carga los dos modelos, aplica el filtro de especie y calcula probabilidades.
- `backend/prediction_utils.py`: decide la especie/estado final y marca entradas no reconocidas.
- `backend/recommendations.py`: combina clasificación con información del catálogo agronómico.
- `backend/main.py`: valida la solicitud, aplica cuota, llama al microservicio ML y construye la respuesta de API.

La descripción técnica de rutas, datos, módulos y las funciones principales está en [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md). Las decisiones de datos y entrenamiento están desarrolladas en [frontend/docs/METODOLOGIA.md](frontend/docs/METODOLOGIA.md).

## Límites de evidencia

La accuracy de validación guardada en `models/training_metrics.json` no equivale al rendimiento de campo. El actual `models/evaluation_report.json` solo tiene una etiqueta (`PlantVillage`) y no evalúa el clasificador de 93 clases; no debe usarse para afirmar una precisión de producción. Consulta [docs/EVALUACION_PILOTO.md](docs/EVALUACION_PILOTO.md) para el protocolo pendiente.

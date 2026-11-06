# Protocolo de evaluación piloto

## Objetivo

Evaluar **precisión**, **rendimiento** y **usabilidad** con un grupo focal del sector agrícola colombiano.

## Estado de evaluación actual

El reporte `models/evaluation_report.json` del repositorio contiene una sola clase (`PlantVillage`) con 8.147 muestras. No corresponde al clasificador actual de 93 estados y su accuracy 1.0 **no es una métrica válida del sistema**. Las cifras de `models/training_metrics.json` son de entrenamiento/validación, no de un test independiente ni de fotos de campo.

## Métricas técnicas (automáticas)

```powershell
python scripts/evaluate.py
```

Genera `models/evaluation_report.json` con:
- Accuracy global
- Precisión/recall por clase
- Matriz de confusión

El conjunto TEST debe tener las mismas clases que `models/class_names.json`, no compartir imágenes/orígenes duplicados con train/validation y conservar etiquetas verificadas. Reporta macro-F1 y métricas por clase además de accuracy, porque las clases pueden estar desbalanceadas. Una meta de accuracy ≥ 85% puede servir como umbral inicial del proyecto, pero no es garantía de calidad ni reemplaza validación en campo.

## Métricas de usabilidad (grupo focal)

### Participantes
- 5–10 agricultores o técnicos agropecuarios
- Zona rural, acceso a smartphone

### Tareas (15 min por persona)
1. Subir 3 fotos de plantas conocidas
2. Interpretar el resultado y recomendaciones
3. Comparar las predicciones con la identificación de un técnico/agronómo y responder encuesta corta (1–5):

| Pregunta | Escala |
|----------|--------|
| ¿Fue fácil subir la foto? | 1–5 |
| ¿Entendió el diagnóstico? | 1–5 |
| ¿Las recomendaciones le parecen útiles? | 1–5 |
| ¿Confiaría en la app para monitoreo? | 1–5 |

### Registro de errores
- Anotar cuando la confianza < 60%
- Comparar con identificación del técnico
- Fotografiar condiciones (luz, fondo, distancia)

## Plantilla de registro

| # | Usuario | Especie real | Predicción IA | Confianza | ¿Correcto? | Notas |
|---|---------|--------------|---------------|-----------|------------|-------|
| 1 |         |              |               |           |            |       |

## Criterios de éxito del piloto (propuesta; aún por medir)

- [ ] ≥ 80% de identificaciones correctas en campo
- [ ] Promedio usabilidad ≥ 4/5
- [ ] Tiempo de respuesta < 3 segundos por imagen
- [ ] Sin errores críticos de la API

## Informe final

Incluir en el documento del proyecto:
1. Gráfico de métricas (`evaluation_report.json`)
2. Tabla de resultados del grupo focal
3. Limitaciones y trabajo futuro (más especies colombianas: café, yuca, plátano)

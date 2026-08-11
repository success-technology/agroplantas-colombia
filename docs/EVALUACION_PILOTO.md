# Protocolo de evaluación piloto

## Objetivo

Evaluar **precisión**, **rendimiento** y **usabilidad** con un grupo focal del sector agrícola colombiano.

## Métricas técnicas (automáticas)

```powershell
python scripts/evaluate.py
```

Genera `models/evaluation_report.json` con:
- Accuracy global
- Precisión/recall por clase
- Matriz de confusión

**Meta sugerida:** accuracy ≥ 85% en test (depende del dataset).

## Métricas de usabilidad (grupo focal)

### Participantes
- 5–10 agricultores o técnicos agropecuarios
- Zona rural, acceso a smartphone

### Tareas (15 min por persona)
1. Subir 3 fotos de plantas conocidas
2. Interpretar el resultado y recomendaciones
3. Responder encuesta corta (1–5):

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

## Criterios de éxito del piloto

- [ ] ≥ 80% de identificaciones correctas en campo
- [ ] Promedio usabilidad ≥ 4/5
- [ ] Tiempo de respuesta < 3 segundos por imagen
- [ ] Sin errores críticos de la API

## Informe final

Incluir en el documento del proyecto:
1. Gráfico de métricas (`evaluation_report.json`)
2. Tabla de resultados del grupo focal
3. Limitaciones y trabajo futuro (más especies colombianas: café, yuca, plátano)

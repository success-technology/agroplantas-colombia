# Dockerfile del backend principal de AgroPlantas Colombia.
#
# Este backend YA NO carga TensorFlow ni los modelos — esa responsabilidad
# se aisló en un microservicio separado (ml_service/, con su propio
# Dockerfile), porque TensorFlow + una conexión real a Postgres en el mismo
# proceso causaba un Segmentation fault reproducible en Render. Este backend
# le pide las predicciones al microservicio por HTTP (variable de entorno
# ML_SERVICE_URL).
#
# Render asigna el puerto dinámicamente vía $PORT.

FROM python:3.11-slim

WORKDIR /app

COPY requirements-backend.txt requirements-backend.txt
RUN pip install --no-cache-dir -r requirements-backend.txt

# Solo los archivos JSON pequeños (nombres de clase, métricas) — NO los
# .keras pesados, que el backend ya no necesita en absoluto.
COPY models/class_names.json models/class_names.json
COPY models/species_class_names.json models/species_class_names.json
COPY models/training_metrics.json models/training_metrics.json

COPY backend/ backend/

WORKDIR /app/backend

EXPOSE 8000

CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --loop asyncio"]
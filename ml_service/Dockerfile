# Dockerfile del microservicio de ML de AgroPlantas Colombia.
#
# Este servicio SOLO carga TensorFlow y los modelos, y expone /predict.
# NO tiene ninguna dependencia de base de datos (ni psycopg, ni SQLAlchemy)
# — separado a propósito del backend principal, porque la combinación de
# TensorFlow + un driver de Postgres real en el mismo proceso causaba un
# Segmentation fault reproducible en Render (confirmado con pruebas).
#
# Se despliega como un Web Service de Render SEPARADO del backend.
#
# IMPORTANTE: este Dockerfile vive en ml_service/, pero el build context
# debe ser la RAÍZ del proyecto (para poder copiar models/), así que en
# Render configura "Dockerfile Path" = ml_service/Dockerfile y
# "Docker Build Context Directory" = . (la raíz).

FROM python:3.11-slim

WORKDIR /app

COPY requirements-ml.txt requirements-ml.txt
RUN pip install --no-cache-dir -r requirements-ml.txt

# Copia el modelo entrenado (una carpeta arriba de ml_service/, igual que
# hace el backend con models/)
COPY models/ models/
# Copia el microservicio completo
COPY ml_service/ ml_service/

WORKDIR /app/ml_service

EXPOSE 8001

CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8001} --loop asyncio"]
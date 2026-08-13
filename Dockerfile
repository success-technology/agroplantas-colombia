# Dockerfile del backend de AgroPlantas Colombia
#
# Desplegado en Render.com (Web Service, SDK Docker). Render asigna el
# puerto dinámicamente vía la variable de entorno $PORT — por eso el CMD
# usa esa variable en vez de un número fijo. Si $PORT no está definida
# (por ejemplo al correr `docker run` en tu PC para pruebas locales), usa
# 8000 como respaldo.
#
# IMPORTANTE: este Dockerfile vive en la RAÍZ del proyecto (al mismo nivel
# que las carpetas backend/ y models/), porque main.py resuelve la ruta del
# modelo como "un nivel arriba de backend/" — igual que en tu equipo local.
# NO subas este Dockerfile dentro de backend/, ni muevas la carpeta models/.
#
# NOTA sobre --loop asyncio: es un fix necesario, no cosmético. uvicorn[standard]
# usa uvloop por defecto, que choca con el threading interno de TensorFlow en
# C++ y causa un Segmentation fault silencioso al arrancar (confirmado con
# pruebas exhaustivas — ver notas del proyecto). No quitar este flag.

FROM python:3.11-slim

WORKDIR /app

# Dependencias del sistema necesarias para Pillow/OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copia el modelo entrenado (una carpeta arriba de backend/, igual que local)
COPY models/ models/
# Copia el backend completo
COPY backend/ backend/

WORKDIR /app/backend

EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --loop asyncio"]
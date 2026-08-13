# Dockerfile del backend de AgroPlantas Colombia
#
# Pensado para Hugging Face Spaces (SDK: Docker), que expone el puerto 7860
# por defecto. También funciona en cualquier otro host que soporte Docker
# (Render, Fly.io, Cloud Run, un VPS) — solo ajusta el puerto si hace falta.
#
# IMPORTANTE: este Dockerfile vive en la RAÍZ del proyecto (al mismo nivel
# que las carpetas backend/ y models/), porque main.py resuelve la ruta del
# modelo como "un nivel arriba de backend/" — igual que en tu equipo local.
# NO subas este Dockerfile dentro de backend/, ni muevas la carpeta models/.

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

# Hugging Face Spaces espera que la app escuche en el puerto 7860
ENV PORT=7860
EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--loop", "asyncio"]
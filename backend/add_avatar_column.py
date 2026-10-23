"""
Agrega la columna avatar_base64 a la tabla users en la base de datos
configurada (usa el mismo DATABASE_URL/engine que el resto del backend,
así que funciona igual en SQLite local como en Postgres).

Uso: desde la carpeta backend/, con el entorno virtual activado:
    python add_avatar_column.py
"""
from sqlalchemy import text
from database import engine

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN avatar_base64 TEXT"))
        conn.commit()
        print("Columna avatar_base64 agregada correctamente.")
    except Exception as e:
        if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
            print("La columna ya existía, no se hizo nada.")
        else:
            raise
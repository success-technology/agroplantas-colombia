"""
Configuración de la base de datos (SQLAlchemy).

En desarrollo local usa SQLite (backend/data/app.db) automáticamente.
En producción, define la variable de entorno DATABASE_URL apuntando a tu
base de datos Postgres (por ejemplo, la que te da Supabase o Neon gratis)
y el sistema la usará en su lugar, sin cambiar nada más del código.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

_sqlite_url = f"sqlite:///{os.path.join(DATA_DIR, 'app.db')}"
DATABASE_URL = os.environ.get("DATABASE_URL", _sqlite_url)

# Algunos proveedores (Supabase, Heroku, Render) entregan la URL con el
# prefijo "postgres://", pero SQLAlchemy moderno espera "postgresql://".
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

_is_sqlite = DATABASE_URL.startswith("sqlite")

# check_same_thread=False solo aplica a SQLite (FastAPI puede usar la
# conexión desde distintos hilos). Postgres no necesita este parámetro.
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependencia de FastAPI: entrega una sesión de DB y la cierra al terminar."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
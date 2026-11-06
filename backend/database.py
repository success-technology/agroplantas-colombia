"""
Configuración de la base de datos (SQLAlchemy).

En desarrollo local usa SQLite (backend/data/app.db) automáticamente.
En producción, define la variable de entorno DATABASE_URL apuntando a tu
base de datos Postgres (por ejemplo, la que te da Supabase o Neon gratis)
y el sistema la usará en su lugar, sin cambiar nada más del código.
"""
import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

_sqlite_url = f"sqlite:///{os.path.join(BASE_DIR, 'agroplantas.db')}"
_configured_database_url = os.environ.get("DATABASE_URL")
_is_production = (
    os.environ.get("APP_ENV", "").lower() == "production"
    or os.environ.get("RENDER", "").lower() == "true"
)

if _is_production and not _configured_database_url:
    raise RuntimeError(
        "Configura DATABASE_URL con PostgreSQL persistente; producción no puede usar SQLite local."
    )

DATABASE_URL = _configured_database_url or _sqlite_url
if _is_production and DATABASE_URL.startswith("sqlite:"):
    raise RuntimeError("DATABASE_URL debe apuntar a PostgreSQL persistente en producción.")

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

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


def migrate_user_name_change_column() -> None:
    """Añade el control mensual de nombre sin borrar datos existentes."""
    if "users" not in inspect(engine).get_table_names():
        return
    columns = {column["name"] for column in inspect(engine).get_columns("users")}
    if "nombre_changed_at" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE users ADD COLUMN nombre_changed_at TIMESTAMP NULL"))
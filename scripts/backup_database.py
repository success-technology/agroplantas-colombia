"""Crea un backup consistente de la base local SQLite o PostgreSQL."""
import datetime
import os
import shutil
import sqlite3
import subprocess
import sys
from pathlib import Path

from sqlalchemy.engine import make_url

ROOT = Path(__file__).resolve().parents[1]
BACKUP_DIR = Path(os.environ.get("BACKUP_DIR", ROOT / "backups")).resolve()
RETENTION_DAYS = int(os.environ.get("BACKUP_RETENTION_DAYS", "30"))
DATABASE_URL = os.environ.get("DATABASE_URL")


def backup_sqlite(destination: Path) -> None:
    """Crea una copia SQLite consistente usando la API backup integrada."""
    if DATABASE_URL:
        prefix = "sqlite:///"
        if not DATABASE_URL.startswith(prefix):
            raise ValueError("La URL SQLite debe comenzar con sqlite:///")
        database_path = Path(DATABASE_URL[len(prefix):])
        if not database_path.is_absolute():
            database_path = (Path.cwd() / database_path).resolve()
    else:
        database_path = ROOT / "backend" / "agroplantas.db"

    if not database_path.is_file():
        raise FileNotFoundError(f"No se encontró la base SQLite: {database_path}")

    with sqlite3.connect(database_path) as source, sqlite3.connect(destination) as target:
        source.backup(target)


def backup_postgres(destination: Path) -> None:
    """Crea un dump PostgreSQL invocando pg_dump con credenciales del entorno."""
    if not DATABASE_URL:
        raise ValueError("Configura DATABASE_URL para usar PostgreSQL")
    pg_dump = shutil.which("pg_dump")
    if not pg_dump:
        raise RuntimeError("No se encontró pg_dump; instala las herramientas cliente de PostgreSQL")
    database_url = make_url(DATABASE_URL)
    environment = os.environ.copy()
    if database_url.password:
        environment["PGPASSWORD"] = database_url.password
    connection_url = database_url.set(
        drivername="postgresql",
        password=None,
    ).render_as_string(hide_password=False)
    subprocess.run(
        [pg_dump, "--no-owner", "--no-acl", "--format=custom", "--file", str(destination), connection_url],
        check=True,
        env=environment,
    )


def prune_old_backups(now: datetime.datetime) -> None:
    """Aplica la política de retención y elimina copias que ya vencieron."""
    cutoff = now.timestamp() - RETENTION_DAYS * 24 * 60 * 60
    for path in BACKUP_DIR.glob("agroplantas-*"):
        if path.is_file() and path.stat().st_mtime < cutoff:
            path.unlink()


def main() -> int:
    """Determina motor y destino, ejecuta backup, limpia errores y retorna estado."""
    now = datetime.datetime.now().astimezone()
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    extension = ".dump" if DATABASE_URL and DATABASE_URL.startswith(("postgres://", "postgresql://", "postgresql+")) else ".sqlite3"
    destination = BACKUP_DIR / f"agroplantas-{now.strftime('%Y%m%d-%H%M%S')}{extension}"

    try:
        if extension == ".dump":
            backup_postgres(destination)
        else:
            backup_sqlite(destination)
        if os.name != "nt":
            destination.chmod(0o600)
        prune_old_backups(now)
    except Exception as error:
        destination.unlink(missing_ok=True)
        print(f"Error al crear el backup: {error}", file=sys.stderr)
        return 1

    print(f"Backup creado: {destination}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

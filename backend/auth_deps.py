"""
Dependencias de FastAPI relacionadas con autenticación.

get_current_user: exige un token válido (usar en rutas protegidas).
get_current_user_optional: permite acceso sin token (usar donde el
login es opcional, por ejemplo /api/predict).
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db
from db_models import User
from auth_utils import decode_access_token

# auto_error=False para poder implementar también una versión "opcional"
bearer_scheme = HTTPBearer(auto_error=False)


def _get_user_from_token(token: str | None, db: Session) -> User | None:
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Requiere un token válido. Lanza 401 si falta o es inválido."""
    token = credentials.credentials if credentials else None
    user = _get_user_from_token(token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión no válida o expirada. Inicia sesión de nuevo.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    """Devuelve el usuario si hay token válido, o None si no hay sesión."""
    token = credentials.credentials if credentials else None
    return _get_user_from_token(token, db)
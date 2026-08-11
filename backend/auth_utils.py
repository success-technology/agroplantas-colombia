"""
Utilidades de autenticación: hash de contraseñas (bcrypt) y
generación/verificación de tokens JWT.

IMPORTANTE PARA PRODUCCIÓN:
Configura la variable de entorno JWT_SECRET con un valor largo y
aleatorio. El valor por defecto de abajo es SOLO para desarrollo
local y no debe usarse en producción.
"""
import os
import datetime

import bcrypt
import jwt

JWT_SECRET = os.environ.get(
    "JWT_SECRET", "dev-secret-inseguro-cambiar-en-produccion"
)
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # el token dura 7 días


def hash_password(password: str) -> str:
    """Genera el hash bcrypt de una contraseña en texto plano."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    """Verifica una contraseña en texto plano contra su hash."""
    return bcrypt.checkpw(
        password.encode("utf-8"), hashed_password.encode("utf-8")
    )


def create_access_token(user_id: int, email: str) -> str:
    """Genera un token JWT para el usuario dado."""
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": datetime.datetime.utcnow()
        + datetime.timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """Decodifica y valida un token JWT. Devuelve None si es inválido o expiró."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
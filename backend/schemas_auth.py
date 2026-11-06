"""
Esquemas Pydantic para los endpoints de autenticación e historial.
"""
import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    """Datos validados para crear una cuenta con correo y contraseña."""
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    nombre: str | None = None

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, value: str) -> str:
        """Rechaza claves que exceden el límite de bytes de bcrypt."""
        if len(value.encode("utf-8")) > 72:
            raise ValueError("La contraseña no puede superar 72 bytes en UTF-8.")
        return value


class LoginRequest(BaseModel):
    """Credenciales de acceso para una cuenta existente."""
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    """Correo al que se enviará el enlace de recuperación."""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Token de recuperación y contraseña nueva solicitada."""
    token: str = Field(min_length=20, max_length=200)
    new_password: str = Field(min_length=8, max_length=72)

    @field_validator("new_password")
    @classmethod
    def password_fits_bcrypt(cls, value: str) -> str:
        """Valida el límite de bcrypt antes de aceptar la contraseña nueva."""
        if len(value.encode("utf-8")) > 72:
            raise ValueError("La contraseña no puede superar 72 bytes en UTF-8.")
        return value


class UserOut(BaseModel):
    """Representación pública del perfil que devuelve el API."""
    id: int
    email: str
    nombre: str | None = None
    avatar_base64: str | None = None
    nombre_change_available_at: datetime.datetime | None = None

    class Config:
        """Configura la serialización compatible con modelos ORM de usuario."""
        from_attributes = True


class AvatarUpdateRequest(BaseModel):
    """Carga serializada de avatar recibida para actualizar el perfil."""
    avatar_base64: str = Field(max_length=1_500_000)


class ProfileUpdateRequest(BaseModel):
    """Campos editables del perfil de usuario."""
    nombre: str = Field(min_length=1, max_length=80)


class SocialLoginRequest(BaseModel):
    """Credencial de identidad social que el servidor debe verificar."""
    credential: str = Field(min_length=20, max_length=10_000)


class GoogleDriveBackupRequest(BaseModel):
    """Token temporal autorizado para crear un archivo de backup en Drive."""
    access_token: str = Field(min_length=20, max_length=10_000)


class TokenResponse(BaseModel):
    """Respuesta estándar de login: JWT y datos básicos del usuario."""
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class IdentificationCreate(BaseModel):
    """Resultado de planta validado antes de guardarlo en el historial."""
    clase_predicha: str
    cultivo: str | None = None
    estado: str | None = None
    confianza: float | None = None
    reconocido: str = "si"
    is_healthy: str = "no"
    has_pest: str = "no"
    has_disease: str = "no"
    data_json: str | None = None
    imagen_miniatura: str | None = None


class IdentificationOut(BaseModel):
    """Registro de historial preparado para devolverlo al frontend."""
    id: int
    clase_predicha: str
    cultivo: str | None = None
    estado: str | None = None
    confianza: float | None = None
    reconocido: str
    is_healthy: str = "no"
    has_pest: str = "no"
    has_disease: str = "no"
    data_json: str | None = None
    imagen_miniatura: str | None = None
    created_at: datetime.datetime

    class Config:
        """Permite convertir registros ORM de identificaciones a respuestas API."""
        from_attributes = True

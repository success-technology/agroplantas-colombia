"""
Esquemas Pydantic para los endpoints de autenticación e historial.
"""
import datetime

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    nombre: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    nombre: str | None = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class IdentificationCreate(BaseModel):
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
        from_attributes = True
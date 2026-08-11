"""
Modelos ORM (SQLAlchemy) para la base de datos.

- User: usuarios registrados (login/registro).
- Identification: historial de identificaciones de plantas, cada una
  asociada a un usuario (user_id).
"""
import datetime

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    nombre = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    identificaciones = relationship(
        "Identification", back_populates="usuario", cascade="all, delete-orphan"
    )


class Identification(Base):
    __tablename__ = "identifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Resultado de la predicción
    clase_predicha = Column(String, nullable=False)      # ej. "Tomato___Early_blight"
    cultivo = Column(String, nullable=True)               # ej. "Tomate"
    estado = Column(String, nullable=True)                 # ej. "Tizón temprano"
    confianza = Column(Float, nullable=True)               # 0-100
    reconocido = Column(String, default="si")              # "si" / "no" (no identificado)
    is_healthy = Column(String, default="no")              # "si" / "no"
    has_pest = Column(String, default="no")                # "si" / "no"
    has_disease = Column(String, default="no")             # "si" / "no"

    # Objeto PredictionResult completo (tal cual lo devuelve /api/predict),
    # serializado como JSON, para poder reabrir el detalle completo desde el historial
    data_json = Column(Text, nullable=True)

    # Imagen guardada como miniatura base64 (igual que hacía localStorage)
    imagen_miniatura = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    usuario = relationship("User", back_populates="identificaciones")
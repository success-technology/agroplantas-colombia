"""
Modelos ORM (SQLAlchemy) para la base de datos.

- User: usuarios registrados (login/registro).
- Identification: historial de identificaciones de plantas, cada una
  asociada a un usuario (user_id).
"""
import datetime

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    """Cuenta local, perfil y relación con el historial de identificaciones."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    nombre = Column(String, nullable=True)
    nombre_changed_at = Column(DateTime, nullable=True)
    avatar_base64 = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    identificaciones = relationship(
        "Identification", back_populates="usuario", cascade="all, delete-orphan"
    )


class PasswordResetToken(Base):
    """Token de recuperación almacenado como hash y con vencimiento."""
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(64), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, nullable=False, default=False)


class OAuthIdentity(Base):
    """Vínculo único entre una cuenta local y un proveedor OAuth."""
    __tablename__ = "oauth_identities"
    __table_args__ = (UniqueConstraint("provider", "provider_subject", name="uq_oauth_provider_subject"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(20), nullable=False)
    provider_subject = Column(String(255), nullable=False)


class GuestPredictionQuota(Base):
    """Contador legado de invitado, conservado para compatibilidad de esquema."""
    __tablename__ = "guest_prediction_quotas"

    id = Column(Integer, primary_key=True, index=True)
    guest_hash = Column(String(64), unique=True, nullable=False, index=True)
    attempts = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)


class AnalysisQuota(Base):
    """Cuota de análisis por hash de usuario o sesión invitada."""
    __tablename__ = "analysis_quotas"

    id = Column(Integer, primary_key=True, index=True)
    subject_hash = Column(String(64), unique=True, nullable=False, index=True)
    attempts = Column(Integer, nullable=False, default=0)
    window_started_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)


class Identification(Base):
    """Resultado de análisis persistido en el historial de una cuenta."""
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

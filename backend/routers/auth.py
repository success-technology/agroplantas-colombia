"""
Endpoints de autenticación: registro, login y perfil del usuario actual.
"""
import hashlib
import json
import logging
import os
import secrets
import smtplib
import ssl
from datetime import datetime, timedelta
from email.message import EmailMessage

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, update
from sqlalchemy.orm import Session

from database import get_db
from db_models import Identification, OAuthIdentity, PasswordResetToken, User
from schemas_auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserOut,
    AvatarUpdateRequest,
    ProfileUpdateRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
    SocialLoginRequest,
    GoogleDriveBackupRequest,
)
from auth_utils import hash_password, verify_password, create_access_token
from auth_deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = logging.getLogger("security")


def _send_password_reset_email(email: str, token: str) -> None:
    """Envía el enlace de recuperación usando SMTP configurado en el entorno."""
    host = os.environ.get("SMTP_HOST")
    sender = os.environ.get("SMTP_FROM")
    if not host or not sender:
        raise RuntimeError("SMTP_HOST y SMTP_FROM no están configurados")

    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    reset_url = f"{frontend_url}/login?reset_token={token}"
    message = EmailMessage()
    message["Subject"] = "Restablece tu contraseña de AgroPlantas"
    message["From"] = sender
    message["To"] = email
    message.set_content(
        f"Usa este enlace para crear una nueva contraseña (válido por 30 minutos):\n{reset_url}\n\n"
        "Si no solicitaste el cambio, ignora este mensaje."
    )

    port = int(os.environ.get("SMTP_PORT", "587"))
    username = os.environ.get("SMTP_USERNAME")
    password = os.environ.get("SMTP_PASSWORD")
    timeout = 10
    if port == 465:
        with smtplib.SMTP_SSL(host, port, timeout=timeout, context=ssl.create_default_context()) as server:
            if username:
                server.login(username, password or "")
            server.send_message(message)
    else:
        with smtplib.SMTP(host, port, timeout=timeout) as server:
            server.starttls(context=ssl.create_default_context())
            if username:
                server.login(username, password or "")
            server.send_message(message)


def _unauthorized_social_login() -> HTTPException:
    """Construye el error uniforme para credenciales sociales inválidas."""
    return HTTPException(status_code=401, detail="No se pudo verificar la cuenta del proveedor.")


async def _verify_google_id_token(id_token: str) -> dict:
    """Valida el ID token con Google y extrae solo identidad verificada."""
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=503, detail="El inicio con Google no está configurado.")
    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": id_token},
        )
    if response.status_code != 200:
        raise _unauthorized_social_login()
    claims = response.json()
    if (
        claims.get("aud") != client_id
        or claims.get("email_verified") not in (True, "true")
        or not claims.get("email")
        or not claims.get("sub")
    ):
        raise _unauthorized_social_login()
    return {
        "subject": claims["sub"],
        "email": claims["email"].lower(),
        "email_verified": True,
        "name": claims.get("name"),
    }


def _login_or_create_social_user(provider: str, identity: dict, db: Session) -> User:
    """Vincula la identidad OAuth existente o crea cuenta y vínculo nuevos."""
    subject = str(identity["subject"])
    linked_identity = (
        db.query(OAuthIdentity)
        .filter_by(provider=provider, provider_subject=subject)
        .first()
    )
    if linked_identity:
        user = db.query(User).filter(User.id == linked_identity.user_id).first()
        if user:
            return user

    email = identity.get("email") if identity.get("email_verified") else None
    user = db.query(User).filter(User.email == email).first() if email else None
    if not user:
        email = email or f"{provider}-{hashlib.sha256(subject.encode()).hexdigest()[:32]}@social.agroplantas.invalid"
        user = User(
            email=email,
            nombre=identity.get("name"),
            hashed_password=hash_password(secrets.token_urlsafe(32)),
        )
        db.add(user)
        db.flush()

    db.add(OAuthIdentity(user_id=user.id, provider=provider, provider_subject=subject))
    db.commit()
    db.refresh(user)
    return user


def _user_out(user: User) -> UserOut:
    """Forma el perfil público e incluye cuándo se podrá cambiar el nombre."""
    result = UserOut.model_validate(user)
    available_at = (
        user.nombre_changed_at + timedelta(days=30)
        if user.nombre_changed_at
        else None
    )
    return result.model_copy(update={"nombre_change_available_at": available_at})


@router.post("/social/google", response_model=TokenResponse)
async def google_login(
    payload: SocialLoginRequest,
    db: Session = Depends(get_db),
):
    """Verifica Google, crea/recupera usuario y emite el JWT de la aplicación."""
    try:
        identity = await _verify_google_id_token(payload.credential)
    except httpx.RequestError as error:
        logger.warning("security_event=social_provider_unavailable provider=google error=%s", type(error).__name__)
        raise HTTPException(status_code=503, detail="No se pudo verificar con Google. Intenta de nuevo.") from error

    user = _login_or_create_social_user("google", identity, db)
    token = create_access_token(user.id, user.email)
    return TokenResponse(access_token=token, user=_user_out(user))


@router.post("/backup/google-drive")
async def backup_to_google_drive(
    payload: GoogleDriveBackupRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Valida el permiso Drive y sube al Drive privado un JSON de la cuenta."""
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            profile_response = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {payload.access_token}"},
            )
            if profile_response.status_code != 200:
                raise HTTPException(status_code=401, detail="La autorización de Google expiró; vuelve a autorizar Drive.")
            google_profile = profile_response.json()
            if not google_profile.get("email") or google_profile.get("email_verified") is not True:
                raise HTTPException(status_code=401, detail="Google no confirmó el correo de esta cuenta.")

        records = (
            db.query(Identification)
            .filter(Identification.user_id == current_user.id)
            .order_by(Identification.created_at.asc())
            .all()
        )
        backup_data = {
            "format_version": 1,
            "created_at": datetime.utcnow().isoformat() + "Z",
            "account": {
                "email": current_user.email,
                "nombre": current_user.nombre,
                "avatar_base64": current_user.avatar_base64,
            },
            "identifications": [
                {
                    "clase_predicha": record.clase_predicha,
                    "cultivo": record.cultivo,
                    "estado": record.estado,
                    "confianza": record.confianza,
                    "reconocido": record.reconocido,
                    "is_healthy": record.is_healthy,
                    "has_pest": record.has_pest,
                    "has_disease": record.has_disease,
                    "data_json": record.data_json,
                    "imagen_miniatura": record.imagen_miniatura,
                    "created_at": record.created_at.isoformat() if record.created_at else None,
                }
                for record in records
            ],
        }
        backup_json = json.dumps(backup_data, ensure_ascii=False, separators=(",", ":"))
        if len(backup_json.encode("utf-8")) > 20 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="El respaldo supera el límite de 20 MB.")

        boundary = f"agroplantas-{secrets.token_hex(16)}"
        metadata = json.dumps(
            {
                "name": f"agroplantas-backup-{datetime.utcnow():%Y%m%d-%H%M%S}.json",
                "mimeType": "application/json",
            }
        )
        body = (
            f"--{boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n{metadata}\r\n"
            f"--{boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n{backup_json}\r\n"
            f"--{boundary}--"
        ).encode("utf-8")
        async with httpx.AsyncClient(timeout=20.0) as client:
            upload_response = await client.post(
                "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
                content=body,
                headers={
                    "Authorization": f"Bearer {payload.access_token}",
                    "Content-Type": f"multipart/related; boundary={boundary}",
                },
            )
    except httpx.RequestError as error:
        logger.warning("security_event=google_drive_unavailable error=%s", type(error).__name__)
        raise HTTPException(status_code=503, detail="Google Drive no está disponible. Intenta de nuevo.") from error
    if upload_response.status_code not in (200, 201):
        logger.warning("security_event=google_drive_backup_failed status=%d", upload_response.status_code)
        raise HTTPException(status_code=502, detail="Google Drive no pudo guardar la copia. Reintenta la autorización.")
    return {"message": "Copia guardada en Google Drive.", "file": upload_response.json()}


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Crea un usuario con contraseña hash y devuelve una sesión JWT."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una cuenta con ese correo.",
        )

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        nombre=payload.nombre,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.email)
    return TokenResponse(access_token=token, user=_user_out(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Verifica correo/contraseña y registra un evento si falla el acceso."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        logger.warning("security_event=login_failure email_hash=%s", hashlib.sha256(payload.email.lower().encode()).hexdigest()[:16])
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos.",
        )

    token = create_access_token(user.id, user.email)
    return TokenResponse(access_token=token, user=_user_out(user))


@router.post("/password/forgot")
def request_password_reset(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    """Genera un token de un solo uso y responde sin revelar si existe el correo."""
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        now = datetime.utcnow()
        db.query(PasswordResetToken).filter(
            PasswordResetToken.expires_at <= now
        ).delete(synchronize_session=False)
        token = secrets.token_urlsafe(32)
        token_record = PasswordResetToken(
            user_id=user.id,
            token_hash=hashlib.sha256(token.encode()).hexdigest(),
            expires_at=now + timedelta(minutes=30),
        )
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used.is_(False),
        ).update({PasswordResetToken.used: True})
        db.add(token_record)
        db.commit()
        try:
            _send_password_reset_email(user.email, token)
        except Exception:
            token_record.used = True
            db.commit()
            logger.exception("security_event=password_reset_delivery_failed")

    return {"message": "Si el correo está registrado, recibirás instrucciones para restablecer la contraseña."}


@router.post("/password/reset")
def reset_password(payload: PasswordResetConfirm, db: Session = Depends(get_db)):
    """Valida vigencia del token, cambia la clave y revoca tokens pendientes."""
    token_hash = hashlib.sha256(payload.token.encode()).hexdigest()
    token_record = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token_hash == token_hash)
        .with_for_update()
        .first()
    )
    if (
        not token_record
        or token_record.used
        or token_record.expires_at <= datetime.utcnow()
    ):
        raise HTTPException(status_code=400, detail="El enlace no es válido o ha expirado.")

    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="El enlace no es válido o ha expirado.")

    user.hashed_password = hash_password(payload.new_password)
    token_record.used = True
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used.is_(False),
    ).update({PasswordResetToken.used: True})
    db.commit()
    return {"message": "Contraseña actualizada. Ya puedes iniciar sesión."}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    """Devuelve el perfil de la sesión autenticada."""
    return _user_out(current_user)


@router.put("/me", response_model=UserOut)
def update_profile(
    payload: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Actualiza el nombre con una limitación de un cambio cada 30 días."""
    new_name = payload.nombre.strip()
    if not new_name:
        raise HTTPException(status_code=422, detail="El nombre no puede estar vacío.")
    if new_name == (current_user.nombre or ""):
        return _user_out(current_user)

    now = datetime.utcnow()
    allowed_change = or_(
        User.nombre_changed_at.is_(None),
        User.nombre_changed_at <= now - timedelta(days=30),
    )
    result = db.execute(
        update(User)
        .where(User.id == current_user.id, allowed_change)
        .values(nombre=new_name, nombre_changed_at=now)
    )
    if result.rowcount != 1:
        available_at = current_user.nombre_changed_at + timedelta(days=30)
        raise HTTPException(
            status_code=429,
            detail=f"Solo puedes cambiar tu nombre una vez cada 30 días. Disponible desde {available_at.isoformat()}.",
        )
    db.commit()
    db.refresh(current_user)
    return _user_out(current_user)


@router.put("/me/avatar", response_model=UserOut)
def update_avatar(
    payload: AvatarUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Valida formato de imagen y guarda el avatar de la cuenta autenticada."""
    if not payload.avatar_base64.startswith(("data:image/jpeg;base64,", "data:image/png;base64,", "data:image/webp;base64,")):
        raise HTTPException(status_code=422, detail="El avatar debe ser JPEG, PNG o WebP.")
    current_user.avatar_base64 = payload.avatar_base64
    db.commit()
    db.refresh(current_user)
    return _user_out(current_user)

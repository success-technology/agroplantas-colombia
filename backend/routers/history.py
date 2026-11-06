"""
Endpoints de historial de identificaciones. Todos requieren sesión
iniciada (token Bearer) — reemplazan el guardado en localStorage.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db
from db_models import User, Identification
from schemas_auth import IdentificationCreate, IdentificationOut
from auth_deps import get_current_user

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=list[IdentificationOut])
def listar_historial(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista las identificaciones propias en orden cronológico descendente."""
    items = (
        db.query(Identification)
        .filter(Identification.user_id == current_user.id)
        .order_by(desc(Identification.created_at))
        .all()
    )
    return items


@router.post("", response_model=IdentificationOut)
def crear_identificacion(
    payload: IdentificationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Guarda un resultado validado y lo asocia al usuario autenticado."""
    item = Identification(user_id=current_user.id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def borrar_identificacion(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Elimina un registro solo si pertenece al usuario de la sesión."""
    item = (
        db.query(Identification)
        .filter(Identification.id == item_id, Identification.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Identificación no encontrada.",
        )
    db.delete(item)
    db.commit()
    return {"ok": True}


@router.delete("")
def borrar_todo_el_historial(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Elimina todos los registros de historial del usuario actual."""
    db.query(Identification).filter(Identification.user_id == current_user.id).delete()
    db.commit()
    return {"ok": True}

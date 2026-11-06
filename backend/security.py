"""Controles básicos de frecuencia y registro de actividad sospechosa."""
import asyncio
import logging
import os
import time
from collections import defaultdict, deque

import httpx
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

logger = logging.getLogger("security")


async def _send_alert(client_ip: str, path: str, attempts: int) -> None:
    """Notifica al webhook configurado cuando hay abuso de autenticación."""
    webhook_url = os.environ.get("SECURITY_ALERT_WEBHOOK_URL")
    if not webhook_url:
        return
    payload = {
        "text": f"Actividad sospechosa de autenticación: {client_ip}, {path}, {attempts} intentos.",
        "event": "suspicious_auth_activity",
        "client_ip": client_ip,
        "path": path,
        "attempts": attempts,
    }
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.post(webhook_url, json=payload)
            response.raise_for_status()
    except httpx.HTTPError:
        logger.exception("security_event=alert_delivery_failed")


class AuthRateLimitMiddleware(BaseHTTPMiddleware):
    """Límites por IP y ruta; para producción multi-instancia usar Redis/proxy."""

    POLICIES = {
        "/api/auth/login": (10, 15 * 60),
        "/api/auth/register": (5, 60 * 60),
        "/api/auth/password/forgot": (5, 60 * 60),
        "/api/auth/password/reset": (5, 60 * 60),
        "/api/auth/social/google": (10, 15 * 60),
    }

    def __init__(self, app):
        """Inicializa contadores en memoria para límites por IP y endpoint."""
        super().__init__(app)
        self.requests = defaultdict(deque)
        self.alerted = set()
        self.last_cleanup = 0.0

    async def dispatch(self, request: Request, call_next):
        """Aplica la ventana de intentos y responde 429 si se supera el límite."""
        policy = self.POLICIES.get(request.url.path)
        if not policy or request.method != "POST":
            return await call_next(request)

        limit, window_seconds = policy
        client_ip = request.client.host if request.client else "unknown"
        key = (client_ip, request.url.path)
        now = time.monotonic()
        if now - self.last_cleanup >= 60:
            for old_key, old_attempts in list(self.requests.items()):
                while old_attempts and now - old_attempts[0] >= max(
                    window for _, window in self.POLICIES.values()
                ):
                    old_attempts.popleft()
                if not old_attempts:
                    self.requests.pop(old_key, None)
                    self.alerted.discard(old_key)
            self.last_cleanup = now
        attempts = self.requests[key]

        while attempts and now - attempts[0] >= window_seconds:
            attempts.popleft()
        if not attempts:
            self.alerted.discard(key)

        if len(attempts) >= limit:
            if key not in self.alerted:
                logger.warning(
                    "security_event=suspicious_auth_activity client_ip=%s path=%s attempts=%d",
                    client_ip,
                    request.url.path,
                    len(attempts),
                )
                asyncio.create_task(_send_alert(client_ip, request.url.path, len(attempts)))
                self.alerted.add(key)
            retry_after = max(1, int(window_seconds - (now - attempts[0])))
            return JSONResponse(
                status_code=429,
                content={"detail": "Demasiados intentos. Espera antes de volver a intentarlo."},
                headers={"Retry-After": str(retry_after)},
            )

        attempts.append(now)
        return await call_next(request)

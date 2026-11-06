# Seguridad y operación

Estas medidas reducen abuso común; no garantizan que la aplicación sea inmune a ataques. Mantén actualizados el sistema, dependencias y servicios administrados.

## Autenticación y recuperación

El API limita por IP: 10 solicitudes de inicio de sesión por 15 minutos, 5 registros por hora y 5 solicitudes de recuperación/cambio por hora. La respuesta por correo desconocido es igual a la respuesta por correo registrado. Los enlaces de restablecimiento duran 30 minutos, se almacenan como hash y se invalidan después de usarse o al solicitar uno nuevo.

Configura en el entorno del backend:

- `APP_ENV=production`
- `JWT_SECRET`: secreto aleatorio largo. En PowerShell puedes generarlo así y pegar el resultado directamente en el gestor de secretos del proveedor, no en Git:

	```powershell
	$bytes = New-Object byte[] 48
	[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
	[Convert]::ToBase64String($bytes)
	```
- `ALLOWED_ORIGINS=https://agroplantas-colombia.vercel.app` (añade únicamente los otros dominios legítimos, separados por comas).
- `FRONTEND_URL=https://agroplantas-colombia.vercel.app`
- `SMTP_HOST`, `SMTP_PORT` (587 con STARTTLS o 465 con TLS), `SMTP_FROM`, `SMTP_USERNAME` y `SMTP_PASSWORD` para enviar recuperación.
- `SECURITY_ALERT_WEBHOOK_URL` para recibir alertas en un webhook compatible (por ejemplo, un webhook entrante de Slack). Guárdalo como secreto y no lo incluyas en logs ni en el repositorio.

Si SMTP no está configurado o falla, el usuario ve la respuesta neutral igualmente y el backend registra `security_event=password_reset_delivery_failed`; la recuperación no llegará hasta resolver el correo.

Si el frontend móvil llama directamente al API en desarrollo, agrega el origen exacto del frontend en la LAN a `ALLOWED_ORIGINS` (por ejemplo, `http://192.168.1.20:3000`) y reinicia el backend.

En el flujo local recomendado, deja `VITE_API_URL` vacío y usa el proxy de Vite en `http://<IP-DE-TU-PC>:3000`; así el navegador móvil habla con Vite y Vite reenvía las llamadas al backend local. Si el frontend móvil se sirve desde otro dominio o llama directamente al API, configura ese dominio en `ALLOWED_ORIGINS` y apunta `VITE_API_URL` al backend compartido.

Una base SQLite de desarrollo y la PostgreSQL productiva contienen cuentas distintas. Si el login funciona en PC pero falla en teléfono, confirma primero que ambos están abriendo la misma URL del frontend y que esa compilación tiene el `VITE_API_URL` correcto. No copies credenciales entre entornos esperando que se sincronicen; registra la cuenta en el entorno compartido o migra los datos de forma controlada.

La CSP y otros encabezados del navegador están en `frontend/vercel.json`; Vercel debe desplegar desde la carpeta `frontend` para aplicarlos. Si el API usa un dominio distinto de `*.onrender.com`, ajusta `connect-src` de la CSP a ese dominio exacto. Vercel y Render deben servir por HTTPS; HSTS se activa en el API. No expongas Uvicorn por HTTP directo a Internet.

## Alertas de acceso

Los intentos fallidos generan `security_event=login_failure`; al superar el límite se emite una sola alerta por ventana con `security_event=suspicious_auth_activity` y se envía al webhook configurado. Revisa también los logs del backend y configura una alerta en el proveedor si el webhook no está habilitado.

El limitador es local al proceso: se reinicia al reiniciar el backend y no coordina varias instancias. Para producción con varias réplicas, mueve los contadores a Redis o aplica rate limiting en un proxy/WAF administrado. No confíes en `X-Forwarded-For` sin configurar explícitamente proxies de confianza.

## Login social, Drive y perfil

Los valores de ejemplo están en `frontend/.env.example` y `backend/.env.example`. Para desarrollo local, copia cada ejemplo a su `.env` correspondiente: Vite lee `frontend/.env` y FastAPI carga `backend/.env` al arrancar. Ambos `.env` están ignorados por Git. En producción, copia las variables públicas a Vercel como variables `VITE_*` y configura las variables del backend en Render como secretos; no subas valores reales a Git. Después de cambiar `VITE_*`, reinicia Vite o vuelve a desplegar Vercel.

### Google y copia de Drive

1. En Google Cloud crea un cliente OAuth de tipo aplicación web y agrega los orígenes permitidos (`http://localhost:3000` para desarrollo y el dominio Vercel de producción).
2. Activa Google Identity Services y Google Drive API para el mismo proyecto.
3. Configura `VITE_GOOGLE_CLIENT_ID` en Vercel/local frontend y el mismo `GOOGLE_CLIENT_ID` en el backend.
4. El respaldo pide autorización del usuario con el alcance `drive.file` y `userinfo.email`, valida la identidad en el backend y crea un JSON privado en el Drive de esa persona. Cada respaldo incluye su perfil y su historial, nunca el de otros usuarios.

### Nombre y foto

El backend aplica el límite de cambio de nombre por usuario en una actualización atómica: como máximo una vez cada 30 días. El avatar se reduce en el navegador y se limita a JPEG, PNG o WebP; se guarda como imagen de perfil de la cuenta autenticada.

Las integraciones no funcionan hasta registrar/configurar las aplicaciones en cada proveedor. Si falta una variable, el flujo muestra un error de proveedor no configurado y no crea una sesión ficticia.

El login social implementado es **Google**; X y Facebook se retiraron. El backend verifica el ID token, su audiencia y la identidad antes de emitir el JWT propio de la aplicación. El frontend guarda ese JWT en `localStorage`, así que protege el dispositivo y evita XSS; no es una cookie HttpOnly.

La página `/privacidad` enlaza los documentos de privacidad y cookies en Google Docs. En cada documento habilita lectura para cualquier persona con el enlace y pruébalo sin una sesión de Google. El consentimiento guardado por `agroplantas_cookie_consent` distingue `all` de `necessary`, pero actualmente no hay cookies de analítica/publicidad ni scripts opcionales; `all` no carga tecnologías extra. No describas el botón como activación de seguimiento no existente.

El cambio de contraseña y el backup de Drive requieren sus servicios habilitados y credenciales válidas. No registres tokens de Drive ni contraseñas SMTP/JWT en logs, variables `VITE_*` o el repositorio. El Client ID OAuth es público, pero el secreto del backend y las claves de proveedor no.

## Copias de seguridad

El script crea una copia consistente de SQLite (`backend/agroplantas.db` por defecto) o un dump PostgreSQL y conserva 30 días por defecto:

```powershell
python scripts/backup_database.py
```

Variables opcionales: `BACKUP_DIR` para un volumen/disco de destino y `BACKUP_RETENTION_DAYS` para cambiar la retención. PostgreSQL requiere `pg_dump` instalado y `DATABASE_URL` configurada. El script no cifra ni sube las copias: almacénalas en un destino privado, cifrado y separado del servidor. No guardes backups en una carpeta pública ni dentro del frontend.

Programa la ejecución diaria con el Programador de tareas de Windows o cron. En Windows, usa como programa el `python.exe` del entorno virtual y como argumento `scripts/backup_database.py`; establece la carpeta del proyecto como directorio de inicio. Vigila el código de salida y el espacio disponible.

El backup desde **Ajustes** es otra función: exporta el perfil/historial del usuario como JSON privado en su Google Drive tras autorizar `drive.file`. No reemplaza el backup periódico de la base de datos. La exportación JSON desde la interfaz es una descarga local.

Verifica periódicamente la restauración en una base de pruebas: usa `pg_restore` para los `.dump` de PostgreSQL. Para SQLite, detén el backend y restaura el `.sqlite3` a una ubicación de prueba antes de reemplazar datos. Un archivo generado no es una copia válida hasta que se ha comprobado su restauración.

## Despliegue

- En Render configura `APP_ENV`, `JWT_SECRET`, `ALLOWED_ORIGINS`, `FRONTEND_URL`, los valores SMTP y, opcionalmente, `SECURITY_ALERT_WEBHOOK_URL` como variables secretas.
- En Vercel confirma que se aplican los encabezados de `frontend/vercel.json` después del despliegue.
- Prueba login, recuperación por correo, el límite `429`, una alerta de prueba en el webhook y la restauración del backup antes de considerar terminado el endurecimiento.
- Los planes Pro/Premium y `/pago/:planId` están ocultos por `COMMERCIAL_PLANS_ENABLED = false` durante la presentación institucional. Al habilitarlos, hoy solo muestran información: no conectan un procesador, no guardan medios de pago ni asignan beneficios. El backend aplica seis análisis por 24 horas a todas las cuentas. No anuncies suscripciones como activas hasta implementar el ciclo completo y validar webhooks.

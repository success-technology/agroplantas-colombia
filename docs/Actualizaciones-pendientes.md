# Estado de entrega — AgroPlantas Colombia

Este documento reemplaza la lista inicial de tareas y distingue lo que ya existe en el código de lo que todavía depende de una integración externa o validación antes de producción.

## Implementado en el repositorio

- [x] Interfaz adaptable, navegación, modo oscuro y contraste revisado.
- [x] Carga de imágenes y captura desde cámara.
- [x] Pipeline de identificación con dos clasificadores MobileNetV2 (21 especies y 93 estados), rechazo de resultados inciertos y recomendaciones de catálogo.
- [x] Backend independiente del microservicio TensorFlow.
- [x] Registro/inicio de sesión con contraseña y flujo de Google OAuth.
- [x] Historial privado, edición de perfil, cambio de avatar, exportación JSON y copia JSON en Google Drive.
- [x] Cuota backend de seis análisis por 24 horas, también para invitados.
- [x] Ajustes de idioma ES/EN, fuente, tema y notificaciones del navegador.
- [x] Soporte, preguntas frecuentes, preferencias de cookies y rutas/enlaces legales.
- [x] Páginas de planes y pago preparadas detrás de un interruptor; permanecen ocultas durante la presentación institucional.
- [x] Script de backup SQLite/PostgreSQL y documentación de arquitectura/seguridad.

## Requisitos externos para publicar o entregar

- [ ] **Pagos y planes:** después de la presentación, seleccionar/configurar una pasarela, validar webhooks y activar suscripción/cancelación. Para reabrir las páginas, cambiar `COMMERCIAL_PLANS_ENABLED` a `true` en `frontend/src/lib/features.ts`; hoy las rutas redirigen al inicio y el backend aplica seis análisis/24 h a todas las cuentas.
- [ ] **OAuth Google:** comprobar Client ID de producción, orígenes JavaScript permitidos y URL HTTPS autorizada; configurar el mismo proyecto/cliente en frontend y backend.
- [ ] **Google Drive backup:** habilitar Drive API y consentimientos requeridos; comprobar que el backup aparece en el Drive del usuario.
- [ ] **Google Docs legales:** publicar ambos documentos como lectores con enlace y confirmar apertura en una ventana privada. El frontend solo presenta enlaces a esos documentos.
- [ ] **Recuperación por correo:** configurar credenciales SMTP como secretos en el entorno del backend y probar entrega real.
- [ ] **Producción:** configurar `JWT_SECRET`, `DATABASE_URL` PostgreSQL, `ALLOWED_ORIGINS`, `FRONTEND_URL`, URLs de backend/ML y CSP; asegurar HTTPS, persistencia y logs.
- [ ] **Backups:** programar `scripts/backup_database.py` en infraestructura con almacenamiento separado, cifrado y prueba documentada de restauración.
- [ ] **Modelo:** crear/revisar el conjunto TEST multiclase independiente y ejecutar evaluación. El archivo de evaluación actual solo incluye `PlantVillage` y no es válido para afirmar rendimiento sobre el modelo de 93 clases.
- [ ] **Piloto de campo:** completar [EVALUACION_PILOTO.md](EVALUACION_PILOTO.md), revisar las recomendaciones con especialista y registrar errores/incertidumbres.
- [ ] **QA de lanzamiento:** probar login, Google, historial entre dispositivos, cámara/notificaciones móvil, accesibilidad, CORS y límites de cuota en el dominio publicado.

## Elementos que no se deben anunciar como activos

- Cobros, prueba de 7 días cobrada automáticamente o suscripción recurrente.
- Diferencia de cupos/beneficios operativos entre plan gratuito, Pro y Premium.
- Notificaciones push cuando la app está cerrada; las notificaciones actuales son locales al navegador en contexto compatible.
- Página funcional de favoritos; la ruta actual es placeholder.
- Precisión de 100% basada en `models/evaluation_report.json`.

La descripción de módulos y responsabilidades está en [ARQUITECTURA.md](ARQUITECTURA.md). Las instrucciones de secretos y despliegue están en [SEGURIDAD.md](SEGURIDAD.md).

# Despliegue web en Vercel

## Qué se despliega

Vercel aloja la aplicación React/Vite que está en `frontend/`. La API FastAPI, la base PostgreSQL y el servicio TensorFlow de `ml_service/` son procesos separados y deben estar disponibles en un proveedor de backend. El frontend no puede analizar imágenes ni autenticar usuarios en producción si esas URLs no están configuradas.

## Configuración recomendada del proyecto Vercel

En **Settings → General → Build and Development Settings**, usa:

- **Root Directory:** `frontend`
- **Framework Preset:** `Vite`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm ci`
- **Node.js Version:** `20.x` o superior

La carpeta `frontend/` contiene su propio `package.json`, `package-lock.json` y `vercel.json`. Ese archivo agrega las cabeceras de seguridad y reescribe rutas como `/login` a la aplicación SPA para evitar un 404 al recargar.

También se admite configurar Vercel con la raíz del repositorio (`.`): el `vercel.json` de la raíz define `npm run build` y `frontend/dist`, y el paquete raíz contiene las dependencias necesarias para ese modo. Evita combinar la raíz `frontend` con el directorio de salida `frontend/dist`; dentro de `frontend`, la salida correcta es `dist`.

## Variables de entorno de Vercel

En **Settings → Environment Variables**, configura para Production (y Preview si se usará):

| Variable | Valor |
| --- | --- |
| `VITE_API_URL` | URL HTTPS pública del backend, por ejemplo `https://<servicio-backend>.onrender.com` |
| `VITE_GOOGLE_CLIENT_ID` | ID público del cliente OAuth Web de Google |

Después de cambiar una variable `VITE_*`, crea un nuevo despliegue: Vite las incorpora al bundle durante la compilación. No uses `localhost` como URL productiva.

En Google Cloud, agrega el dominio de producción de Vercel como origen autorizado de JavaScript. El mismo Client ID debe estar configurado en el backend como `GOOGLE_CLIENT_ID`.

## Variables del backend

En el proveedor donde corra FastAPI configura como mínimo:

- `APP_ENV=production`
- `JWT_SECRET`: valor aleatorio secreto, distinto del ejemplo local
- `DATABASE_URL`: PostgreSQL persistente
- `ALLOWED_ORIGINS`: origen exacto del sitio Vercel, sin rutas
- `FRONTEND_URL`: URL pública del frontend
- `ML_SERVICE_URL`: URL HTTPS pública del microservicio de inferencia
- `GOOGLE_CLIENT_ID`: el mismo ID usado por Vercel

Configura SMTP si se habilitará recuperación de contraseña. El microservicio ML también requiere sus archivos de modelos y debe responder correctamente en `/health`.

## Archivos ocultos y secretos

Los `.env` locales están excluidos de Git mediante `.gitignore`. Vercel no recibe esos archivos: sus valores se agregan desde el panel Environment Variables. Los archivos `.env.example` son plantillas vacías/de desarrollo y no contienen credenciales de producción. Nunca subas `JWT_SECRET`, contraseñas SMTP, tokens OAuth privados ni URLs de base de datos con contraseña.

## Comprobación de un despliegue fallido

Abre **Deployments → despliegue fallido → Build Logs**. El icono rojo solo indica que falló, no revela la causa. Identifica primero si falló `Installing dependencies`, `Building` o una comprobación del proveedor. Para errores de módulo no encontrado, confirma que la raíz y el lockfile pertenecen al mismo `package.json`; para errores de API después de desplegar, confirma `VITE_API_URL`, CORS y que backend/ML estén activos.

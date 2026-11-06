// frontend/src/lib/authStore.ts
//
// Autenticación real contra el backend (FastAPI + JWT).
// Solo el token se guarda en localStorage; los datos del usuario
// se piden al backend cuando se necesitan (getUser).

import { API_BASE } from './apiBase';

const TOKEN_KEY = 'agroidentify_token';

export interface UserProfile {
  id: number;
  email: string;
  nombre: string | null;
  avatar_base64?: string | null;
  nombre_change_available_at?: string | null;
}

/** Error tipado para conservar mensajes funcionales devueltos por la API. */
class AuthError extends Error {}

/** Lee el JWT persistido para adjuntarlo a las solicitudes autenticadas. */
function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** Persiste el JWT emitido por el backend en el navegador actual. */
function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Elimina la sesión local al cerrar sesión o invalidar credenciales. */
function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** Notifica a encabezado, guardas y componentes que cambió el estado de cuenta. */
function notifyProfileUpdated(profile: UserProfile | null): void {
  window.dispatchEvent(new CustomEvent<UserProfile | null>('agroplantas:profile-updated', { detail: profile }));
}

/** Comprueba presencia de token; el servidor sigue validando su vigencia real. */
export function isLoggedIn(): boolean {
  return !!getToken();
}

/** Construye Authorization Bearer cuando existe una sesión local. */
export function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Extrae detalle del API y ofrece un mensaje alternativo si no es JSON. */
async function parseErrorDetail(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data.detail || 'Ocurrió un error inesperado.';
  } catch {
    return 'Ocurrió un error inesperado.';
  }
}

/** Produce un error con el destino de API que ayudaría a depurar conexión. */
function connectionError(): AuthError {
  const endpoint = API_BASE || window.location.origin;
  return new AuthError(
    `No se pudo conectar con el servidor (${endpoint}). En el teléfono, abre la dirección de red de la PC y verifica que el frontend y el backend estén activos.`
  );
}

/** Registra cuenta, guarda el JWT de respuesta y emite evento de perfil. */
export async function register(
  email: string,
  password: string,
  nombre?: string
): Promise<UserProfile> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nombre }),
    });
  } catch {
    throw connectionError();
  }
  if (!res.ok) throw new AuthError(await parseErrorDetail(res));
  const data = await res.json();
  setToken(data.access_token);
  notifyProfileUpdated(data.user);
  return data.user;
}

/** Autentica con correo, maneja errores y guarda JWT/perfil recibidos. */
export async function login(email: string, password: string): Promise<UserProfile> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw connectionError();
  }
  if (res.status === 401) {
    const apiTarget = API_BASE
      ? `${API_BASE}/api/auth/login`
      : `${window.location.origin}/api/auth/login (proxy configurado)`;
    throw new AuthError(
      `Correo o contraseña incorrectos. Este intento consultó ${apiTarget}. Si tu cuenta funciona en otro dispositivo, verifica que ambos usen el mismo backend y base de datos.`
    );
  }
  if (!res.ok) throw new AuthError(await parseErrorDetail(res));
  const data = await res.json();
  setToken(data.access_token);
  notifyProfileUpdated(data.user);
  return data.user;
}

/** Envía el ID token de Google al backend para verificación y sesión propia. */
export async function loginWithGoogle(credential: string): Promise<UserProfile> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/auth/social/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });
  } catch {
    throw connectionError();
  }
  if (!res.ok) throw new AuthError(await parseErrorDetail(res));
  const data = await res.json();
  setToken(data.access_token);
  notifyProfileUpdated(data.user);
  return data.user;
}

/** Actualiza el nombre con JWT y notifica a los elementos de interfaz. */
export async function updateProfileName(nombre: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ nombre }),
  });
  if (!res.ok) throw new AuthError(await parseErrorDetail(res));
  const profile: UserProfile = await res.json();
  notifyProfileUpdated(profile);
  return profile;
}

/** Envía el avatar serializado y publica el perfil actualizado. */
export async function updateAvatar(avatarBase64: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/auth/me/avatar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ avatar_base64: avatarBase64 }),
  });
  if (!res.ok) throw new AuthError(await parseErrorDetail(res));
  const profile: UserProfile = await res.json();
  notifyProfileUpdated(profile);
  return profile;
}

/** Solicita al backend crear el JSON de respaldo en Drive del usuario. */
export async function createGoogleDriveBackup(accessToken: string): Promise<{ message: string; file: { id: string; name: string; webViewLink?: string } }> {
  const res = await fetch(`${API_BASE}/api/auth/backup/google-drive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ access_token: accessToken }),
  });
  if (!res.ok) throw new AuthError(await parseErrorDetail(res));
  return res.json();
}

/** Solicita enlace de recuperación; el backend responde de forma neutral. */
export async function requestPasswordReset(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/password/forgot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new AuthError(await parseErrorDetail(res));
}

/** Consume token de recuperación para asignar una contraseña nueva. */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/password/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword }),
  });
  if (!res.ok) throw new AuthError(await parseErrorDetail(res));
}

/** Cierra la sesión en este dispositivo y actualiza el estado de la interfaz. */
export function logout(): void {
  clearToken();
  notifyProfileUpdated(null);
}

/**
 * Si la URL trae ?token=... (por ejemplo, al llegar desde la landing ya con
 * sesión iniciada ahí), lo guarda como la sesión de esta app y limpia el
 * parámetro de la URL para que no quede visible ni se comparta al copiar el link.
 * Se ejecuta una sola vez, al cargar este módulo.
 */
/** Consume token de URL legado, lo persiste y quita el parámetro visible. */
function captureTokenFromUrl(): void {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get('token');
  if (!tokenFromUrl) return;

  setToken(tokenFromUrl);

  params.delete('token');
  const newSearch = params.toString();
  const newUrl =
    window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
  window.history.replaceState({}, '', newUrl);
}

captureTokenFromUrl();

/** Solicita al backend el perfil asociado al JWT actual o devuelve sesión vacía. */
export async function getUser(): Promise<UserProfile | null> {
  const token = getToken();
  if (!token) return null;

  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: authHeader(),
  });

  if (res.status === 401) {
    // token inválido o expirado
    clearToken();
    return null;
  }
  if (!res.ok) return null;

  return res.json();
}

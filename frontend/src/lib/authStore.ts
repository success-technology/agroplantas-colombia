// frontend/src/lib/authStore.ts
//
// Autenticación real contra el backend (FastAPI + JWT).
// Solo el token se guarda en localStorage; los datos del usuario
// se piden al backend cuando se necesitan (getUser).

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'agroidentify_token';

export interface UserProfile {
  id: number;
  email: string;
  nombre: string | null;
}

class AuthError extends Error {}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

/** Header listo para usar en fetch a rutas protegidas. Vacío si no hay sesión. */
export function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseErrorDetail(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data.detail || 'Ocurrió un error inesperado.';
  } catch {
    return 'Ocurrió un error inesperado.';
  }
}

export async function register(
  email: string,
  password: string,
  nombre?: string
): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, nombre }),
  });
  if (!res.ok) throw new AuthError(await parseErrorDetail(res));
  const data = await res.json();
  setToken(data.access_token);
  return data.user;
}

export async function login(email: string, password: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new AuthError(await parseErrorDetail(res));
  const data = await res.json();
  setToken(data.access_token);
  return data.user;
}

export function logout(): void {
  clearToken();
}

/** Consulta el backend para saber quién está logueado. Devuelve null si no hay sesión (o expiró). */
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
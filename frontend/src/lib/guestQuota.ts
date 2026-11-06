import { API_BASE } from './apiBase';
import { authHeader } from './authStore';

const GUEST_ID_KEY = 'agroplantas_guest_id';
const GUEST_REMAINING_KEY = 'agroplantas_guest_remaining';
export const GUEST_ANALYSIS_LIMIT = 6;

export interface GuestQuotaStatus {
  authenticated: boolean;
  attempts: number;
  remaining: number;
  limit: number;
  reset_at: string | null;
  window_hours: number;
}

/** Reutiliza o genera un ID aleatorio local para identificar al invitado. */
export function getGuestId(): string {
  const stored = localStorage.getItem(GUEST_ID_KEY);
  if (stored) return stored;

  const generated = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  localStorage.setItem(GUEST_ID_KEY, generated);
  return generated;
}

/** Construye cabecera para que backend calcule cuota del invitado. */
export function guestHeaders(): Record<string, string> {
  return { 'X-Guest-ID': getGuestId() };
}

/** Lee cuota solo para pintar la interfaz mientras llega el estado del servidor. */
export function getCachedGuestRemaining(): number {
  const raw = localStorage.getItem(GUEST_REMAINING_KEY);
  if (raw === null) return GUEST_ANALYSIS_LIMIT;
  const cached = Number(raw);
  return Number.isInteger(cached) && cached >= 0 && cached <= GUEST_ANALYSIS_LIMIT
    ? cached
    : GUEST_ANALYSIS_LIMIT;
}

/** Actualiza caché y avisa a los componentes suscritos al cambio de cuota. */
export function setGuestRemaining(remaining: number, announce = true): void {
  const safeRemaining = Math.max(0, Math.min(GUEST_ANALYSIS_LIMIT, remaining));
  localStorage.setItem(GUEST_REMAINING_KEY, String(safeRemaining));
  if (announce) {
    window.dispatchEvent(new CustomEvent<number>('agroplantas:guest-quota-updated', { detail: safeRemaining }));
  }
}

/** Consulta cuota autoritativa del backend para cuenta o invitado. */
export async function fetchGuestQuotaStatus(): Promise<GuestQuotaStatus> {
  const response = await fetch(`${API_BASE}/api/guest/quota`, {
    headers: { ...authHeader(), ...guestHeaders() },
  });
  if (!response.ok) throw new Error('No se pudo consultar la cuota de análisis.');
  const quota: GuestQuotaStatus = await response.json();
  setGuestRemaining(quota.remaining);
  return quota;
}

/** Refresca cuota en servidor y devuelve el número de análisis restantes. */
export async function refreshGuestQuota(): Promise<number> {
  const quota = await fetchGuestQuotaStatus();
  setGuestRemaining(quota.remaining);
  return quota.remaining;
}

/** Base URL configurable; vacía usa el proxy de Vite en desarrollo. */
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

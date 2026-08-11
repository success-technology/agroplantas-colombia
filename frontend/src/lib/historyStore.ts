// frontend/src/lib/historyStore.ts
import { PredictionResult } from '../types';
import { authHeader, isLoggedIn } from './authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const THUMB_MAX_WIDTH = 480;

export interface HistoryItem {
  id: string;
  title: string;
  crop: string;
  confidence: number;
  date: string;
  timestamp: number;
  image: string; // data URL (miniatura comprimida)
  isHealthy: boolean;
  hasPest: boolean;
  hasDisease: boolean;
  statusLabel: string;
  prediction: PredictionResult;
}

/**
 * Convierte el archivo original en una miniatura JPEG en base64.
 * Esto evita mandar al backend imágenes de cámara a full resolución.
 */
function resizeImage(file: File, maxWidth = THUMB_MAX_WIDTH): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('No se pudo procesar la imagen'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// --- conversión entre el registro del backend y el HistoryItem del frontend ---

function boolToFlag(b: boolean): string {
  return b ? 'si' : 'no';
}

function flagToBool(f: string): boolean {
  return f === 'si';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function backendToItem(row: any): HistoryItem {
  let prediction: PredictionResult | null = null;
  try {
    prediction = row.data_json ? JSON.parse(row.data_json) : null;
  } catch {
    prediction = null;
  }
  const ts = new Date(row.created_at).getTime();

  return {
    id: String(row.id),
    title: row.reconocido === 'no' ? 'No identificada' : row.clase_predicha,
    crop: row.cultivo ?? '—',
    confidence: Math.round(row.confianza ?? 0),
    date: formatDate(ts),
    timestamp: ts,
    image: row.imagen_miniatura ?? '',
    isHealthy: flagToBool(row.is_healthy ?? 'no'),
    hasPest: flagToBool(row.has_pest ?? 'no'),
    hasDisease: flagToBool(row.has_disease ?? 'no'),
    statusLabel: row.estado ?? '',
    prediction: prediction as PredictionResult,
  };
}

/** Historial del usuario logueado. Si no hay sesión, devuelve []. */
export async function getHistory(): Promise<HistoryItem[]> {
  if (!isLoggedIn()) return [];

  const res = await fetch(`${API_BASE}/api/history`, {
    headers: authHeader(),
  });
  if (!res.ok) return [];

  const rows = await res.json();
  return rows.map(backendToItem);
}

export async function getLastIdentification(): Promise<HistoryItem | null> {
  const items = await getHistory();
  return items[0] ?? null;
}

/**
 * Guarda una identificación en el historial del backend.
 * Si no hay sesión iniciada, NO guarda nada (identificar sigue funcionando,
 * simplemente no queda registro) — devuelve el item igual para que la UI
 * pueda mostrar el resultado de esta identificación puntual.
 */
export async function saveIdentification(
  file: File,
  prediction: PredictionResult
): Promise<HistoryItem> {
  const image = await resizeImage(file);
  const info = prediction.plantInfo ?? prediction.recommendations;
  const a = prediction.analysis;
  const notRecognized = a?.recognized === false;

  const title = notRecognized
    ? 'No identificada'
    : a?.speciesName ?? info?.plantType ?? prediction.className;

  const localItem: HistoryItem = {
    id: `local-${Date.now()}`,
    title,
    crop: info?.plantType ?? '—',
    confidence: Math.round((prediction.confidence ?? 0) * 100),
    date: formatDate(Date.now()),
    timestamp: Date.now(),
    image,
    isHealthy: !!a?.isHealthy,
    hasPest: !!a?.hasPest,
    hasDisease: !!a?.hasDisease,
    statusLabel: a?.statusLabel ?? info?.healthStatus ?? '',
    prediction,
  };

  if (!isLoggedIn()) {
    // Sin sesión: no se guarda en ningún historial, solo se ve esta vez.
    return localItem;
  }

  const res = await fetch(`${API_BASE}/api/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({
      clase_predicha: prediction.className,
      cultivo: info?.plantType ?? null,
      estado: a?.statusLabel ?? info?.healthStatus ?? null,
      confianza: Math.round((prediction.confidence ?? 0) * 100),
      reconocido: notRecognized ? 'no' : 'si',
      is_healthy: boolToFlag(!!a?.isHealthy),
      has_pest: boolToFlag(!!a?.hasPest),
      has_disease: boolToFlag(!!a?.hasDisease),
      data_json: JSON.stringify(prediction),
      imagen_miniatura: image,
    }),
  });

  if (!res.ok) {
    // El backend rechazó el guardado (ej. token vencido) — no rompemos la UI,
    // devolvemos el resultado igual para que se pueda ver esta vez.
    return localItem;
  }

  const row = await res.json();
  return backendToItem(row);
}

export async function deleteHistoryItem(id: string): Promise<void> {
  if (!isLoggedIn()) return;
  await fetch(`${API_BASE}/api/history/${id}`, {
    method: 'DELETE',
    headers: authHeader(),
  });
}

export async function clearHistory(): Promise<void> {
  if (!isLoggedIn()) return;
  await fetch(`${API_BASE}/api/history`, {
    method: 'DELETE',
    headers: authHeader(),
  });
}
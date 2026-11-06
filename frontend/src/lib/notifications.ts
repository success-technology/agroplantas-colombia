const NOTIFICATIONS_KEY = 'agroplantas_analysis_notifications';

/** Comprueba la preferencia local para avisos de análisis completado. */
export function areAnalysisNotificationsEnabled(): boolean {
  return localStorage.getItem(NOTIFICATIONS_KEY) === 'enabled';
}

/** Solicita permiso y registra la preferencia si service worker está disponible. */
export async function enableAnalysisNotifications(): Promise<'enabled' | 'denied' | 'unsupported'> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported';
  const permission = Notification.permission === 'granted'
    ? 'granted'
    : await Notification.requestPermission();
  if (permission !== 'granted') {
    localStorage.removeItem(NOTIFICATIONS_KEY);
    return 'denied';
  }
  try {
    await navigator.serviceWorker.ready;
  } catch {
    return 'unsupported';
  }
  localStorage.setItem(NOTIFICATIONS_KEY, 'enabled');
  return 'enabled';
}

/** Apaga la preferencia local; no modifica el permiso global del navegador. */
export function disableAnalysisNotifications(): void {
  localStorage.removeItem(NOTIFICATIONS_KEY);
}

/** Muestra una notificación local al terminar el análisis si hay permiso activo. */
export async function notifyAnalysisComplete(plantName: string, language: 'es' | 'en'): Promise<void> {
  if (!areAnalysisNotificationsEnabled() || !('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(
      language === 'en' ? 'Plant analysis complete' : 'Análisis de planta completado',
      {
        body: language === 'en' ? `Result: ${plantName}` : `Resultado: ${plantName}`,
        icon: '/logo.png',
        badge: '/favicon.png',
        tag: 'agroplantas-analysis-complete',
        data: { url: '/identificar' },
      },
    );
  } catch {
    // A denied or unavailable OS notification must not affect the analysis.
  }
}

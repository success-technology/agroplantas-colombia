let googleScriptPromise: Promise<void> | null = null;

/** Carga una sola vez GIS y resuelve cuando login y OAuth quedan disponibles. */
export function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts.id && window.google.accounts.oauth2) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    let script = document.getElementById('google-identity-services') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'google-identity-services';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    if (window.google?.accounts.id && window.google.accounts.oauth2) {
      resolve();
      return;
    }

    script.addEventListener('load', () => {
      if (window.google?.accounts.id && window.google.accounts.oauth2) resolve();
      else reject(new Error('Google Identity Services no quedó disponible.'));
    }, { once: true });
    script.addEventListener('error', () => reject(new Error('No se pudo cargar Google Identity Services.')), { once: true });
  });

  googleScriptPromise.catch(() => { googleScriptPromise = null; });
  return googleScriptPromise;
}

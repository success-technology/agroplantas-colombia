/// <reference types="vite/client" />

/** Variables públicas que Vite expone durante compilación y ejecución. */
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
}

/** Amplía los tipos estándar de Vite con las variables de esta aplicación. */
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Tipos mínimos de Google Identity Services usados por login y respaldo Drive. */
interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (options: {
          client_id: string;
          callback: (response: { credential: string }) => void;
          ux_mode?: 'popup' | 'redirect';
        }) => void;
        renderButton: (element: HTMLElement, options: Record<string, string>) => void;
      };
      oauth2: {
        initTokenClient: (options: {
          client_id: string;
          scope: string;
          callback: (response: { access_token?: string; error?: string }) => void;
        }) => { requestAccessToken: (options?: { prompt?: string }) => void };
      };
    };
  };
}

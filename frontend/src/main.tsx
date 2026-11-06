/** Punto de entrada del frontend: carga estilos, registra PWA y monta la aplicación. */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Registra la caché offline después de que la página termine de cargar.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/service-worker.js').catch(() => {
      // The app remains usable when service workers are unavailable.
    });
  });
}

// Monta React dentro del elemento raíz definido en index.html.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

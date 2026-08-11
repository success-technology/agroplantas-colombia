// frontend/src/pages/AjustesPage.tsx
import React, { useEffect, useState } from 'react';
import { FiSettings, FiCpu, FiTrash2, FiCheckCircle, FiXCircle, FiInfo } from 'react-icons/fi';
import { getHistory, clearHistory } from '../lib/historyStore';
import { isLoggedIn } from '../lib/authStore';
import { HealthStatus } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

export const AjustesPage: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthError, setHealthError] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    getHistory().then((items) => setHistoryCount(items.length));
    fetch(`${API_BASE}/health`)
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealthError(true));
  }, []);

  const handleClear = async () => {
    await clearHistory();
    setHistoryCount(0);
    setConfirmClear(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Ajustes</h1>
      <p className="text-gray-500 mb-6">Configura tu cuenta y preferencias de la aplicación.</p>

      <div className="space-y-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FiCpu className="w-4 h-4 text-[#283618]" />
            <h2 className="font-semibold text-gray-900 text-sm">Estado del modelo</h2>
          </div>

          {healthError && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-lg p-3">
              <FiXCircle className="w-4 h-4 shrink-0" />
              No se pudo conectar con el backend. Verifica que esté corriendo.
            </div>
          )}

          {!health && !healthError && <p className="text-sm text-gray-400">Consultando...</p>}

          {health && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs mb-1">Estado</p>
                <p className="flex items-center gap-1.5 font-medium text-gray-900">
                  {health.model_loaded ? (
                    <>
                      <FiCheckCircle className="w-4 h-4 text-green-600" /> Modelo cargado
                    </>
                  ) : (
                    <>
                      <FiXCircle className="w-4 h-4 text-red-600" /> Modelo no cargado
                    </>
                  )}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Cultivos reconocidos</p>
                <p className="font-medium text-gray-900">{health.num_classes} clases</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Modelo entrenado</p>
                <p className="font-medium text-gray-900">{health.model_trained ? 'Sí' : 'Modo demostración'}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FiSettings className="w-4 h-4 text-[#283618]" />
            <h2 className="font-semibold text-gray-900 text-sm">Tu historial guardado</h2>
          </div>

          {!isLoggedIn() ? (
            <p className="text-sm text-gray-600 mb-4">
              Inicia sesión para ver y administrar tu historial de identificaciones.
            </p>
          ) : (
            <p className="text-sm text-gray-600 mb-4">
              Tienes <span className="font-semibold text-gray-900">{historyCount}</span> identificación
              {historyCount !== 1 ? 'es' : ''} guardada{historyCount !== 1 ? 's' : ''} en tu cuenta.
            </p>
          )}

          {!confirmClear ? (
            <button
              onClick={() => setConfirmClear(true)}
              disabled={historyCount === 0 || !isLoggedIn()}
              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed"
            >
              <FiTrash2 className="w-4 h-4" />
              Borrar todo el historial
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700">¿Seguro? Esta acción no se puede deshacer.</span>
              <button
                onClick={handleClear}
                className="text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-1.5"
              >
                Sí, borrar
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FiInfo className="w-4 h-4 text-[#283618]" />
            <h2 className="font-semibold text-gray-900 text-sm">Acerca de</h2>
          </div>
          <p className="text-sm text-gray-600">
            AgroPlantas Colombia identifica cultivos y detecta plagas o enfermedades a partir de
            fotos, usando un modelo de inteligencia artificial entrenado con miles de imágenes de
            campo y laboratorio. Tus identificaciones se guardan de forma privada en tu cuenta.
          </p>
        </div>
      </div>
    </div>
  );
};
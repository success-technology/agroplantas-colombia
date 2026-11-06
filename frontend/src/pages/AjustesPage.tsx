// frontend/src/pages/AjustesPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSettings, FiCpu, FiTrash2, FiCheckCircle, FiXCircle, FiInfo, FiUser, FiCloud, FiDownload, FiMoon, FiSun, FiType } from 'react-icons/fi';
import { getHistory, clearHistory } from '../lib/historyStore';
import {
  createGoogleDriveBackup,
  getUser,
  isLoggedIn,
  updateProfileName,
  UserProfile,
} from '../lib/authStore';
import { API_BASE } from '../lib/apiBase';
import { HealthStatus } from '../types';
import { loadGoogleIdentityScript } from '../lib/googleIdentity';
import { useTheme } from '../lib/themeStore';
import { useLanguage } from '../lib/languageStore';
import { areAnalysisNotificationsEnabled, disableAnalysisNotifications, enableAnalysisNotifications } from '../lib/notifications';
import { COMMERCIAL_PLANS_ENABLED } from '../lib/features';

/** Centraliza preferencias, perfil, modelo, historial y opciones de respaldo. */
export const AjustesPage: React.FC = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode, fontScale, setFontScale } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthError, setHealthError] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileName, setProfileName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [backupLink, setBackupLink] = useState<string | null>(null);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(areAnalysisNotificationsEnabled);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  useEffect(() => {
    getHistory().then((items) => setHistoryCount(items.length));
    getUser().then((currentUser) => {
      setProfile(currentUser);
      setProfileName(currentUser?.nombre || '');
    });
    fetch(`${API_BASE}/health`)
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealthError(true));
  }, []);

  // Guarda cambios del perfil y expone éxito/error al usuario.
  const handleSaveName = async (event: React.FormEvent) => {
    event.preventDefault();
    setAccountError(null);
    setAccountMessage(null);
    setBackupLink(null);
    setSavingName(true);
    try {
      const updatedProfile = await updateProfileName(profileName.trim());
      setProfile(updatedProfile);
      setProfileName(updatedProfile.nombre || '');
      setAccountMessage('Nombre actualizado. Podrás volver a cambiarlo en 30 días.');
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'No se pudo actualizar el nombre.');
    } finally {
      setSavingName(false);
    }
  };

  // Inicia autorización Drive solo cuando el Client ID está configurado.
  const handleGoogleBackup = () => {
    setAccountError(null);
    setAccountMessage(null);
    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      setAccountError('Google Drive no está configurado en esta versión de la app.');
      return;
    }

    setBackupBusy(true);
    void loadGoogleIdentityScript().then(() => requestDriveToken()).catch((error: Error) => {
      setAccountError(error.message);
      setBackupBusy(false);
    });
  };

  // Solicita alcance mínimo de Drive y envía el token temporal al backend.
  const requestDriveToken = () => {
    if (!window.google?.accounts.oauth2 || !import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      setAccountError('No se pudo iniciar la autorización de Google Drive.');
      setBackupBusy(false);
      return;
    }
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
      callback: async (response) => {
        if (response.error || !response.access_token) {
          setAccountError('No se autorizó el acceso a Google Drive.');
          setBackupBusy(false);
          return;
        }
        try {
          const result = await createGoogleDriveBackup(response.access_token);
          setAccountMessage(result.message);
          setBackupLink(result.file.webViewLink || null);
        } catch (error) {
          setAccountError(error instanceof Error ? error.message : 'No se pudo guardar la copia.');
        } finally {
          setBackupBusy(false);
        }
      },
    });
    tokenClient.requestAccessToken({ prompt: 'consent' });
  };

  // Confirma eliminación de todo el historial persistido de la cuenta.
  const handleClear = async () => {
    await clearHistory();
    setHistoryCount(0);
    setConfirmClear(false);
  };

  // Construye y descarga un JSON local con perfil e historial propio.
  const handleExportData = async () => {
    setExportBusy(true);
    setExportError(null);
    try {
      const identifications = await getHistory();
      const backup = {
        app: 'AgroPlantas Colombia',
        exported_at: new Date().toISOString(),
        account: profile ? { email: profile.email, nombre: profile.nombre } : null,
        identifications,
      };
      const file = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `agroplantas-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'No se pudieron exportar tus datos.');
    } finally {
      setExportBusy(false);
    }
  };

  // Habilita/deshabilita notificaciones respetando permiso del navegador.
  const handleNotificationToggle = async () => {
    setNotificationMessage(null);
    if (notificationsEnabled) {
      disableAnalysisNotifications();
      setNotificationsEnabled(false);
      return;
    }
    const result = await enableAnalysisNotifications();
    if (result === 'enabled') {
      setNotificationsEnabled(true);
      setNotificationMessage(t('Notificaciones activadas'));
    } else if (result === 'denied') {
      setNotificationMessage(t('Permiso bloqueado. Actívalo en la configuración del navegador.'));
    } else {
      setNotificationMessage(t('Las notificaciones requieren HTTPS y un navegador móvil compatible.'));
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('Ajustes')}</h1>
      <p className="text-gray-500 mb-6">{t('Configura tu cuenta y preferencias de la aplicación.')}</p>

      <div className="space-y-4">
        {COMMERCIAL_PLANS_ENABLED && (
          <section className="flex flex-col gap-4 rounded-xl border border-[#e5d8bd] bg-white p-5 shadow-sm dark:border-[#43513b] sm:flex-row sm:items-center sm:justify-between" aria-labelledby="current-plan-title">
            <div>
              <h2 id="current-plan-title" className="text-sm font-semibold text-gray-900">{t('Tu plan actual')}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#e9e2ca] px-3 py-1 text-xs font-bold text-[#39472d] dark:bg-[#303d2a] dark:text-[#e6b16c]">{t('Plan gratuito')}</span>
                <span className="text-xs text-gray-500">{t('Hasta 6 análisis cada 24 horas')}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/planes')}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#283618] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#3b4c2c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dda15e] dark:bg-[#dda15e] dark:text-[#1d281d] dark:hover:bg-[#efc083]"
            >
              {t('Actualizar')}
            </button>
          </section>
        )}

        <section className="rounded-xl bg-white p-5 shadow-sm" aria-labelledby="appearance-title">
          <div className="mb-4 flex items-center gap-2">
            <FiSettings className="h-4 w-4 text-[#283618]" />
            <h2 id="appearance-title" className="text-sm font-semibold text-gray-900">{t('Apariencia y accesibilidad')}</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#43513b]">
            <div className="flex items-center justify-between gap-4 py-3 first:pt-0">
              <div className="flex items-start gap-3">
                {darkMode ? <FiMoon className="mt-0.5 h-4 w-4 text-[#71805d] dark:text-[#e6b16c]" /> : <FiSun className="mt-0.5 h-4 w-4 text-[#71805d] dark:text-[#e6b16c]" />}
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('Modo oscuro')}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{t('Reduce el brillo de la interfaz.')}</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={darkMode}
                aria-label="Activar o desactivar modo oscuro"
                onClick={toggleDarkMode}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dda15e] ${darkMode ? 'bg-[#dda15e]' : 'bg-gray-300'}`}
              >
                <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <label className="flex items-center justify-between gap-4 py-3 last:pb-0">
              <span className="flex items-start gap-3">
                <FiType className="mt-0.5 h-4 w-4 text-[#71805d] dark:text-[#e6b16c]" />
                <span>
                  <span className="block text-sm font-medium text-gray-900">{t('Tamaño del texto')}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">{t('Aumenta el tamaño de textos y controles.')}</span>
                </span>
              </span>
              <select
                value={fontScale}
                onChange={(event) => setFontScale(event.target.value as 'normal' | 'large')}
                aria-label="Tamaño del texto"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 dark:border-[#43513b] dark:bg-[#24301f] dark:text-gray-100"
              >
                <option value="normal">{t('Normal')}</option>
                <option value="large">{t('Grande')}</option>
              </select>
            </label>
            <label className="flex items-center justify-between gap-4 py-3">
              <span className="flex items-start gap-3">
                <FiInfo className="mt-0.5 h-4 w-4 text-[#71805d] dark:text-[#e6b16c]" />
                <span>
                  <span className="block text-sm font-medium text-gray-900">{t('Idioma')}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">{t('Language / Idioma de la interfaz.')}</span>
                </span>
              </span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as 'es' | 'en')}
                aria-label={t('Idioma')}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 dark:border-[#43513b] dark:bg-[#24301f] dark:text-gray-100"
              >
                <option value="es">{t('Español')}</option>
                <option value="en">{t('Inglés')}</option>
              </select>
            </label>
            <div className="flex items-center justify-between gap-4 py-3 last:pb-0">
              <div className="flex items-start gap-3">
                <FiCheckCircle className="mt-0.5 h-4 w-4 text-[#71805d] dark:text-[#e6b16c]" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('Notificaciones')}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{t('Recibir una notificación cuando termine un análisis.')}</p>
                  <p className="mt-1 text-[11px] leading-4 text-gray-400">{t('En el teléfono, agrega la app a la pantalla de inicio y permite las notificaciones.')}</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notificationsEnabled}
                aria-label={t('Notificaciones')}
                onClick={() => void handleNotificationToggle()}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dda15e] ${notificationsEnabled ? 'bg-[#dda15e]' : 'bg-gray-300'}`}
              >
                <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {notificationMessage && <p role="status" className="pb-3 text-xs text-amber-700 dark:text-amber-300">{notificationMessage}</p>}
          </div>
        </section>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FiUser className="w-4 h-4 text-[#283618]" />
            <h2 className="font-semibold text-gray-900 text-sm">{t('Mi cuenta')}</h2>
          </div>
          {!isLoggedIn() ? (
            <p className="text-sm text-gray-600">{t('Inicia sesión para editar tu nombre y guardar una copia privada.')}</p>
          ) : (
            <>
              <form onSubmit={handleSaveName} className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <label className="flex-1 text-xs font-medium text-gray-600">
                  Nombre de perfil
                  <input
                    value={profileName}
                    onChange={(event) => setProfileName(event.target.value)}
                    maxLength={80}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900"
                  />
                </label>
                <button
                  type="submit"
                  disabled={savingName || !profileName.trim() || Boolean(profile?.nombre_change_available_at && new Date(profile.nombre_change_available_at) > new Date())}
                  className="rounded-lg bg-[#283618] px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingName ? 'Guardando…' : 'Cambiar nombre'}
                </button>
              </form>
              {profile?.nombre_change_available_at && new Date(profile.nombre_change_available_at) > new Date() && (
                <p className="mt-2 text-xs text-gray-500">
                  Podrás cambiar el nombre nuevamente el {new Date(profile.nombre_change_available_at).toLocaleDateString('es-CO')}.
                </p>
              )}
              <div className="mt-5 border-t border-gray-100 pt-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t('Copia de seguridad en Google Drive')}</p>
                    <p className="mt-1 text-xs text-gray-500">{t('Guarda tus identificaciones en tu Drive privado.')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleBackup}
                    disabled={backupBusy}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <FiCloud className="h-4 w-4" />
                    {backupBusy ? 'Guardando…' : t('Crear copia en Google Drive')}
                  </button>
                </div>
              </div>
              {accountError && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{accountError}</p>}
              {accountMessage && <p role="status" className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{accountMessage}</p>}
              {backupLink && (
                <a href={backupLink} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-medium text-[#283618] underline">
                  Abrir copia en Google Drive
                </a>
              )}
            </>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FiCpu className="w-4 h-4 text-[#283618]" />
            <h2 className="font-semibold text-gray-900 text-sm">{t('Estado del modelo')}</h2>
          </div>

          {healthError && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-lg p-3">
              <FiXCircle className="w-4 h-4 shrink-0" />
              No se pudo conectar con el backend. Verifica que esté corriendo.
            </div>
          )}

          {!health && !healthError && <p className="text-sm text-gray-400">{t('Consultando...')}</p>}

          {health && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs mb-1">Estado</p>
                <p className="flex items-center gap-1.5 font-medium text-gray-900">
                  {health.model_trained ? (
                    <>
                      <FiCheckCircle className="w-4 h-4 text-green-600" /> {t('Modelo cargado')}
                    </>
                  ) : (
                    <>
                      <FiXCircle className="w-4 h-4 text-red-600" /> {t('Modelo no cargado')}
                    </>
                  )}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">{t('Cultivos reconocidos')}</p>
                <p className="font-medium text-gray-900">{health.num_classes} clases</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">{t('Modelo entrenado')}</p>
                <p className="font-medium text-gray-900">{health.model_trained ? t('Sí') : t('Modo demostración')}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FiSettings className="w-4 h-4 text-[#283618]" />
            <h2 className="font-semibold text-gray-900 text-sm">{t('Tu historial guardado')}</h2>
          </div>

          {!isLoggedIn() ? (
            <p className="text-sm text-gray-600 mb-4">
              {t('Inicia sesión para ver y administrar tu historial de identificaciones.')}
            </p>
          ) : (
            <p className="text-sm text-gray-600 mb-4">
              Tienes <span className="font-semibold text-gray-900">{historyCount}</span> identificación
              {historyCount !== 1 ? 'es' : ''} guardada{historyCount !== 1 ? 's' : ''} en tu cuenta.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <button
              type="button"
              onClick={() => void handleExportData()}
              disabled={exportBusy || !isLoggedIn()}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#536343] hover:text-[#283618] disabled:cursor-not-allowed disabled:opacity-40 dark:text-[#e6b16c]"
            >
              <FiDownload className="h-4 w-4" />
              {exportBusy ? 'Preparando archivo…' : t('Descargar mis datos')}
            </button>
            {!confirmClear ? (
              <button
                onClick={() => setConfirmClear(true)}
                disabled={historyCount === 0 || !isLoggedIn()}
                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:text-gray-300"
              >
                <FiTrash2 className="w-4 h-4" />
                {t('Borrar todo el historial')}
              </button>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-gray-700">{t('¿Seguro? Esta acción no se puede deshacer.')}</span>
              <button
                onClick={handleClear}
                className="text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-1.5"
              >
                {t('Sí, borrar')}
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {t('Cancelar')}
              </button>
              </div>
            )}
          </div>
          <p className="mt-3 text-xs text-gray-500">{t('El archivo JSON incluye los resultados y las imágenes en miniatura de tu historial.')}</p>
          {exportError && <p role="alert" className="mt-2 text-sm text-red-600">{exportError}</p>}
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FiInfo className="w-4 h-4 text-[#283618]" />
            <h2 className="font-semibold text-gray-900 text-sm">{t('Acerca de')}</h2>
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

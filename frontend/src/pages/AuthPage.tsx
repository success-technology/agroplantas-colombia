// frontend/src/pages/AuthPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiLogOut, FiCamera, FiImage, FiSettings, FiHelpCircle } from 'react-icons/fi';
import {
  getUser,
  login,
  loginWithGoogle,
  isLoggedIn,
  register,
  logout,
  requestPasswordReset,
  resetPassword,
  updateAvatar,
  UserProfile,
} from '../lib/authStore';
import { CameraCapture } from '../components/CameraCapture';
import { loadGoogleIdentityScript } from '../lib/googleIdentity';
import { useLanguage } from '../lib/languageStore';

/** Gestiona formularios de registro/login, Google, recuperación y edición de perfil. */
export const AuthPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const googleOriginSupported = window.location.protocol === 'https:' || window.location.origin === 'http://localhost:3000';
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [checkingSession, setCheckingSession] = useState(() => isLoggedIn());
  const [googleButtonReady, setGoogleButtonReady] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>(() =>
    new URLSearchParams(window.location.search).get('mode') === 'register' ? 'register' : 'login'
  );
  const [recoveryStage, setRecoveryStage] = useState<'forgot' | 'reset' | null>(() =>
    new URLSearchParams(window.location.search).has('reset_token') ? 'reset' : null
  );
  const [resetToken] = useState(() => new URLSearchParams(window.location.search).get('reset_token') || '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [showAvatarCamera, setShowAvatarCamera] = useState(false);
  const [socialBusy, setSocialBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) return;
    getUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setCheckingSession(false));
  }, []);

  useEffect(() => {
    if (!resetToken) return;
    const url = new URL(window.location.href);
    url.searchParams.delete('reset_token');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }, [resetToken]);

  const finishGoogleLogin = async (credential: string) => {
    setError(null);
    setSocialBusy('google');
    try {
      const profile = await loginWithGoogle(credential);
      setUser(profile);
      navigate('/', { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'No se pudo iniciar sesion con Google.');
    } finally {
      setSocialBusy(null);
    }
  };

  useEffect(() => {
    if (mode !== 'login' || recoveryStage || !googleOriginSupported || !import.meta.env.VITE_GOOGLE_CLIENT_ID || !googleButtonRef.current) return;
    let active = true;
    // Monta el botón oficial de GIS cuando script y Client ID están disponibles.
    const renderGoogleButton = () => {
      if (!active || !window.google?.accounts.id || !googleButtonRef.current) return;
      googleButtonRef.current.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: (response) => void finishGoogleLogin(response.credential),
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: String(Math.max(200, Math.min(320, googleButtonRef.current.clientWidth))),
        locale: 'es',
      });
      setGoogleButtonReady(true);
    };

    setGoogleButtonReady(false);
    loadGoogleIdentityScript().then(renderGoogleButton).catch((loadError: Error) => setError(loadError.message));
    return () => { active = false; };
  }, [mode, recoveryStage]);

  // Despacha el formulario al flujo activo: acceso, registro o recuperación.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);
    try {
      if (recoveryStage === 'forgot') {
        await requestPasswordReset(email);
        setSuccessMessage('Si el correo está registrado, recibirás instrucciones para restablecer la contraseña.');
        return;
      }

      if (recoveryStage === 'reset') {
        if (password !== passwordConfirmation) {
          setError('Las contraseñas no coinciden.');
          return;
        }
        await resetPassword(resetToken, password);
        setUser(null);
        setRecoveryStage(null);
        setPassword('');
        setPasswordConfirmation('');
        navigate('/login', { replace: true });
        setSuccessMessage('Contraseña actualizada. Ya puedes iniciar sesión.');
        return;
      }

      const profile =
        mode === 'register' ? await register(email, password, name || undefined) : await login(email, password);
      setUser(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  // Termina sesión local y actualiza inmediatamente el perfil visible.
  const handleLogout = () => {
    logout();
    setUser(null);
  };

  // Reduce la imagen en canvas antes de enviarla como avatar de perfil.
  const saveAvatar = async (file: File) => {
    setAvatarBusy(true);
    setAvatarError(null);
    try {
      const source = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onerror = () => reject(new Error('El archivo no es una imagen válida.'));
        element.onload = () => resolve(element);
        element.src = source;
      });
      const size = 512;
      const scale = Math.min(1, size / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
      const updatedUser = await updateAvatar(canvas.toDataURL('image/jpeg', 0.82));
      setUser(updatedUser);
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'No se pudo guardar la foto.');
    } finally {
      setAvatarBusy(false);
    }
  };

  if (checkingSession) {
    return <div className="p-6 max-w-md mx-auto text-center text-sm text-gray-500">{t('Cargando…')}</div>;
  }

  if (user && !recoveryStage) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="mx-auto mb-4 flex w-fit flex-col items-center gap-2">
            <span className="w-20 h-20 rounded-full bg-[#FEFAE0] overflow-hidden flex items-center justify-center">
              {user.avatar_base64 ? (
                <img src={user.avatar_base64} alt="Foto de perfil" className="h-full w-full object-cover" />
              ) : (
                <FiUser className="w-8 h-8 text-[#283618]" />
              )}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAvatarCamera(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                <FiCamera className="h-3.5 w-3.5" /> {t('Tomar foto')}
              </button>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                <FiImage className="h-3.5 w-3.5" /> {t('Cargar')}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void saveAvatar(file);
                  event.target.value = '';
                }}
              />
            </div>
            {avatarBusy && <span className="text-xs text-gray-500">{t('Guardando foto…')}</span>}
            {avatarError && <span role="alert" className="text-xs text-red-600">{avatarError}</span>}
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">{t('Hola,')} {user.nombre || user.email}</h1>
          <p className="text-gray-500 text-sm mb-6">{user.email}</p>
          <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-gray-100 p-4 text-left dark:border-gray-700 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{t('Nombre del perfil')}</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{user.nombre || t('Aún no agregas un nombre')}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{t('Correo de la cuenta')}</p>
              <p className="mt-1 break-all text-sm font-medium text-gray-900 dark:text-gray-100">{user.email}</p>
            </div>
            <p className="sm:col-span-2 text-xs leading-5 text-gray-500 dark:text-gray-400">{t('Tu perfil y tus identificaciones se administran desde los ajustes de la cuenta.')}</p>
          </div>
          <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link to="/ajustes" className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5">
              <FiSettings className="h-4 w-4" /> {t('Ajustes de cuenta')}
            </Link>
            <Link to="/soporte" className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5">
              <FiHelpCircle className="h-4 w-4" /> {t('Ayuda y soporte')}
            </Link>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-[#283618] hover:bg-[#1e290f] text-white rounded-lg py-2.5 text-sm font-medium mb-2"
          >
            {t('Ir al inicio')}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 text-sm py-2"
          >
            <FiLogOut className="w-4 h-4" />
            {t('Cerrar sesión')}
          </button>
        </div>
        {showAvatarCamera && (
          <CameraCapture
            onCapture={(file) => { setShowAvatarCamera(false); void saveAvatar(file); }}
            onClose={() => setShowAvatarCamera(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-8">
        {!recoveryStage && <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
              mode === 'login' ? 'bg-white shadow-sm text-[#283618] dark:bg-[#DDA15E] dark:text-[#1d281d]' : 'text-gray-500 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            {t('Iniciar sesión')}
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
              mode === 'register' ? 'bg-white shadow-sm text-[#283618] dark:bg-[#DDA15E] dark:text-[#1d281d]' : 'text-gray-500 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            {t('Crear cuenta')}
          </button>
        </div>}

        <h1 className="text-lg font-bold text-gray-900 mb-1">
          {recoveryStage === 'forgot'
            ? t('Recuperar contraseña')
            : recoveryStage === 'reset'
              ? t('Crear nueva contraseña')
              : mode === 'login'
                ? t('Bienvenido de nuevo')
                : t('Crea tu cuenta')}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {recoveryStage === 'forgot'
            ? 'Te enviaremos un enlace si existe una cuenta asociada a este correo.'
            : recoveryStage === 'reset'
              ? 'Elige una contraseña de al menos 8 caracteres.'
              : mode === 'login'
                ? t('Ingresa para ver tu historial y consejos personalizados.')
                : t('Regístrate para guardar tus identificaciones y preferencias.')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {successMessage && (
            <div role="status" className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              {successMessage}
            </div>
          )}
          {!recoveryStage && mode === 'register' && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">{t('Nombre')}</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#283618]/30"
                />
              </div>
            </div>
          )}
          {recoveryStage !== 'reset' && <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">{t('Correo')}</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#283618]/30"
              />
            </div>
          </div>}
          {recoveryStage !== 'forgot' && <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">{t('Contraseña')}</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="password"
                required
                minLength={mode === 'login' && !recoveryStage ? undefined : 8}
                maxLength={mode === 'login' && !recoveryStage ? undefined : 72}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={recoveryStage === 'reset' || mode === 'register' ? 'new-password' : 'current-password'}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#283618]/30"
              />
            </div>
          </div>}
          {recoveryStage === 'reset' && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">{t('Confirmar contraseña')}</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="password"
                  required
                  minLength={8}
                  maxLength={72}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  autoComplete="new-password"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#283618]/30"
                />
              </div>
            </div>
          )}

          {mode === 'login' && !recoveryStage && (
            <div className="space-y-2 pt-1">
              <p className="text-center text-xs text-gray-500">{t('O continúa con')}</p>
              {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                googleOriginSupported ? (
                  <div className="flex min-h-10 flex-col items-center justify-center">
                    {!googleButtonReady && <span className="text-xs text-gray-500">{t('Cargando acceso de Google...')}</span>}
                    <div ref={googleButtonRef} className="flex min-h-10 justify-center" />
                  </div>
                ) : (
                  <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
                    Google requiere HTTPS o localhost para iniciar sesión. En esta PC abre{' '}
                    <a className="font-semibold underline" href="http://localhost:3000/login">http://localhost:3000/login</a>.
                    Para entrar desde un teléfono, usa una dirección HTTPS autorizada en Google Cloud.
                  </p>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => setError('El inicio con Google no esta configurado. Revisa VITE_GOOGLE_CLIENT_ID.')}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-[#24301f] dark:text-gray-100 dark:hover:bg-[#303d2a]"
                >
                  {t('Continuar con Google')}
                </button>
              )}
              {socialBusy && <p role="status" className="text-center text-xs text-gray-500">{t('Conectando con Google...')}</p>}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#283618] hover:bg-[#1e290f] disabled:opacity-60 text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
          >
            {submitting
              ? t('Un momento…')
              : recoveryStage === 'forgot'
                ? t('Enviar enlace')
                : recoveryStage === 'reset'
                  ? t('Actualizar contraseña')
                  : mode === 'login'
                    ? t('Iniciar sesión')
                    : t('Crear cuenta')}
          </button>
          {mode === 'login' && !recoveryStage && (
            <button
              type="button"
              onClick={() => { setError(null); setSuccessMessage(null); setRecoveryStage('forgot'); }}
              className="w-full text-sm text-[#283618] hover:underline"
            >
              {t('Olvidé mi contraseña')}
            </button>
          )}
          {recoveryStage && (
            <button
              type="button"
              onClick={() => { setRecoveryStage(null); setError(null); setSuccessMessage(null); navigate('/login', { replace: true }); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Volver al inicio de sesión
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

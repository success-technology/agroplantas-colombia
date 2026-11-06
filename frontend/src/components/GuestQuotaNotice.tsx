import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiLogIn, FiUserPlus, FiX } from 'react-icons/fi';
import { isLoggedIn, UserProfile } from '../lib/authStore';
import { useLanguage } from '../lib/languageStore';
import {
  fetchGuestQuotaStatus,
  getCachedGuestRemaining,
  GUEST_ANALYSIS_LIMIT,
} from '../lib/guestQuota';
import { COMMERCIAL_PLANS_ENABLED } from '../lib/features';

type Notice = {
  kind: 'welcome' | 'remaining' | 'exhausted';
  remaining: number;
};

const DISMISSED_KEY = 'agroplantas_guest_notice_dismissed';

/** Informa cupo de análisis y ofrece acciones según bienvenida o límite agotado. */
export const GuestQuotaNotice: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [guestMode, setGuestMode] = useState(() => !isLoggedIn());
  const [, setRemaining] = useState(getCachedGuestRemaining);
  const remainingRef = useRef(getCachedGuestRemaining());
  const [notice, setNotice] = useState<Notice | null>(() => {
    if (location.pathname === '/login' || isLoggedIn() || sessionStorage.getItem(DISMISSED_KEY)) return null;
    return { kind: 'welcome', remaining: getCachedGuestRemaining() };
  });

  useEffect(() => {
    let active = true;
    fetchGuestQuotaStatus().then((quota) => {
      if (!active) return;
      setGuestMode(!quota.authenticated);
      remainingRef.current = quota.remaining;
      setRemaining(quota.remaining);
      if (quota.authenticated) {
        setNotice(quota.remaining === 0 ? { kind: 'exhausted', remaining: 0 } : null);
        return;
      }
      if (quota.remaining === 0) {
        setNotice({ kind: 'exhausted', remaining: 0 });
      } else if (location.pathname !== '/login' && !sessionStorage.getItem(DISMISSED_KEY)) {
        setNotice({ kind: 'welcome', remaining: quota.remaining });
      }
    }).catch(() => {
      if (active && !isLoggedIn()) setGuestMode(true);
    });

    // Sincroniza el diálogo con cambios de cuota enviados por Identify.
    const handleQuotaUpdate = (event: Event) => {
      const next = (event as CustomEvent<number>).detail;
      const previous = remainingRef.current;
      remainingRef.current = next;
      setRemaining(next);
      if (next > previous) {
        if (previous === 0) setNotice(null);
        return;
      }
      if (next === previous) return;
      if (next === 0) setNotice({ kind: 'exhausted', remaining: 0 });
      else if (notice?.kind === 'welcome') setNotice(null);
    };

    // Vuelve a consultar la cuota cuando login/registro cambian la identidad.
    const handleProfileUpdate = (event: Event) => {
      const user = (event as CustomEvent<UserProfile | null>).detail;
      setGuestMode(!user);
      if (user) {
        fetchGuestQuotaStatus().then((quota) => {
          remainingRef.current = quota.remaining;
          setRemaining(quota.remaining);
          setNotice(quota.remaining === 0 ? { kind: 'exhausted', remaining: 0 } : null);
        }).catch(() => setNotice(null));
      } else if (location.pathname !== '/login') {
        setNotice({ kind: remainingRef.current === 0 ? 'exhausted' : 'welcome', remaining: remainingRef.current });
      }
    };

    window.addEventListener('agroplantas:guest-quota-updated', handleQuotaUpdate);
    window.addEventListener('agroplantas:profile-updated', handleProfileUpdate);
    return () => {
      active = false;
      window.removeEventListener('agroplantas:guest-quota-updated', handleQuotaUpdate);
      window.removeEventListener('agroplantas:profile-updated', handleProfileUpdate);
    };
  }, [guestMode, location.pathname, notice?.kind]);

  useEffect(() => {
    if (!notice || location.pathname === '/login') {
      if (location.pathname === '/login') setNotice(null);
      return;
    }
    // Permite cerrar el aviso modal usando Escape.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [notice, location.pathname]);

  // Cierra el aviso y recuerda solo el cierre inicial de bienvenida.
  const dismiss = () => {
    if (notice?.kind === 'welcome') sessionStorage.setItem(DISMISSED_KEY, '1');
    setNotice(null);
  };

  if (!notice || location.pathname === '/login' || location.pathname === '/planes' || location.pathname.startsWith('/pago')) return null;

  const isWelcome = notice.kind === 'welcome';
  const isExhausted = notice.kind === 'exhausted';
  const used = GUEST_ANALYSIS_LIMIT - notice.remaining;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-[#09120b]/80 p-4 backdrop-blur-md sm:items-center"
      onMouseDown={(event) => { if (event.target === event.currentTarget) dismiss(); }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-notice-title"
        className="relative my-auto grid max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-[#172419] text-white shadow-[0_32px_100px_rgba(0,0,0,0.55)] sm:my-auto sm:grid-cols-[0.82fr_1.18fr] sm:overflow-hidden"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label={language === 'en' ? 'Close notice' : 'Cerrar aviso'}
          className="absolute right-4 top-4 z-10 rounded-full border border-white/15 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <FiX className="h-4 w-4" />
        </button>

        <div className="relative flex min-h-64 flex-col justify-between overflow-hidden bg-[#263a29] p-7 sm:p-8">
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(135deg, transparent 49.7%, rgba(255,255,255,.16) 50%, transparent 50.3%), linear-gradient(45deg, transparent 49.7%, rgba(255,255,255,.10) 50%, transparent 50.3%)', backgroundSize: '32px 32px' }} />
          <div className="relative">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f1c17d]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f1c17d]" />
              AgroPlantas <span className="text-white/35">/</span> {COMMERCIAL_PLANS_ENABLED ? t('Plan gratuito') : language === 'en' ? 'Institutional access' : 'Acceso institucional'}
            </div>
            <p className="mt-12 text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
              {isExhausted ? t('Límite alcanzado') : t('Análisis disponibles')}
            </p>
            <div className="mt-1 flex items-end gap-2">
              <span className="font-display text-8xl font-extrabold leading-none tracking-normal text-[#fff4df]">
                {String(notice.remaining).padStart(2, '0')}
              </span>
              <span className="pb-2 text-sm text-white/65">/ {GUEST_ANALYSIS_LIMIT}</span>
            </div>
          </div>
          <div className="relative mt-8">
            <div className="flex gap-1.5" aria-label={`${notice.remaining} análisis disponibles`}>
              {Array.from({ length: GUEST_ANALYSIS_LIMIT }, (_, index) => (
                <span key={index} className={`h-1.5 flex-1 rounded-full ${index < notice.remaining ? 'bg-[#eab66e]' : 'bg-white/15'}`} />
              ))}
            </div>
            <p className="mt-3 text-xs text-white/55">
              {used === 0
                ? COMMERCIAL_PLANS_ENABLED
                  ? t('Seis análisis gratuitos cada 24 horas.')
                  : language === 'en' ? 'Six analyses every 24 hours.' : 'Seis análisis por cada período de 24 horas.'
                : language === 'en' ? `${used} of ${GUEST_ANALYSIS_LIMIT} analyses used in this period.` : `${used} de ${GUEST_ANALYSIS_LIMIT} análisis utilizados en esta ventana.`}
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center p-7 sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#eab66e]">
            {isWelcome ? (COMMERCIAL_PLANS_ENABLED ? t('Plan gratuito') : language === 'en' ? 'Institutional access' : 'Acceso institucional') : isExhausted ? t('Límite alcanzado') : t('Análisis completado')}
          </p>
          <h2 id="guest-notice-title" className="mt-3 max-w-sm text-2xl font-bold leading-tight text-white sm:text-3xl">
            {isWelcome
              ? t('Empieza a descubrir lo que pasa en tus cultivos.')
              : isExhausted
                ? COMMERCIAL_PLANS_ENABLED
                  ? t('Has usado tus seis análisis gratuitos.')
                  : language === 'en' ? 'You have used the six analyses available in this period.' : 'Has usado los seis análisis disponibles en esta ventana.'
                : language === 'en'
                  ? `You have ${notice.remaining} analyses left in this period.`
                  : notice.remaining === 1 ? t('Te queda un análisis en esta ventana.') : `Te quedan ${notice.remaining} análisis en esta ventana.`}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/65">
            {isWelcome
              ? COMMERCIAL_PLANS_ENABLED
                ? t('Tienes seis análisis gratuitos por cada período de 24 horas. Crea una cuenta para guardar tu historial.')
                : language === 'en'
                  ? 'You have six analyses every 24 hours. Create an account to save your history.'
                  : 'Tienes seis análisis por cada período de 24 horas. Crea una cuenta para guardar tu historial.'
              : isExhausted
                ? COMMERCIAL_PLANS_ENABLED
                  ? t('El cupo se renueva 24 horas después de tu primer análisis de esta ventana. Puedes revisar los planes disponibles para continuar.')
                  : language === 'en'
                    ? 'Your allowance renews 24 hours after your first analysis in this period. Contact support if you need help.'
                    : 'El cupo se renueva 24 horas después de tu primer análisis en esta ventana. Si necesitas ayuda, comunícate con soporte.'
                : t('Inicia sesión cuando quieras para guardar tus resultados y acceder a todas las herramientas.')}
          </p>

          <div className="mt-7 flex flex-col gap-2.5">
            {(isExhausted || isWelcome) && !isExhausted && (
              <button
                type="button"
                onClick={() => { dismiss(); navigate('/login?mode=register'); }}
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#dda15e] px-5 text-sm font-bold text-[#1d281d] transition hover:bg-[#efc083]"
              >
                <FiUserPlus className="h-4 w-4" />
                {t('Crear cuenta')}
                <FiArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            )}
            {isExhausted && COMMERCIAL_PLANS_ENABLED && (
              <button
                type="button"
                onClick={() => { dismiss(); navigate('/planes'); }}
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#dda15e] px-5 text-sm font-bold text-[#1d281d] transition hover:bg-[#efc083]"
              >
              {t('Ver planes Pro y Premium')}
                <FiArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            )}
            {isExhausted && !COMMERCIAL_PLANS_ENABLED && (
              <button
                type="button"
                onClick={() => { dismiss(); navigate('/soporte'); }}
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#dda15e] px-5 text-sm font-bold text-[#1d281d] transition hover:bg-[#efc083]"
              >
                {language === 'en' ? 'Contact support' : 'Contactar soporte'}
                <FiArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            )}
            <button
              type="button"
              onClick={() => { dismiss(); navigate('/login'); }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <FiLogIn className="h-4 w-4" />
              {t('Iniciar sesión')}
            </button>
            {!isExhausted && (
              <button
                type="button"
                onClick={dismiss}
                className="inline-flex min-h-10 items-center justify-center gap-2 text-sm text-white/55 transition hover:text-white"
              >
                <FiCheck className="h-4 w-4" />
                {isWelcome ? t('Continuar como invitado') : t('Seguir explorando')}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

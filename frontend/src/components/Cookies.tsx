import React, { useEffect, useState } from 'react';
import Cookies from 'universal-cookie';
import { Link } from 'react-router-dom';
import { FiShield, FiX } from 'react-icons/fi';

const cookies = new Cookies();
const CONSENT_COOKIE = 'agroplantas_cookie_consent';
const CONSENT_MAX_AGE = 60 * 60 * 24 * 180;

type ConsentChoice = 'all' | 'necessary';

/** Solicita una preferencia de cookies, la persiste y permite reabrir el aviso. */
export const CookiesConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!cookies.get(CONSENT_COOKIE));
    const reopenPreferences = () => setVisible(true);
    window.addEventListener('agroplantas:open-cookie-preferences', reopenPreferences);
    return () => window.removeEventListener('agroplantas:open-cookie-preferences', reopenPreferences);
  }, []);

  // Guarda la elección durante 180 días y oculta el diálogo actual.
  const saveChoice = (choice: ConsentChoice) => {
    cookies.set(CONSENT_COOKIE, choice, {
      path: '/',
      maxAge: CONSENT_MAX_AGE,
      sameSite: 'lax',
      secure: window.location.protocol === 'https:',
    });
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Aviso de cookies"
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-4xl rounded-2xl border border-[#283618]/15 bg-white p-5 shadow-2xl dark:border-[#DDA15E]/30 dark:bg-[#202b1d] sm:inset-x-6 sm:p-6"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
    >
      <div className="flex items-start gap-3">
        <FiShield className="mt-1 shrink-0 text-2xl text-[#8a5b20] dark:text-[#efc083]" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h2 id="cookie-consent-title" className="text-lg font-bold text-[#283618] dark:text-[#f5f5e8]">
              Tu privacidad importa
            </h2>
            <button
              type="button"
              onClick={() => saveChoice('necessary')}
              className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#303d2a]"
              aria-label="Cerrar aviso y continuar solo con cookies necesarias"
            >
              <FiX />
            </button>
          </div>
          <p className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-300">
            Usamos cookies necesarias para recordar esta elección y mantener las funciones básicas de AgroPlantas. Puedes aceptar todas o continuar solo con las necesarias. Consulta qué datos usamos y cómo gestionarlos en nuestra{' '}
            <Link to="/privacidad" className="font-semibold text-[#385026] underline underline-offset-2 hover:text-[#8a5b20] dark:text-[#efc083]">
              Política de privacidad y cookies
            </Link>.
          </p>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => saveChoice('necessary')}
              className="rounded-lg border border-[#283618]/25 px-4 py-2.5 text-sm font-semibold text-[#283618] hover:bg-[#f5f2e6] focus:outline-none focus:ring-2 focus:ring-[#DDA15E] dark:border-[#DDA15E]/40 dark:text-[#f5f5e8] dark:hover:bg-[#303d2a]"
            >
              Solo necesarias
            </button>
            <button
              type="button"
              onClick={() => saveChoice('all')}
              className="rounded-lg bg-[#283618] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#385026] focus:outline-none focus:ring-2 focus:ring-[#DDA15E] dark:bg-[#DDA15E] dark:text-[#1d281d] dark:hover:bg-[#efc083]"
            >
              Aceptar todas
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

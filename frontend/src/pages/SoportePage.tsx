// frontend/src/pages/SoportePage.tsx
import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiChevronDown, FiHelpCircle, FiMail, FiLogOut, FiUser, FiSend } from 'react-icons/fi';
import { getUser, logout, UserProfile } from '../lib/authStore';
import { FAQS } from '../data/faqs';
import { useLanguage } from '../lib/languageStore';

const SUPPORT_EMAIL = 'soporteagroplantascolombia@gmail.com';

/** Prepara un correo de soporte con el mensaje del usuario y referencia opcional. */
export const SoportePage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const ticketReference = (location.state as { ticketReference?: string } | null)?.ticketReference;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subject, setSubject] = useState(ticketReference ? `Ticket ${ticketReference}` : '');
  const [message, setMessage] = useState(
    ticketReference ? `Necesito ayuda. Mi referencia es ${ticketReference}.\n\nDescripción: ` : ''
  );

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  // Cierra la sesión y vuelve al inicio después de actualizar el encabezado.
  const handleLogout = () => {
    logout();
    setUser(null);
    navigate('/');
  };

  // Abre el cliente de correo con asunto, mensaje y datos de referencia.
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const body = encodeURIComponent(
      `${message}\n\n---\nEnviado desde AgroPlantas Colombia${
        user ? ` por ${user.nombre || user.email} (${user.email})` : ''
      }`
    );
    const mailSubject = encodeURIComponent(subject || 'Consulta desde AgroPlantas Colombia');
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${mailSubject}&body=${body}`;
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('Soporte')}</h1>
      <p className="text-gray-500 mb-6">{t('Ayuda y preguntas frecuentes sobre la aplicación.')}</p>

      {/* Cuenta / sesión — siempre visible, cambia según si hay sesión activa */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <FiUser className="w-4 h-4 text-[#283618]" />
          <h2 className="font-semibold text-gray-900 text-sm">Tu cuenta</h2>
        </div>
        {user ? (
          <>
            <p className="text-sm text-gray-600 mb-3">
              Sesión iniciada como <span className="font-medium text-gray-900">{user.nombre || user.email}</span> (
              {user.email})
            </p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium"
            >
              <FiLogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </>
        ) : (
          <p className="text-sm text-gray-600">
            No has iniciado sesión.{' '}
            <NavLink to="/login" className="text-[#283618] font-medium hover:underline">
              Inicia sesión o crea una cuenta
            </NavLink>
            .
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FiHelpCircle className="w-4 h-4 text-[#283618]" />
            <h2 className="font-semibold text-gray-900 text-sm">{t('Preguntas frecuentes')}</h2>
          </div>
          <NavLink to="/preguntas-frecuentes" className="inline-flex items-center gap-1 text-xs font-bold text-[#536343] hover:text-[#283618] dark:text-[#e6b16c] dark:hover:text-[#f0c183]">
            {t('Ver todas')} <FiArrowRight aria-hidden="true" />
          </NavLink>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-[#43513b]">
          {FAQS.slice(0, 3).map((item) => (
            <details key={item.question} className="group py-3 first:pt-1 last:pb-0">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-gray-900 marker:hidden [&::-webkit-details-marker]:hidden dark:text-gray-100">
                {t(item.question)}
                <FiChevronDown className="h-4 w-4 shrink-0 text-[#71805d] transition-transform group-open:rotate-180 dark:text-[#e6b16c]" aria-hidden="true" />
              </summary>
              <p className="mt-2 pr-6 text-sm leading-6 text-gray-600 dark:text-gray-300">{t(item.answer)}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <FiMail className="w-4 h-4 text-[#283618]" />
          <h2 className="font-semibold text-gray-900 text-sm">{t('¿Necesitas más ayuda?')}</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          {t('Escríbenos y te ayudamos a resolver cualquier duda sobre el uso de la aplicación. También puedes escribirnos directo a')}{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#283618] font-medium hover:underline">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
        <form onSubmit={handleSendMessage} className="space-y-3">
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t('Asunto')}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#283618]/30"
          />
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('Cuéntanos qué necesitas...')}
            rows={4}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#283618]/30 resize-none"
          />
          <button
            type="submit"
            className="flex items-center gap-2 bg-[#283618] hover:bg-[#1e290f] text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <FiSend className="w-4 h-4" />
            {t('Enviar mensaje')}
          </button>
        </form>
        <p className="text-[11px] text-gray-400 mt-3">
          {t('Esto abre tu programa de correo predeterminado con el mensaje ya redactado.')}
        </p>
      </div>
    </div>
  );
};

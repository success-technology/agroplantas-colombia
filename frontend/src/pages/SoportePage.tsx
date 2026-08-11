// frontend/src/pages/SoportePage.tsx
import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiHelpCircle, FiMail, FiLogOut, FiUser, FiSend } from 'react-icons/fi';
import { getUser, logout, UserProfile } from '../lib/authStore';

const SUPPORT_EMAIL = 'soporte@agroplantascolombia.com';

const FAQS = [
  {
    q: '¿Cómo tomo una buena foto para identificar mi cultivo?',
    a: 'Acércate a una sola hoja, con buena luz natural y un fondo simple. Evita fotos muy lejanas o a contraluz.',
  },
  {
    q: '¿Por qué la app no reconoce mi planta?',
    a: 'Puede ser que el cultivo todavía no esté en el catálogo, o que la foto sea muy diferente a las que usa el modelo. Revisa la lista de "Biblioteca de plantas" para ver qué cultivos sí reconoce.',
  },
  {
    q: '¿Mis datos se comparten con alguien?',
    a: 'Si tienes sesión iniciada, tu historial de identificaciones se guarda de forma privada en tu cuenta y solo tú puedes verlo. Si identificas plantas sin iniciar sesión, ese resultado no se guarda en ningún lado.',
  },
];

export const SoportePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate('/');
  };

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
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Soporte</h1>
      <p className="text-gray-500 mb-6">Ayuda y preguntas frecuentes sobre la aplicación.</p>

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
        <div className="flex items-center gap-2 mb-4">
          <FiHelpCircle className="w-4 h-4 text-[#283618]" />
          <h2 className="font-semibold text-gray-900 text-sm">Preguntas frecuentes</h2>
        </div>
        <div className="space-y-4">
          {FAQS.map((item, i) => (
            <div key={i}>
              <p className="text-sm font-medium text-gray-900">{item.q}</p>
              <p className="text-sm text-gray-600 mt-1">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <FiMail className="w-4 h-4 text-[#283618]" />
          <h2 className="font-semibold text-gray-900 text-sm">¿Necesitas más ayuda?</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Escríbenos y te ayudamos a resolver cualquier duda sobre el uso de la aplicación. También
          puedes escribirnos directo a{' '}
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
            placeholder="Asunto"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#283618]/30"
          />
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Cuéntanos qué necesitas..."
            rows={4}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#283618]/30 resize-none"
          />
          <button
            type="submit"
            className="flex items-center gap-2 bg-[#283618] hover:bg-[#1e290f] text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <FiSend className="w-4 h-4" />
            Enviar mensaje
          </button>
        </form>
        <p className="text-[11px] text-gray-400 mt-3">
          Esto abre tu programa de correo predeterminado con el mensaje ya redactado.
        </p>
      </div>
    </div>
  );
};
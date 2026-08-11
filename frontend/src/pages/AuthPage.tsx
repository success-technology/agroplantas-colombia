// frontend/src/pages/AuthPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiLogOut } from 'react-icons/fi';
import { getUser, login, register, logout, UserProfile } from '../lib/authStore';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getUser()
      .then(setUser)
      .finally(() => setCheckingSession(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const profile =
        mode === 'register' ? await register(email, password, name || undefined) : await login(email, password);
      setUser(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  if (checkingSession) {
    return <div className="p-6 max-w-md mx-auto text-center text-sm text-gray-500">Cargando…</div>;
  }

  if (user) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <span className="w-16 h-16 rounded-full bg-[#FEFAE0] flex items-center justify-center mx-auto mb-4">
            <FiUser className="w-7 h-7 text-[#283618]" />
          </span>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Hola, {user.nombre || user.email}</h1>
          <p className="text-gray-500 text-sm mb-6">{user.email}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-[#283618] hover:bg-[#1e290f] text-white rounded-lg py-2.5 text-sm font-medium mb-2"
          >
            Ir al inicio
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 text-sm py-2"
          >
            <FiLogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
              mode === 'login' ? 'bg-white shadow-sm text-[#283618]' : 'text-gray-500'
            }`}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
              mode === 'register' ? 'bg-white shadow-sm text-[#283618]' : 'text-gray-500'
            }`}
          >
            Crear cuenta
          </button>
        </div>

        <h1 className="text-lg font-bold text-gray-900 mb-1">
          {mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {mode === 'login'
            ? 'Ingresa para ver tu historial y consejos personalizados.'
            : 'Regístrate para guardar tus identificaciones y preferencias.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {mode === 'register' && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Nombre</label>
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
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Correo</label>
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
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Contraseña</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#283618]/30"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#283618] hover:bg-[#1e290f] disabled:opacity-60 text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
          >
            {submitting ? 'Un momento…' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
};
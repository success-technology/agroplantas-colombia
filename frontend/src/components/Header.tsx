import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiChevronDown, FiUser, FiHome, FiSearch, FiFileText, FiBook, FiFeather, FiLogOut } from 'react-icons/fi';
import { getUser, logout, UserProfile } from '../lib/authStore';

const navItems = [
  { label: 'Inicio', to: '/', icon: FiHome },
  { label: 'Identificar', to: '/identificar', icon: FiSearch },
  { label: 'Mis identificaciones', to: '/mis-identificaciones', icon: FiFileText },
  { label: 'Biblioteca', to: '/biblioteca', icon: FiBook },
  { label: 'Consejos', to: '/consejos', icon: FiFeather },
];

export const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="bg-[#283618] shadow-sm sticky top-0 z-50">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Agrodentifica" className="w-9 h-9 rounded-full object-cover" />
          <div>
            <h1 className="text-lg font-bold text-[#FEFAE0] leading-tight">AgroPlantas Colombia</h1>
            <p className="text-[8px] tracking-wide text-[#FEFAE0] uppercase">
              Inteligencia artificial para plantas
            </p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 pb-1 transition-colors border-b-2 ${
                  isActive
                    ? 'text-[#DDA15E] border-[#DDA15E]'
                    : 'text-[#FEFAE0]/70 border-transparent hover:text-[#DDA15E]'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 text-[#FEFAE0]"
            >
              <span className="w-8 h-8 rounded-full bg-[#FEFAE0] text-[#283618] flex items-center justify-center">
                <FiUser className="w-4 h-4" />
              </span>
              <span className="hidden sm:inline text-sm">{user ? user.nombre || user.email : 'Agricultor'}</span>
              <FiChevronDown className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg py-1 text-sm text-gray-700">
                <NavLink
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 hover:bg-gray-50"
                >
                  Mi perfil
                </NavLink>
                <NavLink
                  to="/soporte"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 hover:bg-gray-50"
                >
                  Ajustes
                </NavLink>
                {user && (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 text-left px-4 py-2 hover:bg-gray-50 text-red-600"
                  >
                    <FiLogOut className="w-3.5 h-3.5" />
                    Cerrar sesión
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
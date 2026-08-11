// frontend/src/components/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiHome,
  FiSearch,
  FiFileText,
  FiBook,
  FiFeather,
  FiCpu,
  FiClock,
  FiSettings,
  FiMessageCircle,
} from 'react-icons/fi';

const links = [
  { label: 'Inicio', to: '/', icon: FiHome },
  { label: 'Identificar planta', to: '/identificar', icon: FiSearch },
  { label: 'Mis identificaciones', to: '/mis-identificaciones', icon: FiFileText },
  { label: 'Biblioteca de plantas', to: '/biblioteca', icon: FiBook },
  { label: 'Consejos y manejo', to: '/consejos', icon: FiFeather },
  { label: 'Diagnósticos IA', to: '/diagnosticos-ia', icon: FiCpu, badge: 'NUEVO' },
  { label: 'Historial', to: '/historial', icon: FiClock },
  { label: 'Ajustes', to: '/ajustes', icon: FiSettings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col justify-between bg-[#FEFAE0] border-r border-black/5 px-4 py-6 min-h-[calc(100vh-64px)]">
      <nav className="space-y-1">
        {links.map(({ label, to, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#283618] text-[#FEFAE0]'
                  : 'text-gray-700 hover:bg-[#283618]/10'
              }`
            }
          >
            <span className="flex items-center gap-2.5">
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </span>
            {badge && (
              <span className="text-[10px] font-semibold bg-[#DDA15E] text-white px-1.5 py-0.5 rounded-full">
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="bg-[#283618] text-[#FEFAE0] rounded-xl p-4 mt-8">
        <p className="font-semibold text-sm mb-1">¿Tienes dudas sobre tus cultivos?</p>
        <p className="text-xs text-[#FEFAE0]/70 mb-3">
          Consulta recomendaciones personalizadas con nuestra IA.
        </p>
        <NavLink
          to="/identificar"
          className="inline-flex items-center gap-2 bg-[#DDA15E] hover:bg-[#c98f4c] transition-colors text-white text-xs font-medium rounded-full px-4 py-2"
        >
          <FiMessageCircle className="w-4 h-4" />
          Consultar ahora
        </NavLink>
      </div>
    </aside>
  );
};
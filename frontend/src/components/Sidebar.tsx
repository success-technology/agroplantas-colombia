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
    <aside className="hidden lg:flex w-64 shrink-0 flex-col justify-between bg-[#FEFAE0] dark:bg-[#182014] border-r border-black/5 dark:border-white/10 px-4 py-6 min-h-[calc(100vh-64px)]">
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
                  : 'text-gray-700 dark:text-gray-300 hover:bg-[#283618]/10 dark:hover:bg-white/10'
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

    </aside>
  );
};
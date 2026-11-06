// frontend/src/components/Sidebar.tsx
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
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
  FiChevronLeft,
  FiHelpCircle,
} from 'react-icons/fi';
import { getUser, UserProfile } from '../lib/authStore';
import { useLanguage } from '../lib/languageStore';

const links = [
  { label: 'Inicio', to: '/', icon: FiHome },
  { label: 'Identificar planta', to: '/identificar', icon: FiSearch },
  { label: 'Mis identificaciones', to: '/mis-identificaciones', icon: FiFileText },
  { label: 'Biblioteca de plantas', to: '/biblioteca', icon: FiBook },
  { label: 'Consejos y manejo', to: '/consejos', icon: FiFeather },
  { label: 'Diagnósticos IA', to: '/diagnosticos-ia', icon: FiCpu},
  { label: 'Historial', to: '/historial', icon: FiClock },
  { label: 'Ajustes', to: '/ajustes', icon: FiSettings },
  { label: 'Soporte', to: '/soporte', icon: FiHelpCircle },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onWidthChange: (width: number) => void;
}

/** Navegación lateral que conserva colapso, ancho y estado del perfil. */
export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, onWidthChange }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const { t } = useLanguage();
  const [pointerInside, setPointerInside] = useState(false);
  const reduceMotion = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  const isCollapsed = collapsed && !pointerInside;

  useEffect(() => {
    localStorage.setItem('agroplantas_sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    // Reacciona al breakpoint para cambiar interacciones en móvil/escritorio.
    const updateViewport = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    onWidthChange(user && isDesktop ? (isCollapsed ? 76 : 256) : 0);
  }, [isCollapsed, isDesktop, onWidthChange, user]);

  useEffect(() => {
    getUser().then(setUser);
    // Actualiza nombre/avatar en el menú cuando cambia la cuenta.
    const handleProfileUpdated = (event: Event) => {
      setUser((event as CustomEvent<UserProfile | null>).detail);
    };
    window.addEventListener('agroplantas:profile-updated', handleProfileUpdated);
    return () => window.removeEventListener('agroplantas:profile-updated', handleProfileUpdated);
  }, []);

  if (!user) return null;

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 76 : 256 }}
      transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 32, mass: 0.8 }}
      onMouseEnter={() => setPointerInside(true)}
      onMouseLeave={() => setPointerInside(false)}
      className={`sidebar-glass fixed left-0 top-16 z-40 hidden h-[calc(100vh-4rem)] shrink-0 overflow-y-auto border-r border-black/5 px-3 py-5 dark:border-white/10 lg:flex ${isCollapsed ? 'items-center' : ''}`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[#DDA15E]/10 via-transparent to-[#283618]/[0.06] dark:from-[#DDA15E]/[0.08] dark:to-black/10" />
      <div className="w-full">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={onToggle}
            aria-label={isCollapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
            aria-expanded={!isCollapsed}
            title={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-gray-600 transition hover:bg-[#283618]/10 hover:text-[#283618] dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <motion.span
              animate={{ rotate: isCollapsed ? 180 : 0 }}
              transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 24 }}
            >
              <FiChevronLeft className="h-4 w-4" />
            </motion.span>
          </button>
        </div>
        <nav aria-label="Navegación lateral" className="space-y-1">
        {links.map(({ label, to, icon: Icon }, index) => (
          <motion.div
            key={to}
            initial={reduceMotion ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={reduceMotion ? undefined : { scale: 1.035, x: isCollapsed ? 0 : 4 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, delay: reduceMotion ? 0 : index * 0.025 }}
            style={{ transformOrigin: 'left center' }}
          >
            <NavLink
              to={to}
              end={to === '/'}
              title={isCollapsed ? label : undefined}
              className={({ isActive }) =>
                `relative flex min-h-11 items-center gap-2 overflow-hidden rounded-xl px-3 py-2.5 text-sm transition-colors ${isCollapsed ? 'justify-center' : 'justify-between'} ${
                  isActive
                    ? 'font-semibold text-[#f9f1e2]'
                    : 'text-gray-700 hover:bg-[#283618]/10 dark:text-gray-300 dark:hover:bg-white/10'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="agro-sidebar-active"
                      className="absolute inset-0 -z-0 rounded-xl bg-[#283618]"
                      transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className={`relative z-10 flex min-w-0 items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                    <Icon className="h-4 w-4 shrink-0" />
                    <AnimatePresence initial={false}>
                      {!isCollapsed && (
                        <motion.span
                          initial={reduceMotion ? false : { opacity: 0, width: 0, x: -5 }}
                          animate={{ opacity: 1, width: 'auto', x: 0 }}
                          exit={{ opacity: 0, width: 0, x: -5 }}
                          transition={{ duration: reduceMotion ? 0 : 0.16 }}
                          className="overflow-hidden whitespace-nowrap"
                        >
                          {t(label)}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>

                </>
              )}
            </NavLink>
          </motion.div>
        ))}
        </nav>
      </div>
    </motion.aside>
  );
};

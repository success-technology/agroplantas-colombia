import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  FiBook,
  FiChevronDown,
  FiCpu,
  FiFeather,
  FiFileText,
  FiHome,
  FiHelpCircle,
  FiLogOut,
  FiMenu,
  FiSearch,
  FiSettings,
  FiUser,
  FiX,
  FiClock,
} from 'react-icons/fi';
import { getUser, logout, UserProfile } from '../lib/authStore';
import { useLanguage } from '../lib/languageStore';

const navItems = [
  { label: 'Inicio', to: '/', icon: FiHome, emoji: '🌱' },
  { label: 'Identificar', to: '/identificar', icon: FiSearch, emoji: '🔎' },
  { label: 'Mis identificaciones', to: '/mis-identificaciones', icon: FiFileText, emoji: '🌾' },
  { label: 'Biblioteca', to: '/biblioteca', icon: FiBook, emoji: '📚' },
  { label: 'Consejos', to: '/consejos', icon: FiFeather, emoji: '💡' },
  { label: 'Diagnósticos IA', to: '/diagnosticos-ia', icon: FiCpu, emoji: '✨' },
  { label: 'Historial', to: '/historial', icon: FiClock, emoji: '🕘' },
  { label: 'Ajustes', to: '/ajustes', icon: FiSettings, emoji: '⚙️' },
];

/** Presenta marca, navegación principal y menú de cuenta adaptable. */
export const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const visibleItems = user ? navItems.slice(0, 4) : navItems.slice(0, 2);

  useEffect(() => {
    getUser().then(setUser);
    const handleProfileUpdated = (event: Event) => {
      setUser((event as CustomEvent<UserProfile | null>).detail);
    };
    window.addEventListener('agroplantas:profile-updated', handleProfileUpdated);
    return () => window.removeEventListener('agroplantas:profile-updated', handleProfileUpdated);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [navigate]);

  // Limpia credencial local y redirige después de cerrar sesión.
  const handleLogout = () => {
    logout();
    setUser(null);
    setProfileOpen(false);
    navigate('/');
  };

  // Comparte el mismo enlace y estilo para las barras móvil/escritorio.
  const renderNavItem = (item: (typeof navItems)[number], mobile = false) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === '/'}
      onClick={() => setMenuOpen(false)}
      className={({ isActive }) =>
        `relative isolate flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors ${
          isActive ? 'text-[#1f2c1f]' : 'text-[#f8f2e7]/75 hover:text-white'
        } ${mobile ? 'w-full' : ''}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="agro-active-nav"
              className="absolute inset-0 -z-10 rounded-xl bg-[#e6b16c] shadow-[0_5px_18px_rgba(230,177,108,.22)]"
              transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 430, damping: 34 }}
            />
          )}
          <item.icon className="h-4 w-4" aria-hidden="true" />
          <span>{t(item.label)}</span>
          {mobile && <span className="ml-auto text-sm" aria-hidden="true">{item.emoji}</span>}
        </>
      )}
    </NavLink>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#21321f] text-[#f8f2e7] shadow-[0_8px_28px_rgba(13,25,15,.20)]">
      <div className="mx-auto flex min-h-16 max-w-[1600px] items-center gap-3 px-3 sm:px-5 lg:px-7">
        <Link to="/" className="flex min-w-0 shrink-0 items-center gap-3" aria-label="AgroPlantas Colombia, inicio">
          <img src="/logo.png" alt="Logo AgroPlantas Colombia" className="h-10 w-10 rounded-full object-cover ring-1 ring-white/20" />
          <span className="hidden min-w-0 sm:block">
            <span className="block whitespace-nowrap text-sm font-extrabold leading-tight lg:text-base">AgroPlantas Colombia</span>
            <span className="block text-[8px] font-semibold uppercase tracking-[0.1em] text-[#e7cda7]/75">Inteligencia artificial para plantas</span>
          </span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto px-1 lg:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visibleItems.map((item) => renderNavItem(item))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {!user ? (
            <div className="hidden items-center gap-1.5 sm:flex">
              <Link to="/login" className="rounded-xl px-3 py-2 text-xs font-bold text-white/80 transition hover:bg-white/10 hover:text-white">{t('Iniciar sesión')}</Link>
              <Link to="/login?mode=register" className="rounded-xl bg-[#e6b16c] px-3.5 py-2 text-xs font-extrabold text-[#1f2c1f] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f0c183]">{t('Crear cuenta')}</Link>
            </div>
          ) : (
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                className="flex max-w-48 items-center gap-2 rounded-xl px-2 py-1.5 text-left transition hover:bg-white/10"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-[#f3e8d4] text-[#283618] ring-2 ring-white/10">
                  {user.avatar_base64 ? <img src={user.avatar_base64} alt="" className="h-full w-full object-cover" /> : <FiUser className="h-4 w-4" />}
                </span>
                <span className="hidden truncate text-xs font-bold xl:block">{user.nombre || user.email}</span>
                <FiChevronDown className={`h-3.5 w-3.5 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: -7, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.98 }}
                    transition={{ duration: reduceMotion ? 0 : 0.16 }}
                    className="absolute right-0 top-full mt-2 w-52 origin-top-right overflow-hidden rounded-2xl border border-white/10 bg-[#263827] p-1.5 text-sm shadow-2xl"
                  >
                    <Link to="/login" onClick={() => setProfileOpen(false)} className="block rounded-xl px-3 py-2.5 text-white/85 transition hover:bg-white/10">{t('Mi perfil')}</Link>
                    <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[#ffb4a9] transition hover:bg-white/10">
                      <FiLogOut className="h-4 w-4" /> {t('Cerrar sesión')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Cerrar navegación' : 'Abrir navegación'}
            aria-expanded={menuOpen}
            className="grid h-10 w-10 place-items-center rounded-xl text-white transition hover:bg-white/10 lg:hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={menuOpen ? 'close' : 'open'}
                initial={reduceMotion ? false : { rotate: -35, opacity: 0, scale: 0.75 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 35, opacity: 0, scale: 0.75 }}
                transition={{ duration: reduceMotion ? 0 : 0.14 }}
              >
                {menuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.nav
            aria-label="Navegación móvil"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: 'easeOut' }}
            className="overflow-hidden border-t border-white/10 bg-[#1b2b1d] lg:hidden"
          >
            <div className="mx-auto grid max-w-2xl gap-1 px-3 py-3 sm:px-5">
              {visibleItems.map((item, index) => (
                <motion.div
                  key={item.to}
                  initial={reduceMotion ? false : { x: -8, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.18, delay: reduceMotion ? 0 : index * 0.025 }}
                >
                  {renderNavItem(item, true)}
                </motion.div>
              ))}
              {user ? (
                <>
                  <div className="my-1 border-t border-white/10" />
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10">
                    <FiUser className="h-4 w-4" /> {t('Mi perfil')}
                  </Link>
                  <button type="button" onClick={handleLogout} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#ffb4a9] hover:bg-white/10">
                    <FiLogOut className="h-4 w-4" /> {t('Cerrar sesión')}
                  </button>
                </>
              ) : (
                <div className="mt-1 grid grid-cols-2 gap-2 border-t border-white/10 pt-3 sm:hidden">
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="rounded-xl border border-white/15 px-3 py-2.5 text-center text-xs font-bold text-white">{t('Iniciar sesión')}</Link>
                  <Link to="/login?mode=register" onClick={() => setMenuOpen(false)} className="rounded-xl bg-[#e6b16c] px-3 py-2.5 text-center text-xs font-extrabold text-[#1f2c1f]">{t('Crear cuenta')}</Link>
                </div>
              )}
              <div className="my-1 border-t border-white/10" />
              <Link to="/soporte" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-[#e6b16c]">
                <FiHelpCircle className="h-4 w-4" aria-hidden="true" /> {t('Soporte')}
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

    </header>
  );
};

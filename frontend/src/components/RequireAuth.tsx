import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getUser, UserProfile } from '../lib/authStore';

/** Verifica la sesión y redirige a login cuando una ruta exige autenticación. */
export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    getUser()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    // Refresca la autorización al recibir login/logout sin desmontar el layout.
    const handleProfileUpdated = (event: Event) => {
      setUser((event as CustomEvent<UserProfile | null>).detail);
    };
    window.addEventListener('agroplantas:profile-updated', handleProfileUpdated);

    return () => {
      active = false;
      window.removeEventListener('agroplantas:profile-updated', handleProfileUpdated);
    };
  }, []);

  if (checking) {
    return <div className="p-8 text-center text-sm text-gray-500">Verificando sesión…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

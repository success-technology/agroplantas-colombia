// frontend/src/components/DashboardLayout.tsx
import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { FiFacebook, FiInstagram,FiYoutube} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { AgroChatbot } from './AgroChatbot';
import { GuestQuotaNotice } from './GuestQuotaNotice';
import { CookiesConsent } from './Cookies';
import { Link } from 'react-router-dom';
import { useLanguage } from '../lib/languageStore';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/** Une cabecera, navegación, contenido, pie, chatbot y avisos globales. */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { t } = useLanguage();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('agroplantas_sidebar_collapsed') !== 'false'
  );
  const [sidebarWidth, setSidebarWidth] = useState(0);

  return (
    <div className="min-h-screen bg-[#FEFAE0] dark:bg-[#182014] text-gray-900 dark:text-gray-100 flex flex-col transition-colors">
      <Header />
      <div className="flex flex-1">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((collapsed) => !collapsed)}
          onWidthChange={setSidebarWidth}
        />
        <main
          className="min-w-0 flex-1 overflow-x-hidden"
          style={{
            marginLeft: sidebarWidth,
            transition: 'margin-left 320ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {children}
        </main>
      </div>
      <footer className="relative z-50 bg-[#283618] text-[#FEFAE0]/80 py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4">
          <p className="text-xs text-center md:text-center">
            AgroPlantas Colombia © {new Date().getFullYear()} — {t('Inteligencia artificial para una agricultura más productiva y sostenible.')}
          </p>

          <Link to="/privacidad" className="text-xs underline underline-offset-2 hover:text-[#DDA15E]">
            Privacidad y cookies
          </Link>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('agroplantas:open-cookie-preferences'))}
            className="text-xs underline underline-offset-2 hover:text-[#DDA15E]"
          >
            Configurar cookies
          </button>

          <div className="flex items-center gap-5 text-lg">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#DDA15E] transition-colors"
              aria-label="Facebook"
            >
              <FiFacebook />
            </a>

            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#DDA15E] transition-colors"
              aria-label="Instagram"
            >
              <FiInstagram />
            </a>

            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#DDA15E] transition-colors"
              aria-label="YouTube"
            >
              <FiYoutube />
            </a>

            <a
              href="https://wa.me/573001234567"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#DDA15E] transition-colors"
              aria-label="WhatsApp"
            >
              <FaWhatsapp />
            </a>
          </div>
        </div>
      </footer>
      <AgroChatbot />
      <GuestQuotaNotice />
      <CookiesConsent />
    </div>
  );
};

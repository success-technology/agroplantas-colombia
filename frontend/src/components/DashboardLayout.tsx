// frontend/src/components/DashboardLayout.tsx
import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { FiFacebook, FiInstagram,FiYoutube} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#FEFAE0] flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <footer className="bg-[#283618] text-[#FEFAE0]/80 py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4">
          <p className="text-xs text-center md:text-center">
            AgroPlantas Colombia © {new Date().getFullYear()} — Inteligencia artificial para
            una agricultura más productiva y sostenible.
          </p>

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
    </div>
  );
};
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FiStar } from 'react-icons/fi';
import { DashboardLayout } from './components/DashboardLayout';
import { HomePage } from './pages/HomePage';
import { IdentificarPage } from './pages/IdentificarPage';
import { MisIdentificacionesPage } from './pages/MisIdentificacionesPage';
import { BibliotecaPage } from './pages/BibliotecaPage';
import { PlantInfoDetailPage } from './pages/Plantinfodetailpage';
import { ConsejosPage } from './pages/ConsejosPage';
import { DiagnosticosIAPage } from './pages/DiagnosticosIAPage';
import { HistorialPage } from './pages/HistorialPage';
import { AjustesPage } from './pages/AjustesPage';
import { AuthPage } from './pages/AuthPage';
import { SoportePage } from './pages/SoportePage';
import { PreguntasFrecuentesPage } from './pages/PreguntasFrecuentesPage';
import { PlanesPage } from './pages/PlanesPage';
import { PagoPage } from './pages/PagoPage';
import { PrivacidadPage } from './pages/PrivacidadPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { ThemeProvider } from './lib/themeStore';
import { RequireAuth } from './components/RequireAuth';
import { LanguageProvider } from './lib/languageStore';
import { COMMERCIAL_PLANS_ENABLED } from './lib/features';

/** Compone proveedores globales y declara todas las rutas públicas/protegidas. */
function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
      <BrowserRouter>
        <DashboardLayout>
          <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/identificar" element={<IdentificarPage />} />
          <Route path="/mis-identificaciones" element={<RequireAuth><MisIdentificacionesPage /></RequireAuth>} />
          <Route path="/biblioteca" element={<RequireAuth><BibliotecaPage /></RequireAuth>} />
          <Route path="/biblioteca/:className" element={<RequireAuth><PlantInfoDetailPage /></RequireAuth>} />
          <Route path="/consejos" element={<RequireAuth><ConsejosPage /></RequireAuth>} />
          <Route path="/diagnosticos-ia" element={<RequireAuth><DiagnosticosIAPage /></RequireAuth>} />
          <Route path="/historial" element={<RequireAuth><HistorialPage /></RequireAuth>} />
          <Route path="/ajustes" element={<RequireAuth><AjustesPage /></RequireAuth>} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/soporte" element={<SoportePage />} />
          <Route path="/preguntas-frecuentes" element={<PreguntasFrecuentesPage />} />
          <Route path="/planes" element={COMMERCIAL_PLANS_ENABLED ? <PlanesPage /> : <Navigate to="/" replace />} />
          <Route path="/pago/:planId" element={COMMERCIAL_PLANS_ENABLED ? <PagoPage /> : <Navigate to="/" replace />} />
          <Route path="/privacidad" element={<PrivacidadPage />} />
          <Route
            path="/favoritos"
            element={
                <RequireAuth>
                  <PlaceholderPage
                    title="Favoritos"
                    description="Guarda tus identificaciones y consejos más útiles."
                    icon={FiStar}
                  />
                </RequireAuth>
            }
          />
          </Routes>
        </DashboardLayout>
      </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;

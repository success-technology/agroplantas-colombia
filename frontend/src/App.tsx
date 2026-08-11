import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { PlaceholderPage } from './pages/PlaceholderPage';

function App() {
  return (
    <BrowserRouter>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/identificar" element={<IdentificarPage />} />
          <Route path="/mis-identificaciones" element={<MisIdentificacionesPage />} />
          <Route path="/biblioteca" element={<BibliotecaPage />} />
          <Route path="/biblioteca/:className" element={<PlantInfoDetailPage />} />
          <Route path="/consejos" element={<ConsejosPage />} />
          <Route path="/diagnosticos-ia" element={<DiagnosticosIAPage />} />
          <Route path="/historial" element={<HistorialPage />} />
          <Route path="/ajustes" element={<AjustesPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/soporte" element={<SoportePage />} />
          <Route
            path="/favoritos"
            element={
              <PlaceholderPage
                title="Favoritos"
                description="Guarda tus identificaciones y consejos más útiles."
                icon={FiStar}
              />
            }
          />
        </Routes>
      </DashboardLayout>
    </BrowserRouter>
  );
}

export default App;
// frontend/src/pages/HomePage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCamera, FiSearch, FiDroplet, FiSun, FiMoreVertical } from 'react-icons/fi';
import { CameraCapture } from '../components/CameraCapture';
import { getHistory, getLastIdentification, HistoryItem } from '../lib/historyStore';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [recentItems, setRecentItems] = useState<HistoryItem[]>([]);
  const [lastIdentification, setLastIdentification] = useState<HistoryItem | null>(null);

  useEffect(() => {
    getHistory().then((items) => setRecentItems(items.slice(0, 4)));
    getLastIdentification().then(setLastIdentification);
  }, []);

  const goToIdentificarWithFile = (file: File) => {
    navigate('/identificar', { state: { incomingFile: file } });
  };

  const handleCameraCapture = (file: File) => {
    setShowCamera(false);
    goToIdentificarWithFile(file);
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      goToIdentificarWithFile(file);
    }
    e.target.value = '';
  };

  return (
    <div className="flex flex-col xl:flex-row">
      <div className="flex-1 min-w-0 p-6">
        <h1 className="text-2xl font-bold text-gray-900">¡Hola, Agricultor!</h1>
        <p className="text-gray-500 mt-1">Identifica tus plantas y toma mejores decisiones.</p>

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {/* Tarjeta: tomar/subir foto */}
          <div className="border-2 border-dashed border-[#283618]/30 rounded-xl p-8 text-center bg-white flex flex-col items-center">
            <span className="w-14 h-14 rounded-full bg-[#FEFAE0] flex items-center justify-center mb-4">
              <FiCamera className="w-6 h-6 text-[#283618]" />
            </span>
            <h3 className="font-semibold text-gray-900">Toma una foto de la planta</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              o sube una imagen desde tu galería
            </p>
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="inline-flex items-center gap-2 bg-[#283618] hover:bg-[#1e290f] text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
            >
              <FiCamera className="w-4 h-4" />
              Tomar foto
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="text-xs text-gray-500 underline mt-3 hover:text-gray-700"
            >
              Subir imagen
            </button>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleGallerySelect}
            />
          </div>

          {/* Tarjeta: recomendaciones rápidas */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Recomendaciones rápidas</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3">
                <FiSearch className="w-5 h-5 text-[#283618] shrink-0 mt-0.5" />
                <span className="text-gray-600">
                  Revisa el estado de tus cultivos constantemente para detectar problemas a
                  tiempo.
                </span>
              </li>
              <li className="flex gap-3">
                <FiDroplet className="w-5 h-5 text-[#283618] shrink-0 mt-0.5" />
                <span className="text-gray-600">
                  Riega tus plantas en las horas adecuadas para un mejor aprovechamiento del
                  agua.
                </span>
              </li>
              <li className="flex gap-3">
                <FiSun className="w-5 h-5 text-[#DDA15E] shrink-0 mt-0.5" />
                <span className="text-gray-600">
                  Nutre el suelo y tus plantas con fertilizantes orgánicos.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between mt-8 mb-4">
          <h2 className="font-semibold text-gray-900">Mis identificaciones recientes</h2>
          {recentItems.length > 0 && (
            <button
              onClick={() => navigate('/mis-identificaciones')}
              className="text-sm text-[#283618] font-medium hover:underline"
            >
              Ver todas →
            </button>
          )}
        </div>

        {recentItems.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500 text-sm">
            Aún no tienes identificaciones. Toma o sube una foto para empezar.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate('/mis-identificaciones')}
                className="bg-white rounded-xl overflow-hidden shadow-sm text-left hover:shadow-md transition-shadow"
              >
                <div className="relative h-28">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  <span className="absolute top-2 right-2 bg-[#283618] text-white text-xs font-semibold rounded-full px-2 py-0.5">
                    {item.confidence}%
                  </span>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm text-gray-900">{item.title}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-gray-500">{item.crop}</span>
                    <FiMoreVertical className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">{item.date}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Panel derecho */}
      <aside className="w-full xl:w-80 shrink-0 p-6 space-y-4">
        <div className="bg-[#283618] text-white rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4">
            <h3 className="text-sm font-semibold">Última identificación</h3>
            {lastIdentification && <FiMoreVertical className="w-4 h-4 opacity-70" />}
          </div>

          {lastIdentification ? (
            <>
              <div className="relative m-4 rounded-lg overflow-hidden">
                <img
                  src={lastIdentification.image}
                  alt={lastIdentification.title}
                  className="w-full h-40 object-cover"
                />
                <span className="absolute bottom-2 right-2 bg-white text-[#283618] text-xs font-bold rounded-full px-2 py-1">
                  {lastIdentification.confidence}%
                </span>
              </div>
              <div className="px-4 pb-4">
                <p className="text-xs text-[#FEFAE0]/70">Resultado</p>
                <p className="text-lg font-bold">{lastIdentification.title}</p>
                <span className="inline-block mt-2 bg-[#DDA15E] text-white text-xs font-medium rounded-full px-3 py-1">
                  {lastIdentification.isHealthy ? 'Sana' : lastIdentification.hasDisease ? 'Enfermedad' : lastIdentification.hasPest ? 'Plaga' : lastIdentification.statusLabel || '—'}
                </span>
                <p className="text-xs text-[#FEFAE0]/70 mt-3">Cultivo afectado</p>
                <p className="text-sm">{lastIdentification.crop}</p>
                <button
                  onClick={() => navigate('/mis-identificaciones')}
                  className="mt-4 w-full bg-[#DDA15E] hover:bg-[#c98f4c] transition-colors text-white text-sm font-medium rounded-lg py-2"
                >
                  Ver detalle
                </button>
              </div>
            </>
          ) : (
            <div className="px-4 pb-4 pt-2">
              <p className="text-sm text-[#FEFAE0]/80">
                Aún no has hecho ninguna identificación. Toma una foto para ver tu resultado aquí.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[#DDA15E] font-semibold text-sm mb-2">
            <FiSun className="w-4 h-4" />
            Consejo del día
          </div>
          <p className="text-sm text-gray-600">
            La detección temprana de enfermedades puede mejorar hasta un 80% la salud de tus
            cultivos.
          </p>
        </div>
      </aside>

      {showCamera && (
        <CameraCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />
      )}
    </div>
  );
};
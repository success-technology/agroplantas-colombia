// frontend/src/pages/PlantInfoDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiAlertTriangle,
  FiCheckCircle,
  FiThermometer,
  FiDroplet,
  FiSun,
  FiMapPin,
  FiCalendar,
  FiShield,
  FiTool,
} from 'react-icons/fi';
import { PlantInfo } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const SEVERITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: 'bg-green-100', text: 'text-green-800', label: 'Severidad baja' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Severidad media' },
  high: { bg: 'bg-red-100', text: 'text-red-800', label: 'Severidad alta' },
};

export const PlantInfoDetailPage: React.FC = () => {
  const { className } = useParams<{ className: string }>();
  const navigate = useNavigate();
  const [info, setInfo] = useState<PlantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!className) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/plant-info/${encodeURIComponent(className)}`)
      .then((r) => {
        if (!r.ok) throw new Error('No se pudo cargar la información de este estado.');
        return r.json();
      })
      .then((data) => setInfo(data.plantInfo))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar.'))
      .finally(() => setLoading(false));
  }, [className]);

  const severity = info ? SEVERITY_STYLES[info.severity] ?? SEVERITY_STYLES.medium : null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/biblioteca')}
        className="mb-4 flex items-center gap-2 text-sm text-[#283618] font-medium hover:underline"
      >
        <FiArrowLeft className="w-4 h-4" />
        Volver a la biblioteca
      </button>

      {loading && (
        <div className="bg-white rounded-xl p-10 text-center text-gray-500">Cargando información...</div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      {info && (
        <div className="space-y-4">
          {/* Encabezado / imagen ilustrativa */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div
              className={`h-40 flex items-center justify-center ${
                info.hasDisease || info.hasPest ? 'bg-[#DDA15E]/20' : 'bg-[#FEFAE0]'
              }`}
            >
              {info.hasDisease || info.hasPest ? (
                <FiAlertTriangle className="w-16 h-16 text-[#DDA15E]" />
              ) : (
                <FiCheckCircle className="w-16 h-16 text-[#283618]" />
              )}
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {severity && (
                  <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${severity.bg} ${severity.text}`}>
                    {severity.label}
                  </span>
                )}
                <span className="text-xs text-gray-500">{info.category}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{info.title}</h1>
              {info.scientificName && (
                <p className="text-sm text-gray-500 italic mt-0.5">{info.scientificName}</p>
              )}
              <p className="text-gray-600 mt-3">{info.description}</p>
            </div>
          </div>

          {/* Estado */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 text-sm mb-2">Estado</h2>
            <p className="text-sm text-gray-700">{info.healthStatus}</p>
            <p className="text-sm text-gray-600 mt-1">{info.condition}</p>
          </div>

          {/* Tratamiento */}
          {info.treatment?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <FiTool className="w-4 h-4 text-[#283618]" />
                <h2 className="font-semibold text-gray-900 text-sm">Tratamiento recomendado</h2>
              </div>
              <ul className="space-y-2">
                {info.treatment.map((t, i) => (
                  <li key={i} className="text-sm text-gray-600 flex gap-2">
                    <span className="text-[#283618]">•</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Causas posibles */}
          {info.possibleCauses?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <FiAlertTriangle className="w-4 h-4 text-[#DDA15E]" />
                <h2 className="font-semibold text-gray-900 text-sm">Posibles causas</h2>
              </div>
              <ul className="space-y-2">
                {info.possibleCauses.map((c, i) => (
                  <li key={i} className="text-sm text-gray-600 flex gap-2">
                    <span className="text-[#DDA15E]">•</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prevención */}
          {info.prevention?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <FiShield className="w-4 h-4 text-[#283618]" />
                <h2 className="font-semibold text-gray-900 text-sm">Prevención</h2>
              </div>
              <ul className="space-y-2">
                {info.prevention.map((p, i) => (
                  <li key={i} className="text-sm text-gray-600 flex gap-2">
                    <span className="text-[#283618]">•</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Condiciones ambientales */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 text-sm mb-3">Condiciones ambientales</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <FiThermometer className="w-4 h-4 mx-auto text-[#283618] mb-1" />
                <p className="text-xs text-gray-500">Temperatura</p>
                <p className="text-sm font-medium text-gray-900">{info.environmental.temperature}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <FiDroplet className="w-4 h-4 mx-auto text-[#283618] mb-1" />
                <p className="text-xs text-gray-500">Humedad</p>
                <p className="text-sm font-medium text-gray-900">{info.environmental.humidity}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <FiSun className="w-4 h-4 mx-auto text-[#DDA15E] mb-1" />
                <p className="text-xs text-gray-500">Luz solar</p>
                <p className="text-sm font-medium text-gray-900">{info.environmental.sunlight}</p>
              </div>
            </div>
          </div>

          {/* Temporada y regiones */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <FiCalendar className="w-4 h-4 text-[#283618]" />
                <h2 className="font-semibold text-gray-900 text-sm">Temporada</h2>
              </div>
              <p className="text-sm text-gray-600">{info.season || 'No especificada'}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <FiMapPin className="w-4 h-4 text-[#283618]" />
                <h2 className="font-semibold text-gray-900 text-sm">Regiones de Colombia</h2>
              </div>
              {info.colombiaRegions?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {info.colombiaRegions.map((r, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">
                      {r}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No especificadas</p>
              )}
            </div>
          </div>

          {info.additionalNotes && (
            <div className="bg-[#283618] text-white rounded-xl p-5">
              <p className="text-sm text-[#FEFAE0]/90">{info.additionalNotes}</p>
            </div>
          )}

          <button
            onClick={() => navigate('/identificar')}
            className="w-full bg-[#283618] hover:bg-[#1e290f] text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
          >
            Identificar una foto de este cultivo →
          </button>
        </div>
      )}
    </div>
  );
};
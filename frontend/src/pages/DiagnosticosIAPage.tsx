// frontend/src/pages/DiagnosticosIAPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCpu, FiCheckCircle, FiAlertTriangle, FiAlertCircle, FiBarChart2, FiHelpCircle } from 'react-icons/fi';
import { getHistory, HistoryItem } from '../lib/historyStore';

export const DiagnosticosIAPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    getHistory().then(setItems);
  }, []);

  if (items.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Diagnósticos IA</h1>
        <p className="text-gray-500 mb-6">
          Análisis avanzados generados a partir de tus identificaciones.
        </p>
        <div className="bg-white rounded-xl p-10 text-center text-gray-500">
          Aún no tienes identificaciones para analizar. Ve a{' '}
          <button
            onClick={() => navigate('/identificar')}
            className="text-[#283618] font-medium hover:underline"
          >
            Identificar planta
          </button>{' '}
          para empezar.
        </div>
      </div>
    );
  }

  const total = items.length;

  // Separamos las fotos que el modelo SÍ pudo identificar de las que quedaron
  // "fuera del catálogo" (especie no reconocida) — mezclarlas distorsiona las
  // estadísticas de cultivos y diagnósticos.
  const recognized = items.filter((i) => i.prediction?.analysis?.recognized !== false);
  const unrecognized = total - recognized.length;

  const healthy = recognized.filter((i) => i.isHealthy).length;
  const withDisease = recognized.filter((i) => i.hasDisease).length;
  const withPest = recognized.filter((i) => i.hasPest).length;

  const cropCounts = new Map<string, number>();
  const conditionCounts = new Map<string, number>();
  for (const item of recognized) {
    cropCounts.set(item.crop, (cropCounts.get(item.crop) ?? 0) + 1);
    if (!item.isHealthy) {
      conditionCounts.set(item.title, (conditionCounts.get(item.title) ?? 0) + 1);
    }
  }
  const topCrops = Array.from(cropCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topConditions = Array.from(conditionCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const avgConfidence = recognized.length
    ? Math.round(recognized.reduce((sum, i) => sum + i.confidence, 0) / recognized.length)
    : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Diagnósticos IA</h1>
      <p className="text-gray-500 mb-6">
        Análisis generado a partir de tus {total} identificación{total !== 1 ? 'es' : ''} guardada
        {total !== 1 ? 's' : ''}.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <FiCpu className="w-5 h-5 mx-auto text-[#283618] mb-2" />
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-500">Total analizadas</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <FiCheckCircle className="w-5 h-5 mx-auto text-green-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{healthy}</p>
          <p className="text-xs text-gray-500">Sanas</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <FiAlertTriangle className="w-5 h-5 mx-auto text-red-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{withDisease}</p>
          <p className="text-xs text-gray-500">Con enfermedad</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <FiAlertCircle className="w-5 h-5 mx-auto text-orange-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{withPest}</p>
          <p className="text-xs text-gray-500">Con plaga</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <FiHelpCircle className="w-5 h-5 mx-auto text-gray-400 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{unrecognized}</p>
          <p className="text-xs text-gray-500">Fuera del catálogo</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FiBarChart2 className="w-4 h-4 text-[#283618]" />
            <h2 className="font-semibold text-gray-900 text-sm">Cultivos más identificados</h2>
          </div>
          {topCrops.length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos suficientes todavía.</p>
          ) : (
            <div className="space-y-3">
              {topCrops.map(([crop, count]) => (
                <div key={crop}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{crop}</span>
                    <span className="text-gray-500">{count}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#283618] rounded-full"
                      style={{ width: `${(count / topCrops[0][1]) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FiAlertTriangle className="w-4 h-4 text-[#DDA15E]" />
            <h2 className="font-semibold text-gray-900 text-sm">Diagnósticos más frecuentes</h2>
          </div>
          {topConditions.length === 0 ? (
            <p className="text-sm text-gray-400">No se han detectado plagas ni enfermedades — ¡buena señal!</p>
          ) : (
            <div className="space-y-3">
              {topConditions.map(([condition, count]) => (
                <div key={condition}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{condition}</span>
                    <span className="text-gray-500">{count}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#DDA15E] rounded-full"
                      style={{ width: `${(count / topConditions[0][1]) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#283618] text-white rounded-xl p-5">
        <p className="text-sm text-[#FEFAE0]/80">Confianza promedio del modelo (solo fotos identificadas)</p>
        <p className="text-3xl font-bold mt-1">{avgConfidence}%</p>
        <p className="text-xs text-[#FEFAE0]/70 mt-2">
          Fotos de cerca, bien enfocadas y con buena luz suelen dar mayor confianza.
          {unrecognized > 0 && ` ${unrecognized} foto${unrecognized !== 1 ? 's' : ''} no se pudieron identificar y no cuentan en este promedio.`}
        </p>
      </div>
    </div>
  );
};
// frontend/src/pages/HistorialPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiArrowLeft } from 'react-icons/fi';
import { getHistory, HistoryItem } from '../lib/historyStore';
import { ResultsCard } from '../components/ResultsCard';

function groupLabel(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return 'Esta semana';
  if (diffDays < 30) return 'Este mes';
  return 'Más antiguo';
}

export const HistorialPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [selected, setSelected] = useState<HistoryItem | null>(null);

  useEffect(() => {
    getHistory().then(setItems);
  }, []);

  if (selected) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <button
          onClick={() => setSelected(null)}
          className="mb-4 flex items-center gap-2 text-sm text-[#283618] font-medium hover:underline"
        >
          <FiArrowLeft className="w-4 h-4" />
          Volver al historial
        </button>
        {selected.prediction ? (
          <ResultsCard prediction={selected.prediction} imageUrl={selected.image} />
        ) : (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">
            Este registro no tiene el detalle completo guardado (puede ser de una versión anterior
            del historial). Vuelve a identificar la foto para tener el detalle disponible.
          </div>
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Historial</h1>
        <p className="text-gray-500 mb-6">Registro cronológico de todas tus consultas.</p>
        <div className="bg-white rounded-xl p-10 text-center text-gray-500">
          Aún no tienes identificaciones. Ve a{' '}
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

  const groups = new Map<string, HistoryItem[]>();
  for (const item of items) {
    const label = groupLabel(item.timestamp);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(item);
  }
  const orderedLabels = ['Hoy', 'Ayer', 'Esta semana', 'Este mes', 'Más antiguo'].filter((l) =>
    groups.has(l)
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Historial</h1>
      <p className="text-gray-500 mb-6">Registro cronológico de todas tus consultas.</p>

      <div className="space-y-8">
        {orderedLabels.map((label) => (
          <div key={label}>
            <div className="flex items-center gap-2 mb-3">
              <FiClock className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{label}</h2>
            </div>
            <div className="space-y-2 border-l-2 border-gray-100 pl-4">
              {groups.get(label)!.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="w-full flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm text-left hover:shadow-md transition-shadow relative"
                >
                  <span className="absolute -left-[21px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#283618]" />
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-gray-900 truncate">{item.title}</p>
                    <p className="text-xs text-gray-500">
                      {item.crop} · {item.date}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold rounded-full px-2 py-0.5 shrink-0 ${
                      item.isHealthy
                        ? 'bg-green-100 text-green-800'
                        : item.hasDisease
                        ? 'bg-red-100 text-red-800'
                        : item.hasPest
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {item.confidence}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
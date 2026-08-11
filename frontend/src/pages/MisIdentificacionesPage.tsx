// frontend/src/pages/MisIdentificacionesPage.tsx
import React, { useEffect, useState } from 'react';
import { FiMoreVertical, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import { getHistory, clearHistory, HistoryItem } from '../lib/historyStore';
import { ResultsCard } from '../components/ResultsCard';

export const MisIdentificacionesPage: React.FC = () => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [selected, setSelected] = useState<HistoryItem | null>(null);

  useEffect(() => {
    getHistory().then(setItems);
  }, []);

  const handleClear = async () => {
    await clearHistory();
    setItems([]);
    setSelected(null);
  };

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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis identificaciones</h1>
          <p className="text-gray-500 mt-1">
            Aquí verás el historial completo de tus identificaciones.
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
          >
            <FiTrash2 className="w-4 h-4" />
            Borrar historial
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-gray-500">
          Aún no tienes identificaciones. Ve a{' '}
          <span className="font-medium text-[#283618]">Identificar planta</span> para tomar tu
          primera foto.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
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
  );
};
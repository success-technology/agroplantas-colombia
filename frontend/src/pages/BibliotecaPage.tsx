// frontend/src/pages/BibliotecaPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiBook, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Traducción de las claves de cultivo que usa el backend a nombre + categoría en español.
// Si aparece un cultivo nuevo que no está aquí, se muestra con un formato genérico igual.
const SPECIES_ES: Record<string, { name: string; category: string }> = {
  Apple: { name: 'Manzana', category: 'Frutal' },
  Blueberry: { name: 'Arándano', category: 'Frutal' },
  'Corn_(maize)': { name: 'Maíz', category: 'Cereal' },
  Grape: { name: 'Uva', category: 'Frutal' },
  Orange: { name: 'Naranja / Cítrico', category: 'Frutal' },
  Potato: { name: 'Papa', category: 'Tubérculo' },
  Raspberry: { name: 'Frambuesa', category: 'Frutal' },
  Strawberry: { name: 'Fresa', category: 'Frutal' },
  Tomato: { name: 'Tomate', category: 'Hortícola' },
  Yuca: { name: 'Yuca', category: 'Tubérculo' },
  Cafe: { name: 'Café', category: 'Perenne' },
  Cacao: { name: 'Cacao', category: 'Perenne' },
  Platano: { name: 'Plátano/Banano', category: 'Frutal' },
  Banano: { name: 'Plátano/Banano', category: 'Frutal' },
  Mango: { name: 'Mango', category: 'Frutal' },
  Arroz: { name: 'Arroz', category: 'Cereal' },
  Citricos: { name: 'Cítricos', category: 'Frutal' },
  Algodon: { name: 'Algodón', category: 'Fibra' },
  CanaDeAzucar: { name: 'Caña de azúcar', category: 'Agroindustrial' },
  Guayaba: { name: 'Guayaba', category: 'Frutal' },
  Frijol: { name: 'Fríjol', category: 'Leguminosa' },
  Papaya: { name: 'Papaya', category: 'Frutal' },
};

function prettifyCondition(raw: string): string {
  if (raw.toLowerCase() === 'healthy' || raw.toLowerCase() === 'sana') return 'Sana';
  return raw
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function speciesInfo(key: string): { name: string; category: string } {
  if (SPECIES_ES[key]) return SPECIES_ES[key];
  return {
    name: key.replace(/_/g, ' ').replace(/[()]/g, '').trim(),
    category: 'Cultivo',
  };
}

interface ConditionEntry {
  label: string;
  fullClassName: string;
}

interface SpeciesCard {
  key: string;
  name: string;
  category: string;
  conditions: ConditionEntry[];
}

export const BibliotecaPage: React.FC = () => {
  const navigate = useNavigate();
  const [species, setSpecies] = useState<SpeciesCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((r) => r.json())
      .then((data: { classes?: string[] }) => {
        const classes = data.classes ?? [];
        const bySpecies = new Map<string, Map<string, string>>(); // key -> (label -> fullClassName)
        for (const full of classes) {
          const [key, cond] = full.includes('___') ? full.split('___', 2) : [full, 'healthy'];
          if (!bySpecies.has(key)) bySpecies.set(key, new Map());
          bySpecies.get(key)!.set(prettifyCondition(cond), full);
        }
        const cards: SpeciesCard[] = Array.from(bySpecies.entries())
          .map(([key, condMap]) => {
            const info = speciesInfo(key);
            const conditions: ConditionEntry[] = Array.from(condMap.entries())
              .map(([label, fullClassName]) => ({ label, fullClassName }))
              .sort((a, b) => a.label.localeCompare(b.label, 'es'));
            return {
              key,
              name: info.name,
              category: info.category,
              conditions,
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name, 'es'));
        setSpecies(cards);
      })
      .catch(() => setError('No se pudo conectar con el backend para traer la lista de cultivos.'));
  }, []);

  const filtered = useMemo(() => {
    if (!species) return [];
    const q = search.trim().toLowerCase();
    if (!q) return species;
    return species.filter(
      (s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
    );
  }, [species, search]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Biblioteca de plantas</h1>
      <p className="text-gray-500 mb-6">
        Catálogo de los cultivos y estados que el modelo puede identificar en este momento.
      </p>

      <div className="relative mb-6">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cultivo o categoría..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#283618]/30"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-6">
          {error}
        </div>
      )}

      {!species && !error && (
        <div className="bg-white rounded-xl p-10 text-center text-gray-500">Cargando catálogo...</div>
      )}

      {species && filtered.length === 0 && (
        <div className="bg-white rounded-xl p-10 text-center text-gray-500">
          No hay cultivos que coincidan con "{search}".
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((s) => {
          const isOpen = expanded === s.key;
          return (
            <div key={s.key} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : s.key)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-[#FEFAE0] flex items-center justify-center shrink-0">
                    <FiBook className="w-4 h-4 text-[#283618]" />
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-500">
                      {s.category} · {s.conditions.length} estado{s.conditions.length !== 1 ? 's' : ''} conocido
                      {s.conditions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {isOpen ? (
                  <FiChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                ) : (
                  <FiChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                )}
              </button>
              {isOpen && (
                <div className="px-4 pb-4">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {s.conditions.map((c) => (
                      <button
                        key={c.fullClassName}
                        onClick={() => navigate(`/biblioteca/${encodeURIComponent(c.fullClassName)}`)}
                        className={`text-xs px-2.5 py-1 rounded-full hover:ring-2 hover:ring-offset-1 transition-shadow ${
                          c.label === 'Sana'
                            ? 'bg-green-100 text-green-800 hover:ring-green-300'
                            : 'bg-amber-100 text-amber-800 hover:ring-amber-300'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate('/identificar')}
                    className="text-sm text-[#283618] font-medium hover:underline"
                  >
                    Identificar una foto de {s.name.toLowerCase()} →
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
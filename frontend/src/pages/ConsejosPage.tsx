// frontend/src/pages/ConsejosPage.tsx
import React, { useState } from 'react';
import { FiDroplet, FiSun, FiShield, FiRepeat, FiFeather, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface Tip {
  title: string;
  icon: React.ReactNode;
  color: string;
  items: string[];
}

const TIPS: Tip[] = [
  {
    title: 'Riego',
    icon: <FiDroplet className="w-5 h-5" />,
    color: 'text-blue-600 bg-blue-50',
    items: [
      'Riega temprano en la mañana o al final de la tarde, para que el agua no se evapore tan rápido y las hojas no se queden mojadas toda la noche.',
      'Riega directo al suelo en vez de mojar las hojas — así reduces el riesgo de hongos y bacterias.',
      'Revisa la humedad del suelo antes de regar; el exceso de agua es tan dañino como la falta de ella.',
      'En época de lluvias, asegúrate de que el terreno drene bien para evitar que las raíces se ahoguen.',
    ],
  },
  {
    title: 'Fertilización',
    icon: <FiSun className="w-5 h-5" />,
    color: 'text-amber-600 bg-amber-50',
    items: [
      'Antes de fertilizar, si puedes, haz un análisis de suelo — así sabes exactamente qué le falta a tu terreno en vez de adivinar.',
      'No te pases con el nitrógeno: en exceso, hace que la planta crezca débil y más propensa a enfermedades.',
      'Fertiliza según la etapa de la planta (no es lo mismo una plántula que una planta en floración).',
      'El abono orgánico (compost, gallinaza) mejora el suelo a largo plazo, no solo alimenta a la planta en el momento.',
    ],
  },
  {
    title: 'Control de plagas y enfermedades',
    icon: <FiShield className="w-5 h-5" />,
    color: 'text-red-600 bg-red-50',
    items: [
      'Revisa tus cultivos con regularidad, sobre todo el envés de las hojas — muchas plagas se esconden ahí.',
      'Actúa apenas veas los primeros síntomas; entre más rápido reacciones, más fácil es controlar el problema.',
      'Prefiere el control integrado (variedades resistentes, enemigos naturales, rotación) antes de saltar directo a los químicos.',
      'Si usas productos químicos, sigue siempre las instrucciones de la etiqueta y respeta los tiempos de espera antes de cosechar.',
    ],
  },
  {
    title: 'Rotación y manejo del terreno',
    icon: <FiRepeat className="w-5 h-5" />,
    color: 'text-purple-600 bg-purple-50',
    items: [
      'Evita sembrar el mismo cultivo (o de la misma familia) en el mismo terreno una y otra vez — agota el suelo y acumula plagas y enfermedades específicas.',
      'Alterna cultivos de raíz, hoja y leguminosas para mantener el suelo balanceado.',
      'Mantén cubierto el suelo cuando no esté sembrado (con cobertura vegetal o mulch) para evitar erosión y control de malezas.',
      'Limpia y desinfecta tus herramientas entre lotes, especialmente si alguno tuvo problemas fitosanitarios.',
    ],
  },
  {
    title: 'Buenas prácticas generales',
    icon: <FiFeather className="w-5 h-5" />,
    color: 'text-[#283618] bg-[#FEFAE0]',
    items: [
      'Usa siempre semilla o material de siembra certificado, de buena procedencia.',
      'Lleva un registro simple de lo que siembras y cuándo — te ayuda a detectar patrones año tras año.',
      'Consulta con el extensionista agrícola de tu municipio ante cualquier duda seria — la app es una ayuda, no un reemplazo del criterio técnico en campo.',
      'Toma fotos de cerca, con buena luz, enfocando la hoja o la parte afectada, para que el diagnóstico automático sea más preciso.',
    ],
  },
];

export const ConsejosPage: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeTip = TIPS[activeIndex];

  const moveCarousel = (direction: number) => {
    setActiveIndex((current) => (current + direction + TIPS.length) % TIPS.length);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Consejos y manejo</h1>
          <p className="text-gray-500">
            Recomendaciones generales para el cuidado de tus cultivos, explicadas de forma clara.
          </p>
        </div>
        <span className="shrink-0 text-xs font-semibold text-gray-500 tabular-nums">
          {activeIndex + 1} / {TIPS.length}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="h-1 bg-[#DDA15E]" />
        <div className="p-5 sm:p-7">
          <div className="flex items-center gap-3 mb-6">
            <span className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${activeTip.color}`}>
              {activeTip.icon}
            </span>
            <h2 className="font-semibold text-gray-900 text-lg">{activeTip.title}</h2>
          </div>
          <ul className="space-y-3.5 min-h-[220px]">
            {activeTip.items.map((item, itemIndex) => (
              <li key={itemIndex} className="text-sm text-gray-700 flex gap-2.5">
                <span className="text-[#DDA15E] font-bold mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between gap-4 mt-6 pt-5 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => moveCarousel(-1)}
              aria-label="Consejo anterior"
              className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2" aria-label="Seleccionar categoría de consejos">
              {TIPS.map((tip, tipIndex) => (
                <button
                  key={tip.title}
                  type="button"
                  onClick={() => setActiveIndex(tipIndex)}
                  aria-label={`Ver consejos de ${tip.title}`}
                  aria-current={tipIndex === activeIndex ? 'step' : undefined}
                  className={`h-2 rounded-full transition-all ${tipIndex === activeIndex ? 'w-7 bg-[#283618] dark:bg-[#DDA15E]' : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => moveCarousel(1)}
              aria-label="Siguiente consejo"
              className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
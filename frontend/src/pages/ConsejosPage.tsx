// frontend/src/pages/ConsejosPage.tsx
import React from 'react';
import { FiDroplet, FiSun, FiShield, FiRepeat, FiFeather } from 'react-icons/fi';

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
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Consejos y manejo</h1>
      <p className="text-gray-500 mb-6">
        Recomendaciones generales para el cuidado de tus cultivos, explicadas de forma clara.
      </p>

      <div className="space-y-4">
        {TIPS.map((section) => (
          <div key={section.title} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${section.color}`}>
                {section.icon}
              </span>
              <h2 className="font-semibold text-gray-900">{section.title}</h2>
            </div>
            <ul className="space-y-2.5">
              {section.items.map((item, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2.5">
                  <span className="text-[#DDA15E] font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
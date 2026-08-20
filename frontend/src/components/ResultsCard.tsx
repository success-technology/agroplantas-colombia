import React from 'react';
import { motion } from 'framer-motion';
import {
  FiCheckCircle,
  FiThermometer,
  FiDroplet,
  FiSun,
  FiMapPin,
  FiCalendar,
  FiInfo,
  FiShield,
  FiActivity,
  FiTag,
} from 'react-icons/fi';
import { PredictionResult, PlantInfo } from '../types';

interface ResultsCardProps {
  prediction: PredictionResult;
  imageUrl: string;
}

const Section: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  icon,
  children,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gray-50 rounded-xl p-5 border border-gray-100"
  >
    <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">
      {icon}
      {title}
    </h4>
    {children}
  </motion.div>
);

export const ResultsCard: React.FC<ResultsCardProps> = ({ prediction, imageUrl }) => {
  const info: PlantInfo = prediction.plantInfo ?? prediction.recommendations;
  const a = prediction.analysis;
  const notRecognized = a?.recognized === false;

  const statusColor = notRecognized
    ? 'bg-slate-700'
    : a?.isHealthy
    ? 'bg-green-600'
    : a?.hasPest
    ? 'bg-orange-600'
    : a?.hasDisease
    ? 'bg-red-600'
    : 'bg-yellow-600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl overflow-hidden"
    >
      <div className={`${statusColor} text-white px-6 py-8 md:px-10`}>
        {notRecognized ? (
          <>
            <p className="text-sm uppercase tracking-widest opacity-90 mb-1">Resultado del análisis</p>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
              Especie no identificada
            </h2>
            <p className="text-white/90 text-base max-w-xl">
              Esta planta (por ejemplo orégano, café, yuca, plátano) <strong>no está en el catálogo</strong> con
              el que se entrenó el modelo. No es un error suyo: el sistema reconoce {(a?.supportedSpecies ?? []).length || 21} cultivos.
            </p>
            {a?.weakGuessSpecies && (
              <p className="mt-3 text-amber-200 text-sm bg-black/20 rounded-lg p-3">
                El modelo intentó adivinar «{a.weakGuessSpecies}» con solo{' '}
                {((a.weakGuessConfidence ?? prediction.confidence) * 100).toFixed(0)}% de confianza —{' '}
                <strong>ignore ese nombre</strong> (por eso antes aparecía «uva» o «fresa»).
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-sm uppercase tracking-widest opacity-90 mb-1">Especie identificada</p>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-2">{a?.speciesName ?? info.plantType}</h2>
            {info.scientificName && (
              <p className="text-white/80 italic text-sm mb-4">{info.scientificName}</p>
            )}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid sm:grid-cols-3 gap-3 mt-4"
            >
              <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
                <p className="text-xs uppercase opacity-80">Estado</p>
                <p className="text-lg font-bold mt-1">{a?.statusLabel ?? info.healthStatus}</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
                <p className="text-xs uppercase opacity-80">Plaga</p>
                <p className="text-lg font-bold mt-1">{a?.hasPest ? 'Sí detectada' : 'No detectada'}</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
                <p className="text-xs uppercase opacity-80">Enfermedad</p>
                <p className="text-lg font-bold mt-1">{a?.hasDisease ? 'Sí detectada' : 'No detectada'}</p>
              </div>
            </motion.div>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-0">
        <div className="lg:col-span-2 relative min-h-[240px] lg:min-h-[420px]">
          <img src={imageUrl} alt="Planta analizada" className="w-full h-full object-cover" />
          <span className="absolute top-4 left-4 px-3 py-1 bg-black/60 text-white text-sm rounded-full">
            {info.category}
          </span>
        </div>

        <div className="lg:col-span-3 p-6 md:p-8 max-h-[80vh] overflow-y-auto">
          {(prediction.lowConfidence || a?.uncertain || notRecognized) && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-sm">
              <div className="flex gap-2 font-semibold mb-1">
                <FiInfo className="w-5 h-5 shrink-0" />
                {notRecognized ? 'Planta fuera del catálogo' : 'Resultado con baja confianza'}
              </div>
              <p>
                {notRecognized ? (
                  <>
                    El modelo <strong>solo reconoce</strong> estos cultivos:{' '}
                    {(a?.supportedSpecies ?? []).join(', ')}.
                    Para orégano u otras hierbas hay que agregar fotos al dataset y reentrenar.
                  </>
                ) : (
                  <>
                    Tome la foto <strong>de cerca, enfocando una hoja</strong>, con buena luz y fondo sencillo.
                  </>
                )}
              </p>
            </div>
          )}

          {!notRecognized && (
          <div className="mb-6 p-4 border-2 border-emerald-200 bg-emerald-50 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold mb-1">
              <FiTag className="w-5 h-5" />
              Diagnóstico
            </div>
            <p className="text-xl font-bold text-gray-900">
              {a?.isHealthy ? 'Planta sana' : a?.conditionShort ?? info.condition}
            </p>
            {!a?.isHealthy && info.pestOrDiseaseName && (
              <p className="text-red-700 text-sm mt-1 font-medium">{info.pestOrDiseaseName}</p>
            )}
          </div>
          )}

          {notRecognized && a?.supportedSpecies && a.supportedSpecies.length > 0 && (
            <Section title="Cultivos que sí reconoce la app" icon={<FiTag className="w-4 h-4 text-green-600" />}>
              <div className="flex flex-wrap gap-2">
                {a.supportedSpecies.map((s) => (
                  <span key={s} className="text-sm px-3 py-1 bg-green-100 text-green-800 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </Section>
          )}

          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Confianza del análisis</span>
              <span className="font-bold text-gray-900">{(prediction.confidence * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${prediction.confidence * 100}%` }}
                transition={{ duration: 0.8 }}
                className={`h-full rounded-full ${
                  prediction.confidence > 0.7
                    ? 'bg-green-500'
                    : prediction.confidence > 0.5
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
              />
            </div>
            {a?.alternativeSpecies && a.alternativeSpecies.length > 0 && (
              <p className="mt-3 text-xs text-gray-500">
                {notRecognized ? 'Hipótesis del modelo (no usar): ' : 'Otras especies posibles: '}
                {a.alternativeSpecies
                  .slice(0, 4)
                  .map((s) => `${s.speciesName} (${(s.probability * 100).toFixed(0)}%)`)
                  .join(' · ')}
              </p>
            )}
          </div>

          <p className="text-gray-600 mb-6">{info.description}</p>

          <div className="space-y-4">
            {info.treatment.length > 0 && (
              <Section title="Tratamiento" icon={<FiShield className="w-4 h-4 text-green-600" />}>
                <ul className="space-y-2">
                  {info.treatment.map((t, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-green-600 font-bold">{i + 1}.</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {info.possibleCauses.length > 0 && (
              <Section title="Posibles causas" icon={<FiActivity className="w-4 h-4 text-orange-600" />}>
                <ul className="space-y-1.5">
                  {info.possibleCauses.map((c, i) => (
                    <li key={i} className="text-sm text-gray-700">
                      • {c}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <Section title="Temporada" icon={<FiCalendar className="w-4 h-4 text-indigo-600" />}>
                <p className="text-sm text-gray-700">{info.season}</p>
              </Section>
              <Section title="Regiones Colombia" icon={<FiMapPin className="w-4 h-4 text-indigo-600" />}>
                <div className="flex flex-wrap gap-1.5">
                  {info.colombiaRegions.map((r) => (
                    <span key={r} className="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                      {r}
                    </span>
                  ))}
                </div>
              </Section>
            </div>

            {info.prevention.length > 0 && (
              <Section title="Prevención" icon={<FiCheckCircle className="w-4 h-4 text-teal-600" />}>
                <ul className="space-y-1.5">
                  {info.prevention.map((p, i) => (
                    <li key={i} className="text-sm text-gray-700">
                      • {p}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title="Condiciones ambientales" icon={<FiThermometer className="w-4 h-4" />}>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-white rounded-lg">
                  <FiThermometer className="w-4 h-4 mx-auto text-orange-500 mb-1" />
                  {info.environmental.temperature}
                </div>
                <div className="p-2 bg-white rounded-lg">
                  <FiDroplet className="w-4 h-4 mx-auto text-blue-500 mb-1" />
                  {info.environmental.humidity}
                </div>
                <div className="p-2 bg-white rounded-lg">
                  <FiSun className="w-4 h-4 mx-auto text-yellow-500 mb-1" />
                  {info.environmental.sunlight}
                </div>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

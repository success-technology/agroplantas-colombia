// frontend/src/components/FeatureGrid.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  FiCpu, 
  FiCamera, 
  FiCloud, 
  FiUsers,
  FiShield,
  FiGlobe
} from 'react-icons/fi';

const features = [
  {
    icon: FiCpu,
    title: 'IA de Última Generación',
    description: 'Redes neuronales convolucionales entrenadas con miles de imágenes de cultivos colombianos',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: FiCamera,
    title: 'Fácil de Usar',
    description: 'Solo toma una foto con tu teléfono y obtén resultados instantáneos',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: FiCloud,
    title: 'Actualización Continua',
    description: 'El modelo mejora constantemente con nuevas imágenes de campo',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: FiUsers,
    title: 'Diseñado para Agricultores',
    description: 'Interfaz intuitiva y recomendaciones prácticas en lenguaje sencillo',
    color: 'from-orange-500 to-red-500'
  },
  {
    icon: FiShield,
    title: 'Alta Precisión',
    description: 'Más del 95% de exactitud en condiciones controladas',
    color: 'from-indigo-500 to-purple-500'
  },
  {
    icon: FiGlobe,
    title: 'Adaptado a Colombia',
    description: 'Enfoque especial en cultivos de café, plátano, maíz, yuca y papa',
    color: 'from-teal-500 to-green-500'
  }
];

export const FeatureGrid: React.FC = () => {
  return (
    <section className="py-16">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Tecnología al Servicio del Campo Colombiano
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Nuestra plataforma combina lo último en inteligencia artificial con las necesidades reales de los pequeños agricultores
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            <div className={`h-2 bg-gradient-to-r ${feature.color}`} />
            <div className="p-8">
              <feature.icon className="w-12 h-12 text-gray-700 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
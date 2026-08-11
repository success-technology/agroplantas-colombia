import React from 'react';
import { FiCheckCircle, FiAlertCircle, FiCpu } from 'react-icons/fi';
import { HealthStatus } from '../types';

interface ModelStatusProps {
  health: HealthStatus;
}

export const ModelStatus: React.FC<ModelStatusProps> = ({ health }) => {
  const trained = health.model_trained;
  return (
    <div
      className={`max-w-4xl mx-auto mb-8 flex items-center gap-3 px-4 py-3 rounded-xl border ${
        trained
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-amber-50 border-amber-200 text-amber-800'
      }`}
    >
      {trained ? (
        <FiCheckCircle className="w-5 h-5 shrink-0" />
      ) : (
        <FiAlertCircle className="w-5 h-5 shrink-0" />
      )}
      <FiCpu className="w-5 h-5 shrink-0 opacity-60" />
      <div className="text-sm">
        {trained ? (
          <span>
            Modelo entrenado activo — <strong>{health.num_classes}</strong> clases disponibles
          </span>
        ) : (
          <span>
            Modo demostración — Entrena el modelo con tu dataset de Kaggle para predicciones reales
          </span>
        )}
      </div>
    </div>
  );
};

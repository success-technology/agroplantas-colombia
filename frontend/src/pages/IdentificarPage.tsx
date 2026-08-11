// frontend/src/pages/IdentificarPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadZone } from '../components/UploadZone';
import { ResultsCard } from '../components/ResultsCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ModelStatus } from '../components/ModelStatus';
import { PredictionResult, HealthStatus } from '../types';
import { saveIdentification } from '../lib/historyStore';
import { isLoggedIn } from '../lib/authStore';

const API_BASE = import.meta.env.VITE_API_URL || '';

export const IdentificarPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const processedIncomingFile = useRef(false);

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setPrediction(null);

    const formData = new FormData();
    formData.append('file', file);
    setSelectedImage(URL.createObjectURL(file));

    try {
      const response = await fetch(`${API_BASE}/api/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        const msg = err.detail || 'Error al procesar la imagen';
        if (response.status === 503) {
          throw new Error(
            `${msg}. El modelo debe entrenarse con tu dataset PlantVillage (scripts/train.py).`
          );
        }
        throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
      }

      const data = await response.json();
      const pred = data.prediction;
      if (pred && !pred.analysis && pred.plantInfo) {
        pred.analysis = {
          recognized: pred.confidence >= 0.55,
          speciesName: pred.plantInfo.plantType,
          speciesConfidence: pred.confidence,
          statusLabel: pred.plantInfo.healthStatus,
          conditionShort: pred.plantInfo.condition,
          isHealthy: !pred.plantInfo.hasPest && !pred.plantInfo.hasDisease,
          hasPest: pred.plantInfo.hasPest,
          hasDisease: pred.plantInfo.hasDisease,
        };
      }
      if (pred && !pred.plantInfo && pred.recommendations) {
        pred.plantInfo = pred.recommendations;
      }
      setPrediction(pred);

      if (pred) {
        try {
          await saveIdentification(file, pred);
        } catch {
          // No bloquea el flujo principal si falla el guardado del historial.
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de conexión con el servidor');
      setSelectedImage(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setPrediction(null);
    setSelectedImage(null);
    setError(null);
  };

  useEffect(() => {
    const state = location.state as { incomingFile?: File } | null;
    if (state?.incomingFile && !processedIncomingFile.current) {
      processedIncomingFile.current = true;
      handleImageUpload(state.incomingFile);
      // Limpia el state para que un refresh o "volver" no reprocese la misma foto
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Identificar planta</h1>
      <p className="text-gray-500 mb-6">
        Sube una foto y obtén diagnóstico, confianza y recomendaciones agronómicas.
      </p>

      {health && <ModelStatus health={health} />}

      {!isLoggedIn() && (
        <div className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5">
          No has iniciado sesión — puedes identificar tu planta igual, pero el resultado no se
          guardará en tu historial.
        </div>
      )}

      <UploadZone onImageUpload={handleImageUpload} disabled={isUploading} />

      <AnimatePresence>
        {isUploading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoadingSpinner />
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
          <p className="text-sm mt-2 text-red-600">
            Verifica que el backend esté activo: <code>uvicorn backend.main:app --reload</code>
          </p>
        </div>
      )}

      {prediction && selectedImage && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
          <ResultsCard prediction={prediction} imageUrl={selectedImage} />
          <button
            onClick={handleReset}
            className="mt-4 w-full py-3 text-[#283618] font-medium hover:bg-[#283618]/5 rounded-xl transition-colors"
          >
            Analizar otra imagen
          </button>
        </motion.div>
      )}
    </div>
  );
};
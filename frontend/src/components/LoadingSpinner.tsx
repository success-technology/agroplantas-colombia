// frontend/src/components/LoadingSpinner.tsx
import React from 'react';
import { motion } from 'framer-motion';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full"
      />
      <p className="mt-4 text-gray-600">Analizando imagen...</p>
    </div>
  );
};
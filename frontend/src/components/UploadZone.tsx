// frontend/src/components/UploadZone.tsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { FiUpload, FiCamera, FiImage } from 'react-icons/fi';

interface UploadZoneProps {
  onImageUpload: (file: File) => void;
  disabled?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onImageUpload, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onImageUpload(acceptedFiles[0]);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    disabled,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    maxSize: 10485760,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false)
  });

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        {...getRootProps()}
        className={`
          relative overflow-hidden rounded-2xl border-2 border-dashed
          transition-all duration-300 cursor-pointer
          ${isDragging
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 bg-white hover:border-green-400 hover:bg-green-50/50'
          }
        `}
      >
        <input {...getInputProps()} />

        <div className="p-12 text-center">
          <p className="text-gray-500 mb-4 text-sm max-w-lg mx-auto">
            Agrega una imagen del cultivo que deseas identificar y deja que AgroPlantas Colombia lo haga por ti.
          </p>
          <motion.div
            animate={{ y: isDragging ? -10 : 0 }}
            className="flex justify-center mb-4 py-6"
          >
            <div className="relative">
              <FiCamera className="absolute -right-4 -bottom-2 w-8 h-8 text-emerald-500"/>
            </div>
          </motion.div>

          <h3 className="text-2xl font-semibold text-gray-800 mb-2">
            {isDragging ? 'Suelta la imagen aquí' : 'Sube una imagen de tu cultivo'}
          </h3>

          <p className="text-gray-500 mb-4">
            Arrastra y suelta o haz clic para seleccionar
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <FiImage className="w-4 h-4" />
            <span>JPG, PNG, WEBP (Máx. 10MB)</span>
          </div>
        </div>

        {/* Decorative background pattern */}
        <div className="absolute inset-0 -z-10 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
      </div>
    </motion.div>
  );
};
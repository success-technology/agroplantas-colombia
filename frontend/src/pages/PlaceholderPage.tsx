// frontend/src/pages/PlaceholderPage.tsx
import React from 'react';
import { IconType } from 'react-icons';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: IconType;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description,
  icon: Icon,
}) => {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="bg-white rounded-xl p-12 text-center shadow-sm">
        <span className="w-16 h-16 rounded-full bg-[#FEFAE0] flex items-center justify-center mx-auto mb-4">
          <Icon className="w-7 h-7 text-[#283618]" />
        </span>
        <h1 className="text-xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-500">{description}</p>
        <p className="text-xs text-gray-400 mt-6">
          Esta sección está en construcción — pronto se conectará con datos reales.
        </p>
      </div>
    </div>
  );
};
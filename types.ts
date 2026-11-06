// frontend/src/types.ts
export interface Probability {
  className: string;
  probability: number;
}

export interface Recommendation {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  actions: string[];
}

/** Contratos TypeScript heredados de resultados consumidos por herramientas antiguas. */
export interface PredictionResult {
  className: string;
  confidence: number;
  probabilities: Probability[];
  recommendations: Recommendation;
}

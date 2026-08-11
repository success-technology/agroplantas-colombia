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

export interface PredictionResult {
  className: string;
  confidence: number;
  probabilities: Probability[];
  recommendations: Recommendation;
}
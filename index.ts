// frontend/src/types/index.ts
export interface PredictionResult {
  className: string;
  confidence: number;
  probabilities: Array<{
    className: string;
    probability: number;
  }>;
  recommendations: {
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    actions: string[];
  };
}

export interface UploadResponse {
  success: boolean;
  prediction?: PredictionResult;
  error?: string;
  processingTime: number;
}
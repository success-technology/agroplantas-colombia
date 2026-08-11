export interface Probability {
  className: string;
  probability: number;
}

export interface EnvironmentalFactors {
  temperature: string;
  humidity: string;
  sunlight: string;
}

export interface PlantInfo {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';

  plantType: string;
  scientificName?: string | null;
  category: string;
  healthStatus: string;
  condition: string;

  hasPest: boolean;
  hasDisease: boolean;
  pestOrDiseaseName?: string | null;

  treatment: string[];
  possibleCauses: string[];
  season: string;
  colombiaRegions: string[];
  prevention: string[];
  actions: string[];

  environmental: EnvironmentalFactors;
  additionalNotes?: string | null;
}

export type Recommendation = PlantInfo;

export interface AnalysisSummary {
  recognized: boolean;
  speciesName: string;
  speciesConfidence: number;
  statusLabel: string;
  conditionShort: string;
  isHealthy: boolean;
  hasPest: boolean;
  hasDisease: boolean;
  uncertain?: boolean;
  alternativeSpecies?: { speciesKey: string; speciesName: string; probability: number }[];
  supportedSpecies?: string[];
  rejectionReason?: string | null;
  weakGuessSpecies?: string | null;
  weakGuessConfidence?: number | null;
}

export interface PredictionResult {
  className: string;
  confidence: number;
  probabilities: Probability[];
  analysis: AnalysisSummary;
  plantInfo: PlantInfo;
  recommendations: PlantInfo;
  lowConfidence?: boolean;
}

export interface PredictionResponse {
  success: boolean;
  prediction?: PredictionResult;
  error?: string;
  processingTime: number;
}

export interface HealthStatus {
  status: string;
  model_loaded: boolean;
  model_trained: boolean;
  classes: string[];
  num_classes: number;
}

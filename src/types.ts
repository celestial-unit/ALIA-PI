export type Language = "FR" | "EN" | "AR" | "ES";

export type Mode = "TRAINING" | "COMMERCIAL";

export type UserRole = "VISITOR" | "HEALTHCARE_PROFESSIONAL" | "INSTITUTIONAL_PARTNER";

export interface MedicalProduct {
  id: string;
  name: string;
  indication: string;
  mechanism: string;
  posology: string;
  clinicalBenefits: string;
  studies: string;
  rcp: string;
}

export interface TrainingScenario {
  id: string;
  title: string;
  description: string;
  timeLimitMinutes: number;
}

export interface EvaluationResult {
  globalScore: number;
  clarity: number;
  accuracy: number;
  compliance: number;
  objectionHandling: number;
  feedback: {
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  };
}

export interface Message {
  role: "user" | "model" | "system";
  content: string;
  timestamp: number;
}

// Core types for Synthetic Souls

export type ValidatorModel = 'GPT-4' | 'Claude' | 'Llama' | 'Gemini' | 'Mistral';

export type ValidatorStatus = 'idle' | 'thinking' | 'answered' | 'disagreed';

export interface Validator {
  id: number;
  model: ValidatorModel;
  status: ValidatorStatus;
  response?: string;
}

export type ConsensusState = 'idle' | 'thinking' | 'converged' | 'diverged';

export interface PersonalityDimension {
  name: string;
  value: number; // 0-100
}

export interface Soul {
  id: string;
  name: string;
  tagline: string;
  description: string;
  influences: string[];
  personality: PersonalityDimension[];
  createdAt: number;
  conversations: number;
  birthHash: string;
  validators: ValidatorModel[];
}

export interface Message {
  id: string;
  role: 'user' | 'soul' | 'system';
  content: string;
  timestamp: number;
  consensus?: ConsensusState;
  fragments?: string[]; // when validators disagree
}

export type AppScreen = 'limbo' | 'ritual' | 'session' | 'mirror';

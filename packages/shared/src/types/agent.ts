import type { TipologiaCodi, QuanEsFaCodi, NDScore } from '../constants/index.js';

/**
 * Input for the agent to process
 */
export interface AgentInput {
  text: string;
  sourceUrl?: string;
  sourceType: 'scraping' | 'email' | 'formulari' | 'manual';
  metadata?: Record<string, unknown>;
}

/**
 * Tipologia analysis from agent
 */
export interface AgentTipologiaResult {
  codi: TipologiaCodi;
  score: number;
  justificacio: string;
}

/**
 * ND readiness analysis from agent
 */
export interface AgentNDResult {
  score: NDScore;
  nivell: string;
  justificacio: string;
  indicadorsPositius: string[];
  indicadorsNegatius: string[];
  recomanacions: string[];
  confianca: number;
}

/**
 * Extracted activity data from agent
 */
export interface AgentActivitatResult {
  nom: string;
  descripcio?: string;
  tipologies: AgentTipologiaResult[];
  quanEsFa: QuanEsFaCodi;
  municipiId?: string;
  barriZona?: string;
  espai?: string;
  adreca?: string;
  edatMin?: number;
  edatMax?: number;
  edatText?: string;
  dies?: string;
  horari?: string;
  preu?: string;
  email?: string;
  telefon?: string;
  web?: string;
  tags?: string[];
}

/**
 * Complete agent output
 */
export interface AgentOutput {
  confianca: number;
  needsReview: boolean;
  reviewReasons: string[];
  activitat: AgentActivitatResult;
  nd: AgentNDResult;
  modelUsed: string;
  processingTimeMs: number;
  rawResponse?: unknown;
}

/**
 * Agent processing status
 */
export type AgentProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Agent task in the queue
 */
export interface AgentTask {
  id: string;
  input: AgentInput;
  status: AgentProcessingStatus;
  output?: AgentOutput;
  error?: string;
  createdAt: string;
  processedAt?: string;
  retryCount: number;
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  tipologiaThreshold: number;
  ndConfidenceThreshold: number;
  reviewThreshold: number;
}

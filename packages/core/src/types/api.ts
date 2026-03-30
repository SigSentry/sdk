import type { AnalysisStatus, AnalysisSeverity } from './analysis.js';

// --- API Envelope ---

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// --- API Request Types ---

export interface CreateAnalysisRequest {
  description: string;
  timeStart: string; // ISO 8601
  timeEnd: string; // ISO 8601
  metadata?: Record<string, string>;
  // screenshot is sent as multipart form data, not in JSON body
}

export interface ListAnalysesQuery {
  page?: number;
  limit?: number;
  status?: AnalysisStatus;
  severity?: AnalysisSeverity;
  fromDate?: string;
  toDate?: string;
}

export interface FollowUpRequest {
  question: string;
}

export interface FeedbackRequest {
  accuracy: 'correct' | 'partially_correct' | 'incorrect';
  comment?: string;
}

// --- SSE Events ---

export type SSEEvent =
  | { event: 'status'; data: { stage: AnalysisStage; detail?: string } }
  | { event: 'partial'; data: Partial<import('./analysis.js').AnalysisResult> }
  | {
      event: 'complete';
      data: { analysisId: string; result: import('./analysis.js').AnalysisResult };
    }
  | { event: 'error'; data: { code: string; message: string } };

export type AnalysisStage =
  | 'input_received'
  | 'image_processing'
  | 'logs_fetching'
  | 'logs_preprocessing'
  | 'ai_analyzing'
  | 'code_correlating'
  | 'complete'
  | 'failed';

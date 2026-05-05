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

/**
 * Public-facing analysis stage. Coarse, opaque values intended for SDK
 * consumers and customer dashboards. Internal services use a finer-grained
 * stage type (see InternalAnalysisStage) which is mapped to this before
 * emission over the wire.
 */
export type AnalysisStage =
  | 'received'
  | 'processing'
  | 'complete'
  | 'failed';

/**
 * INTERNAL — granular pipeline stages used by the orchestrator for
 * observability and debugging. Not exported on the public SDK surface
 * (see public.ts). Always mapped to the coarse AnalysisStage before being
 * sent to clients.
 */
export type InternalAnalysisStage =
  | 'input_received'
  | 'image_processing'
  | 'logs_fetching'
  | 'logs_preprocessing'
  | 'repo_context'
  | 'ai_analyzing'
  | 'code_correlating'
  | 'complete'
  | 'failed';

/**
 * Map a granular internal stage to the coarse public stage. Used at every
 * point that emits stage information to a client.
 */
export function toPublicStage(stage: InternalAnalysisStage): AnalysisStage {
  switch (stage) {
    case 'input_received':
      return 'received';
    case 'image_processing':
    case 'logs_fetching':
    case 'logs_preprocessing':
    case 'repo_context':
    case 'ai_analyzing':
    case 'code_correlating':
      return 'processing';
    case 'complete':
      return 'complete';
    case 'failed':
      return 'failed';
  }
}

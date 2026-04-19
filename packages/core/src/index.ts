/**
 * Public API surface for the published @sigsentry/core SDK package.
 *
 * This module re-exports only the types and utilities that SDK consumers
 * (React components, vanilla JS embed, third-party integrations) need.
 * Internal types (adapters, notifications, log source configs, repo configs)
 * are excluded to keep the public surface clean.
 *
 * Internal consumers (apps/api, other packages) import from the full
 * package index which exports everything.
 */

// Client
export { SigSentryClient } from './client/index.js';
export type { SigSentryClientConfig, AnalysisStreamCallbacks } from './client/index.js';

// Result type
export { ok, err } from './result.js';
export type { Result } from './result.js';

// Errors
export { ErrorCode } from './errors.js';

// Analysis types (what SDK consumers work with)
export type {
  AnalysisResult,
  AnalysisStatus,
  AnalysisSeverity,
  ServiceImpact,
  TimelineEntry,
  LogEvidence,
  SuggestedAction,
} from './types/analysis.js';

// API envelope types
export type {
  ApiResponse,
  ApiError,
  CreateAnalysisRequest,
  SSEEvent,
  AnalysisStage,
} from './types/api.js';

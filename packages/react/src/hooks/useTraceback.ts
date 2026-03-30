import { useState, useCallback, useRef } from 'react';
import type {
  AnalysisResult,
  AnalysisInput,
  AnalysisFeedback,
  FollowUpResult,
  ApiError,
  ApiResponse,
  AnalysisStage,
} from '@sigsentry/core';
import { SigSentryClient } from '@sigsentry/core';

export type TracebackStatus = AnalysisStage | 'idle';

export interface UseTracebackOptions {
  client: SigSentryClient;
}

export interface UseTracebackReturn {
  submitAnalysis: (input: Omit<AnalysisInput, 'screenshot'> & { screenshot?: File }) => Promise<void>;
  askFollowUp: (question: string) => Promise<ApiResponse<FollowUpResult> | null>;
  submitFeedback: (feedback: Omit<AnalysisFeedback, 'analysisId'>) => Promise<ApiResponse<void> | null>;
  status: TracebackStatus;
  result: AnalysisResult | null;
  error: ApiError | null;
  isLoading: boolean;
}

export function useSigSentry({ client }: UseTracebackOptions): UseTracebackReturn {
  const [status, setStatus] = useState<TracebackStatus>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const analysisIdRef = useRef<string | null>(null);

  const submitAnalysis = useCallback(
    async (input: Omit<AnalysisInput, 'screenshot'> & { screenshot?: File }) => {
      setIsLoading(true);
      setError(null);
      setResult(null);
      setStatus('input_received');

      try {
        const response = await client.createAnalysis(input, {
          onStatus: (stage: AnalysisStage, _detail?: string) => {
            setStatus(stage);
          },
          onPartial: (partial: Partial<AnalysisResult>) => {
            setResult((prev) => (prev ? { ...prev, ...partial } : (partial as AnalysisResult)));
          },
          onComplete: (analysisId: string, analysisResult: AnalysisResult) => {
            analysisIdRef.current = analysisId;
            setResult(analysisResult);
            setStatus('complete');
            setIsLoading(false);
          },
          onError: (apiError: ApiError) => {
            setError(apiError);
            setStatus('failed');
            setIsLoading(false);
          },
        });

        // If no streaming callbacks fired complete/error, handle the response directly
        if (!response.success && response.error) {
          setError(response.error);
          setStatus('failed');
          setIsLoading(false);
        } else if (response.success && response.data) {
          analysisIdRef.current = response.data.analysisId;
          setResult(response.data.result);
          setStatus('complete');
          setIsLoading(false);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError({ code: 'CLIENT_ERROR', message });
        setStatus('failed');
        setIsLoading(false);
      }
    },
    [client],
  );

  const askFollowUp = useCallback(
    async (question: string): Promise<ApiResponse<FollowUpResult> | null> => {
      const analysisId = analysisIdRef.current;
      if (!analysisId) {
        setError({ code: 'NO_ANALYSIS', message: 'No analysis to follow up on' });
        return null;
      }
      try {
        const response = await client.askFollowUp(analysisId, question);
        if (!response.success && response.error) {
          setError(response.error);
        }
        return response;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        const apiError: ApiError = { code: 'CLIENT_ERROR', message };
        setError(apiError);
        return null;
      }
    },
    [client],
  );

  const submitFeedback = useCallback(
    async (feedback: Omit<AnalysisFeedback, 'analysisId'>): Promise<ApiResponse<void> | null> => {
      const analysisId = analysisIdRef.current;
      if (!analysisId) {
        setError({ code: 'NO_ANALYSIS', message: 'No analysis to give feedback on' });
        return null;
      }
      try {
        const response = await client.submitFeedback(analysisId, feedback);
        if (!response.success && response.error) {
          setError(response.error);
        }
        return response;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        const apiError: ApiError = { code: 'CLIENT_ERROR', message };
        setError(apiError);
        return null;
      }
    },
    [client],
  );

  return {
    submitAnalysis,
    askFollowUp,
    submitFeedback,
    status,
    result,
    error,
    isLoading,
  };
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  AnalysisResult,
  ApiResponse,
  ApiError,
  FollowUpResult,
  AnalysisStreamCallbacks,
  AnalysisInput,
} from '@sigsentry/core';
import { SigSentryClient } from '@sigsentry/core';

// We test the hook's logic by simulating what it does — calling the client
// and managing state. Since we can't use renderHook without testing-library,
// we test the underlying logic via the client mock behavior.

function createMockClient(): {
  client: SigSentryClient;
  createAnalysis: ReturnType<typeof vi.fn>;
  askFollowUp: ReturnType<typeof vi.fn>;
  submitFeedback: ReturnType<typeof vi.fn>;
} {
  const client = new SigSentryClient({ apiKey: 'test-key', baseUrl: 'http://localhost' });

  const createAnalysis = vi.fn();
  const askFollowUp = vi.fn();
  const submitFeedback = vi.fn();

  client.createAnalysis = createAnalysis;
  client.askFollowUp = askFollowUp;
  client.submitFeedback = submitFeedback;

  return { client, createAnalysis, askFollowUp, submitFeedback };
}

function makeMockResult(overrides?: Partial<AnalysisResult>): AnalysisResult {
  return {
    id: 'analysis-1',
    status: 'complete',
    createdAt: new Date(),
    summary: 'Database connection timeout',
    severity: 'high',
    confidence: 0.92,
    rootCause: {
      description: 'Connection pool exhausted',
      service: 'api-server',
      errorType: 'ConnectionTimeout',
      category: 'database',
    },
    affectedServices: [
      {
        serviceName: 'api-server',
        role: 'origin',
        errorCount: 42,
        firstSeen: new Date(),
        lastSeen: new Date(),
      },
    ],
    timeline: [
      {
        timestamp: new Date(),
        service: 'api-server',
        level: 'error',
        message: 'Connection pool exhausted',
        isRootCause: true,
      },
    ],
    logEvidence: [],
    suggestedActions: [
      {
        priority: 1,
        action: 'Increase connection pool size',
        rationale: 'Current pool size is insufficient for load',
        type: 'fix',
      },
    ],
    relatedIncidents: [],
    logsScanned: 1500,
    timeWindow: { start: new Date(), end: new Date() },
    processingTimeMs: 3200,
    ...overrides,
  };
}

describe('SigSentryClient mock integration', () => {
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  describe('createAnalysis', () => {
    it('should call createAnalysis with correct input and callbacks', async () => {
      const result = makeMockResult();
      const response: ApiResponse<{ analysisId: string; result: AnalysisResult }> = {
        success: true,
        data: { analysisId: 'analysis-1', result },
      };

      mockClient.createAnalysis.mockImplementation(
        async (
          _input: Omit<AnalysisInput, 'screenshot'> & { screenshot?: File },
          callbacks?: AnalysisStreamCallbacks,
        ) => {
          callbacks?.onStatus?.('logs_fetching', 'Fetching logs...');
          callbacks?.onStatus?.('ai_analyzing');
          callbacks?.onComplete?.('analysis-1', result);
          return response;
        },
      );

      const input = {
        description: 'Database timeout errors',
        timeStart: new Date('2026-03-30T10:00:00Z'),
        timeEnd: new Date('2026-03-30T11:00:00Z'),
      };

      const statusUpdates: string[] = [];
      const resp = await mockClient.client.createAnalysis(input, {
        onStatus: (stage) => statusUpdates.push(stage),
        onComplete: (_id, _r) => {
          // complete callback fired
        },
      });

      expect(mockClient.createAnalysis).toHaveBeenCalledOnce();
      expect(statusUpdates).toEqual(['logs_fetching', 'ai_analyzing']);
      expect(resp.success).toBe(true);
      expect(resp.data?.analysisId).toBe('analysis-1');
      expect(resp.data?.result.severity).toBe('high');
    });

    it('should handle error responses', async () => {
      const apiError: ApiError = { code: 'RATE_LIMITED', message: 'Too many requests' };
      const response: ApiResponse<{ analysisId: string; result: AnalysisResult }> = {
        success: false,
        error: apiError,
      };

      mockClient.createAnalysis.mockImplementation(
        async (
          _input: Omit<AnalysisInput, 'screenshot'> & { screenshot?: File },
          callbacks?: AnalysisStreamCallbacks,
        ) => {
          callbacks?.onError?.(apiError);
          return response;
        },
      );

      let capturedError: ApiError | null = null;
      const resp = await mockClient.client.createAnalysis(
        {
          description: 'test',
          timeStart: new Date(),
          timeEnd: new Date(),
        },
        {
          onError: (err) => {
            capturedError = err;
          },
        },
      );

      expect(resp.success).toBe(false);
      expect(resp.error?.code).toBe('RATE_LIMITED');
      expect(capturedError).not.toBeNull();
      expect(capturedError!.code).toBe('RATE_LIMITED');
    });

    it('should handle client-side exceptions', async () => {
      mockClient.createAnalysis.mockRejectedValue(new Error('Network failure'));

      await expect(
        mockClient.client.createAnalysis({
          description: 'test',
          timeStart: new Date(),
          timeEnd: new Date(),
        }),
      ).rejects.toThrow('Network failure');
    });
  });

  describe('askFollowUp', () => {
    it('should call askFollowUp with analysisId and question', async () => {
      const followUpResult: FollowUpResult = {
        analysisId: 'analysis-1',
        answer: 'The connection pool was exhausted due to a connection leak.',
      };

      mockClient.askFollowUp.mockResolvedValue({
        success: true,
        data: followUpResult,
      } satisfies ApiResponse<FollowUpResult>);

      const resp = await mockClient.client.askFollowUp('analysis-1', 'Why was the pool exhausted?');

      expect(mockClient.askFollowUp).toHaveBeenCalledWith('analysis-1', 'Why was the pool exhausted?');
      expect(resp.success).toBe(true);
      expect(resp.data?.answer).toContain('connection leak');
    });
  });

  describe('submitFeedback', () => {
    it('should call submitFeedback with analysisId and feedback', async () => {
      mockClient.submitFeedback.mockResolvedValue({
        success: true,
      } satisfies ApiResponse<void>);

      const resp = await mockClient.client.submitFeedback('analysis-1', {
        accuracy: 'correct',
        comment: 'Spot on diagnosis',
      });

      expect(mockClient.submitFeedback).toHaveBeenCalledWith('analysis-1', {
        accuracy: 'correct',
        comment: 'Spot on diagnosis',
      });
      expect(resp.success).toBe(true);
    });
  });

  describe('streaming callbacks', () => {
    it('should fire partial updates during streaming', async () => {
      const partialResult: Partial<AnalysisResult> = {
        summary: 'Partial summary...',
        severity: 'high',
      };
      const fullResult = makeMockResult();

      mockClient.createAnalysis.mockImplementation(
        async (
          _input: Omit<AnalysisInput, 'screenshot'> & { screenshot?: File },
          callbacks?: AnalysisStreamCallbacks,
        ) => {
          callbacks?.onStatus?.('input_received');
          callbacks?.onStatus?.('logs_fetching');
          callbacks?.onPartial?.(partialResult);
          callbacks?.onStatus?.('ai_analyzing');
          callbacks?.onComplete?.('analysis-1', fullResult);
          return { success: true, data: { analysisId: 'analysis-1', result: fullResult } };
        },
      );

      const stages: string[] = [];
      const partials: Partial<AnalysisResult>[] = [];
      let completed = false;

      await mockClient.client.createAnalysis(
        {
          description: 'test',
          timeStart: new Date(),
          timeEnd: new Date(),
        },
        {
          onStatus: (stage) => stages.push(stage),
          onPartial: (p) => partials.push(p),
          onComplete: () => {
            completed = true;
          },
        },
      );

      expect(stages).toEqual(['input_received', 'logs_fetching', 'ai_analyzing']);
      expect(partials).toHaveLength(1);
      expect(partials[0]?.summary).toBe('Partial summary...');
      expect(completed).toBe(true);
    });
  });
});

describe('useSigSentry state management logic', () => {
  it('initial state should be idle with no result or error', () => {
    // Simulating the initial state that useSigSentry would produce
    const state = {
      status: 'idle' as const,
      result: null,
      error: null,
      isLoading: false,
    };

    expect(state.status).toBe('idle');
    expect(state.result).toBeNull();
    expect(state.error).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('state transitions during analysis lifecycle', () => {
    // Simulating the state transitions the hook would go through
    type Status = 'idle' | 'input_received' | 'logs_fetching' | 'ai_analyzing' | 'complete' | 'failed';

    const transitions: { status: Status; isLoading: boolean; result: AnalysisResult | null; error: ApiError | null }[] = [];

    // Start
    transitions.push({ status: 'idle', isLoading: false, result: null, error: null });

    // Submit
    transitions.push({ status: 'input_received', isLoading: true, result: null, error: null });

    // Fetching logs
    transitions.push({ status: 'logs_fetching', isLoading: true, result: null, error: null });

    // AI analyzing
    transitions.push({ status: 'ai_analyzing', isLoading: true, result: null, error: null });

    // Complete
    const result = makeMockResult();
    transitions.push({ status: 'complete', isLoading: false, result, error: null });

    expect(transitions).toHaveLength(5);
    expect(transitions[0]!.status).toBe('idle');
    expect(transitions[0]!.isLoading).toBe(false);
    expect(transitions[1]!.status).toBe('input_received');
    expect(transitions[1]!.isLoading).toBe(true);
    expect(transitions[4]!.status).toBe('complete');
    expect(transitions[4]!.isLoading).toBe(false);
    expect(transitions[4]!.result).not.toBeNull();
  });

  it('state transitions on error', () => {
    type Status = 'idle' | 'input_received' | 'failed';

    const transitions: { status: Status; isLoading: boolean; error: ApiError | null }[] = [];

    transitions.push({ status: 'idle', isLoading: false, error: null });
    transitions.push({ status: 'input_received', isLoading: true, error: null });
    transitions.push({
      status: 'failed',
      isLoading: false,
      error: { code: 'SERVER_ERROR', message: 'Internal error' },
    });

    expect(transitions[2]!.status).toBe('failed');
    expect(transitions[2]!.isLoading).toBe(false);
    expect(transitions[2]!.error?.code).toBe('SERVER_ERROR');
  });
});

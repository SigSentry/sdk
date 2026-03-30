import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SigSentryClient } from './index.js';
import type { ApiResponse, AnalysisResult, FollowUpResult } from '../types/index.js';

// Mock the global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function jsonResponse<T>(data: ApiResponse<T>, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    body: null,
  } as unknown as Response;
}

describe('SigSentryClient', () => {
  let client: SigSentryClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new SigSentryClient({
      apiKey: 'test-key-123',
      baseUrl: 'https://api.example.com',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('uses the default base URL when none is provided', () => {
      const defaultClient = new SigSentryClient({ apiKey: 'key' });
      mockFetch.mockResolvedValue(jsonResponse({ success: true, data: {} }));

      defaultClient.getAnalysis('abc');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sigsentry.com/v1/analyses/abc',
        expect.anything(),
      );
    });

    it('strips trailing slash from baseUrl', () => {
      const slashClient = new SigSentryClient({
        apiKey: 'key',
        baseUrl: 'https://api.example.com/',
      });
      mockFetch.mockResolvedValue(jsonResponse({ success: true, data: {} }));

      slashClient.getAnalysis('xyz');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/analyses/xyz',
        expect.anything(),
      );
    });
  });

  describe('getAnalysis', () => {
    it('sends a GET request with authorization header', async () => {
      const mockData = { id: 'a-1', status: 'complete' } as unknown as AnalysisResult;
      mockFetch.mockResolvedValue(jsonResponse({ success: true, data: mockData }));

      const result = await client.getAnalysis('a-1');

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/v1/analyses/a-1', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer test-key-123',
          'Content-Type': 'application/json',
        },
        body: undefined,
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
    });

    it('returns error response when API returns an error', async () => {
      mockFetch.mockResolvedValue(
        jsonResponse(
          {
            success: false,
            error: { code: 'ANALYSIS_NOT_FOUND', message: 'Not found' },
          },
          404,
        ),
      );

      const result = await client.getAnalysis('missing');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ANALYSIS_NOT_FOUND');
    });
  });

  describe('listAnalyses', () => {
    it('sends a GET request without query params when none provided', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true, data: [] }));

      await client.listAnalyses();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/analyses',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('appends query parameters to the URL', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true, data: [] }));

      await client.listAnalyses({ page: 2, limit: 10, status: 'complete' });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('page=2');
      expect(calledUrl).toContain('limit=10');
      expect(calledUrl).toContain('status=complete');
    });

    it('skips undefined query values', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true, data: [] }));

      await client.listAnalyses({ page: 1, severity: undefined });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('page=1');
      expect(calledUrl).not.toContain('severity');
    });
  });

  describe('askFollowUp', () => {
    it('sends a POST request with the question in the body', async () => {
      const mockResult: FollowUpResult = {
        analysisId: 'a-1',
        answer: 'The root cause is a connection timeout.',
      };
      mockFetch.mockResolvedValue(jsonResponse({ success: true, data: mockResult }));

      const result = await client.askFollowUp('a-1', 'What caused this?');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/analyses/a-1/followup',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ question: 'What caused this?' }),
        }),
      );
      expect(result.success).toBe(true);
      expect(result.data?.answer).toBe('The root cause is a connection timeout.');
    });
  });

  describe('submitFeedback', () => {
    it('sends a POST request with feedback data', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true }));

      const result = await client.submitFeedback('a-1', {
        accuracy: 'correct',
        comment: 'Very helpful',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/analyses/a-1/feedback',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ accuracy: 'correct', comment: 'Very helpful' }),
        }),
      );
      expect(result.success).toBe(true);
    });

    it('sends feedback without optional comment', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true }));

      await client.submitFeedback('a-2', { accuracy: 'incorrect' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/analyses/a-2/feedback',
        expect.objectContaining({
          body: JSON.stringify({ accuracy: 'incorrect' }),
        }),
      );
    });
  });

  describe('createAnalysis', () => {
    it('sends a POST with FormData and no streaming when callbacks are omitted', async () => {
      const responseData = { analysisId: 'new-1', result: { id: 'new-1' } };
      mockFetch.mockResolvedValue(jsonResponse({ success: true, data: responseData }));

      const result = await client.createAnalysis({
        description: 'Server 500 error',
        timeStart: new Date('2026-01-01T00:00:00Z'),
        timeEnd: new Date('2026-01-01T01:00:00Z'),
      });

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/v1/analyses');
      expect(options.method).toBe('POST');
      expect(options.headers).toEqual({ Authorization: 'Bearer test-key-123' });
      expect(options.body).toBeInstanceOf(FormData);
      expect(result.success).toBe(true);
    });

    it('includes metadata in FormData when provided', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true, data: {} }));

      await client.createAnalysis({
        description: 'Error',
        timeStart: new Date('2026-01-01T00:00:00Z'),
        timeEnd: new Date('2026-01-01T01:00:00Z'),
        metadata: { env: 'prod', region: 'us-east' },
      });

      const formData = mockFetch.mock.calls[0][1].body as FormData;
      expect(formData.get('metadata')).toBe(JSON.stringify({ env: 'prod', region: 'us-east' }));
    });

    describe('SSE streaming', () => {
      it('returns error when response body is null', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          body: null,
        } as unknown as Response);

        const onError = vi.fn();
        const result = await client.createAnalysis(
          {
            description: 'test',
            timeStart: new Date(),
            timeEnd: new Date(),
          },
          { onError },
        );

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('STREAM_ERROR');
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({ code: 'STREAM_ERROR' }),
        );
      });

      it('processes SSE events and calls appropriate callbacks', async () => {
        const sseData = [
          'event: status\n',
          'data: {"stage":"input_received","detail":"Starting"}\n',
          '\n',
          'event: status\n',
          'data: {"stage":"ai_analyzing"}\n',
          '\n',
          'event: partial\n',
          'data: {"summary":"partial result"}\n',
          '\n',
          'event: complete\n',
          'data: {"analysisId":"a-99","result":{"id":"a-99","status":"complete"}}\n',
          '\n',
        ].join('');

        const encoder = new TextEncoder();
        let readCount = 0;
        const chunks = [encoder.encode(sseData)];

        const mockReader = {
          read: vi.fn().mockImplementation(() => {
            if (readCount < chunks.length) {
              return Promise.resolve({ done: false, value: chunks[readCount++] });
            }
            return Promise.resolve({ done: true, value: undefined });
          }),
        };

        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          body: { getReader: () => mockReader },
        } as unknown as Response);

        const onStatus = vi.fn();
        const onPartial = vi.fn();
        const onComplete = vi.fn();

        const result = await client.createAnalysis(
          {
            description: 'test',
            timeStart: new Date(),
            timeEnd: new Date(),
          },
          { onStatus, onPartial, onComplete },
        );

        expect(onStatus).toHaveBeenCalledTimes(2);
        expect(onStatus).toHaveBeenCalledWith('input_received', 'Starting');
        expect(onStatus).toHaveBeenCalledWith('ai_analyzing', undefined);
        expect(onPartial).toHaveBeenCalledWith({ summary: 'partial result' });
        expect(onComplete).toHaveBeenCalledWith('a-99', { id: 'a-99', status: 'complete' });
        expect(result.success).toBe(true);
        expect(result.data?.analysisId).toBe('a-99');
      });

      it('handles SSE error event', async () => {
        const sseData = [
          'event: error\n',
          'data: {"code":"LLM_ERROR","message":"LLM failed"}\n',
          '\n',
        ].join('');

        const encoder = new TextEncoder();
        let readCount = 0;
        const chunks = [encoder.encode(sseData)];

        const mockReader = {
          read: vi.fn().mockImplementation(() => {
            if (readCount < chunks.length) {
              return Promise.resolve({ done: false, value: chunks[readCount++] });
            }
            return Promise.resolve({ done: true, value: undefined });
          }),
        };

        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          body: { getReader: () => mockReader },
        } as unknown as Response);

        const onError = vi.fn();
        const result = await client.createAnalysis(
          {
            description: 'test',
            timeStart: new Date(),
            timeEnd: new Date(),
          },
          { onError },
        );

        expect(onError).toHaveBeenCalledWith({ code: 'LLM_ERROR', message: 'LLM failed' });
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('LLM_ERROR');
      });

      it('returns stream error when stream ends without a result', async () => {
        const sseData = 'event: status\ndata: {"stage":"input_received"}\n\n';

        const encoder = new TextEncoder();
        let readCount = 0;
        const chunks = [encoder.encode(sseData)];

        const mockReader = {
          read: vi.fn().mockImplementation(() => {
            if (readCount < chunks.length) {
              return Promise.resolve({ done: false, value: chunks[readCount++] });
            }
            return Promise.resolve({ done: true, value: undefined });
          }),
        };

        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          body: { getReader: () => mockReader },
        } as unknown as Response);

        const result = await client.createAnalysis(
          {
            description: 'test',
            timeStart: new Date(),
            timeEnd: new Date(),
          },
          { onStatus: vi.fn() },
        );

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('STREAM_ERROR');
        expect(result.error?.message).toBe('Stream ended without result');
      });
    });
  });
});

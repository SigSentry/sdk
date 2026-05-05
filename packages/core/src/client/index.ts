import type {
  AnalysisResult,
  AnalysisInput,
  FollowUpResult,
  AnalysisFeedback,
  ApiResponse,
  ApiError,
  SSEEvent,
  AnalysisStage,
  ListAnalysesQuery,
} from '../types/index.js';

export interface SigSentryClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface AnalysisStreamCallbacks {
  onStatus?: (stage: AnalysisStage, detail?: string) => void;
  onPartial?: (partial: Partial<AnalysisResult>) => void;
  onComplete?: (analysisId: string, result: AnalysisResult) => void;
  onError?: (error: ApiError) => void;
}

export class SigSentryClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: SigSentryClientConfig) {
    // The SDK is a public surface — keys live in browsers, mobile apps, and
    // <script> embeds. Only ss_pub_* keys are safe to ship in those
    // contexts, so reject ss_secret_* and ss_org_* at construction time
    // with a clear hint instead of a silent 403 from the API.
    if (
      config.apiKey.startsWith('ss_secret_') ||
      config.apiKey.startsWith('ss_org_')
    ) {
      throw new Error(
        'SigSentry SDK requires a public key (ss_pub_*). ' +
          'Mint one from Project → SDK Keys in the dashboard. ' +
          'Secret keys (ss_secret_*, ss_org_*) are server-side only — ' +
          'shipping them to a browser exposes your account.',
      );
    }
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? 'https://api.sigsentry.com').replace(/\/$/, '');
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });

    return (await response.json()) as ApiResponse<T>;
  }

  async createAnalysis(
    input: Omit<AnalysisInput, 'screenshot'> & { screenshot?: File },
    callbacks?: AnalysisStreamCallbacks,
  ): Promise<ApiResponse<{ analysisId: string; result: AnalysisResult }>> {
    const formData = new FormData();
    formData.append('description', input.description);
    formData.append('timeStart', input.timeStart.toISOString());
    formData.append('timeEnd', input.timeEnd.toISOString());
    if (input.metadata) {
      formData.append('metadata', JSON.stringify(input.metadata));
    }
    if (input.screenshot) {
      formData.append('screenshot', input.screenshot);
    }

    const response = await fetch(`${this.baseUrl}/v1/analyses`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: formData,
    });

    if (!callbacks) {
      return (await response.json()) as ApiResponse<{
        analysisId: string;
        result: AnalysisResult;
      }>;
    }

    // SSE streaming
    return this.handleSSEStream(response, callbacks);
  }

  private async handleSSEStream(
    response: Response,
    callbacks: AnalysisStreamCallbacks,
  ): Promise<ApiResponse<{ analysisId: string; result: AnalysisResult }>> {
    const reader = response.body?.getReader();
    if (!reader) {
      const error: ApiError = { code: 'STREAM_ERROR', message: 'No response body' };
      callbacks.onError?.(error);
      return { success: false, error };
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult: ApiResponse<{ analysisId: string; result: AnalysisResult }> | undefined;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      let currentEvent = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ') && currentEvent) {
          const data: unknown = JSON.parse(line.slice(6));
          const event = { event: currentEvent, data } as SSEEvent;

          switch (event.event) {
            case 'status':
              callbacks.onStatus?.(event.data.stage, event.data.detail);
              break;
            case 'partial':
              callbacks.onPartial?.(event.data);
              break;
            case 'complete':
              callbacks.onComplete?.(event.data.analysisId, event.data.result);
              finalResult = { success: true, data: event.data };
              break;
            case 'error':
              callbacks.onError?.(event.data);
              finalResult = { success: false, error: event.data };
              break;
          }
          currentEvent = '';
        }
      }
    }

    return finalResult ?? { success: false, error: { code: 'STREAM_ERROR', message: 'Stream ended without result' } };
  }

  async getAnalysis(id: string): Promise<ApiResponse<AnalysisResult>> {
    return this.request<AnalysisResult>('GET', `/v1/analyses/${id}`);
  }

  async listAnalyses(query?: ListAnalysesQuery): Promise<ApiResponse<AnalysisResult[]>> {
    const params = new URLSearchParams();
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) params.set(key, String(value));
      }
    }
    const qs = params.toString();
    return this.request<AnalysisResult[]>('GET', `/v1/analyses${qs ? `?${qs}` : ''}`);
  }

  async askFollowUp(analysisId: string, question: string): Promise<ApiResponse<FollowUpResult>> {
    return this.request<FollowUpResult>('POST', `/v1/analyses/${analysisId}/followup`, {
      question,
    });
  }

  async submitFeedback(
    analysisId: string,
    feedback: Omit<AnalysisFeedback, 'analysisId'>,
  ): Promise<ApiResponse<void>> {
    return this.request<void>('POST', `/v1/analyses/${analysisId}/feedback`, feedback);
  }
}

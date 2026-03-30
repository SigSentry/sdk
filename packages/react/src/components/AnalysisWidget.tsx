import React, { useState, useCallback, useRef } from 'react';
import type { AnalysisResult, AnalysisStage, ApiError } from '@sigsentry/core';
import { useSigSentryContext } from './TracebackProvider.js';
import { useSigSentry, type TracebackStatus } from '../hooks/useTraceback.js';
import { AnalysisResultDisplay } from './AnalysisResult.js';

export type TimeRangeOption = '15m' | '30m' | '1h' | '4h' | '12h' | '24h';

export interface AnalysisWidgetProps {
  onAnalysisComplete?: (result: AnalysisResult) => void;
  onError?: (error: ApiError) => void;
  defaultTimeRange?: TimeRangeOption;
  showFollowUp?: boolean;
  className?: string;
}

const TIME_RANGE_OPTIONS: { value: TimeRangeOption; label: string; ms: number }[] = [
  { value: '15m', label: 'Last 15 minutes', ms: 15 * 60 * 1000 },
  { value: '30m', label: 'Last 30 minutes', ms: 30 * 60 * 1000 },
  { value: '1h', label: 'Last 1 hour', ms: 60 * 60 * 1000 },
  { value: '4h', label: 'Last 4 hours', ms: 4 * 60 * 60 * 1000 },
  { value: '12h', label: 'Last 12 hours', ms: 12 * 60 * 60 * 1000 },
  { value: '24h', label: 'Last 24 hours', ms: 24 * 60 * 60 * 1000 },
];

const STAGE_LABELS: Record<AnalysisStage, string> = {
  input_received: 'Input received',
  image_processing: 'Processing screenshot...',
  logs_fetching: 'Fetching logs...',
  logs_preprocessing: 'Pre-processing logs...',
  ai_analyzing: 'AI analyzing root cause...',
  code_correlating: 'Correlating with code changes...',
  complete: 'Analysis complete',
  failed: 'Analysis failed',
};

const styles = {
  container: {
    fontFamily: 'var(--sg-font-family)',
    color: 'var(--sg-color-text)',
    backgroundColor: 'var(--sg-color-bg)',
    borderRadius: 'var(--sg-border-radius)',
    border: '1px solid var(--sg-color-border)',
    padding: 'calc(var(--sg-spacing-unit) * 5)',
  } satisfies React.CSSProperties,
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'calc(var(--sg-spacing-unit) * 4)',
  } satisfies React.CSSProperties,
  label: {
    display: 'block',
    fontWeight: 600,
    fontSize: 'var(--sg-font-size-sm)',
    marginBottom: 'calc(var(--sg-spacing-unit) * 1)',
    color: 'var(--sg-color-text)',
  } satisfies React.CSSProperties,
  textarea: {
    width: '100%',
    minHeight: '100px',
    padding: 'calc(var(--sg-spacing-unit) * 3)',
    borderRadius: 'var(--sg-border-radius)',
    border: '1px solid var(--sg-color-border)',
    backgroundColor: 'var(--sg-color-bg)',
    color: 'var(--sg-color-text)',
    fontFamily: 'var(--sg-font-family)',
    fontSize: 'var(--sg-font-size-base)',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
  } satisfies React.CSSProperties,
  select: {
    width: '100%',
    padding: 'calc(var(--sg-spacing-unit) * 2) calc(var(--sg-spacing-unit) * 3)',
    borderRadius: 'var(--sg-border-radius)',
    border: '1px solid var(--sg-color-border)',
    backgroundColor: 'var(--sg-color-bg)',
    color: 'var(--sg-color-text)',
    fontFamily: 'var(--sg-font-family)',
    fontSize: 'var(--sg-font-size-base)',
    boxSizing: 'border-box' as const,
  } satisfies React.CSSProperties,
  button: {
    padding: 'calc(var(--sg-spacing-unit) * 3) calc(var(--sg-spacing-unit) * 5)',
    borderRadius: 'var(--sg-border-radius)',
    border: 'none',
    backgroundColor: 'var(--sg-color-primary)',
    color: '#ffffff',
    fontFamily: 'var(--sg-font-family)',
    fontSize: 'var(--sg-font-size-base)',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  } satisfies React.CSSProperties,
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  } satisfies React.CSSProperties,
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 'calc(var(--sg-spacing-unit) * 3)',
    padding: 'calc(var(--sg-spacing-unit) * 3)',
    backgroundColor: 'var(--sg-color-bg-secondary)',
    borderRadius: 'var(--sg-border-radius)',
    fontSize: 'var(--sg-font-size-sm)',
    color: 'var(--sg-color-text-secondary)',
  } satisfies React.CSSProperties,
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid var(--sg-color-border)',
    borderTopColor: 'var(--sg-color-primary)',
    borderRadius: '50%',
    animation: 'tb-spin 0.8s linear infinite',
    flexShrink: 0,
  } satisfies React.CSSProperties,
  errorBox: {
    padding: 'calc(var(--sg-spacing-unit) * 3)',
    backgroundColor: 'var(--sg-color-bg-secondary)',
    borderRadius: 'var(--sg-border-radius)',
    border: '1px solid var(--sg-color-critical)',
    color: 'var(--sg-color-critical)',
    fontSize: 'var(--sg-font-size-sm)',
  } satisfies React.CSSProperties,
  followUpContainer: {
    display: 'flex',
    gap: 'calc(var(--sg-spacing-unit) * 2)',
    marginTop: 'calc(var(--sg-spacing-unit) * 4)',
  } satisfies React.CSSProperties,
  followUpInput: {
    flex: 1,
    padding: 'calc(var(--sg-spacing-unit) * 2) calc(var(--sg-spacing-unit) * 3)',
    borderRadius: 'var(--sg-border-radius)',
    border: '1px solid var(--sg-color-border)',
    backgroundColor: 'var(--sg-color-bg)',
    color: 'var(--sg-color-text)',
    fontFamily: 'var(--sg-font-family)',
    fontSize: 'var(--sg-font-size-sm)',
    boxSizing: 'border-box' as const,
  } satisfies React.CSSProperties,
} as const;

// Inline keyframes for the spinner
const spinKeyframes = `
@keyframes tb-spin {
  to { transform: rotate(360deg); }
}
`;

function StatusDisplay({ status }: { status: TracebackStatus }): React.JSX.Element | null {
  if (status === 'idle' || status === 'complete') return null;

  const label = status === 'failed' ? 'Analysis failed' : STAGE_LABELS[status as AnalysisStage] ?? status;

  return (
    <div style={styles.statusBar}>
      {status !== 'failed' && <div style={styles.spinner} />}
      <span>{label}</span>
    </div>
  );
}

export function AnalysisWidget({
  onAnalysisComplete,
  onError,
  defaultTimeRange = '1h',
  showFollowUp = true,
  className,
}: AnalysisWidgetProps): React.JSX.Element {
  const { client } = useSigSentryContext();
  const { submitAnalysis, askFollowUp, status, result, error, isLoading } = useSigSentry({ client });

  const [description, setDescription] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRangeOption>(defaultTimeRange);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpAnswer, setFollowUpAnswer] = useState<string | null>(null);
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  const prevResultRef = useRef<AnalysisResult | null>(null);

  // Notify parent when analysis completes
  if (result && result !== prevResultRef.current && result.status === 'complete') {
    prevResultRef.current = result;
    onAnalysisComplete?.(result);
  }
  if (error && onError) {
    onError(error);
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!description.trim() || isLoading) return;

      const rangeOption = TIME_RANGE_OPTIONS.find((o) => o.value === timeRange);
      const ms = rangeOption?.ms ?? 60 * 60 * 1000;
      const now = new Date();
      const timeStart = new Date(now.getTime() - ms);

      setFollowUpAnswer(null);
      prevResultRef.current = null;

      await submitAnalysis({
        description: description.trim(),
        timeStart,
        timeEnd: now,
      });
    },
    [description, timeRange, isLoading, submitAnalysis],
  );

  const handleFollowUp = useCallback(async () => {
    if (!followUpQuestion.trim() || isFollowUpLoading) return;
    setIsFollowUpLoading(true);
    const response = await askFollowUp(followUpQuestion.trim());
    if (response?.success && response.data) {
      setFollowUpAnswer(response.data.answer);
      setFollowUpQuestion('');
    }
    setIsFollowUpLoading(false);
  }, [followUpQuestion, isFollowUpLoading, askFollowUp]);

  return (
    <div style={styles.container} className={className}>
      <style>{spinKeyframes}</style>

      {/* Input Form */}
      {status === 'idle' || status === 'failed' ? (
        <form style={styles.form} onSubmit={handleSubmit}>
          <div>
            <label style={styles.label} htmlFor="tb-description">
              Describe the error
            </label>
            <textarea
              id="tb-description"
              style={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened, paste error messages, or explain the symptoms..."
            />
          </div>

          <div>
            <label style={styles.label} htmlFor="tb-time-range">
              Time range
            </label>
            <select
              id="tb-time-range"
              style={styles.select}
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRangeOption)}
            >
              {TIME_RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div style={styles.errorBox}>
              {error.code}: {error.message}
            </div>
          )}

          <button
            type="submit"
            style={{
              ...styles.button,
              ...(isLoading || !description.trim() ? styles.buttonDisabled : {}),
            }}
            disabled={isLoading || !description.trim()}
          >
            Analyze
          </button>
        </form>
      ) : null}

      {/* Streaming Status */}
      {isLoading && <StatusDisplay status={status} />}

      {/* Result */}
      {result && status === 'complete' && (
        <>
          <AnalysisResultDisplay result={result} />

          {/* Follow-up */}
          {showFollowUp && (
            <div style={styles.followUpContainer}>
              <input
                type="text"
                style={styles.followUpInput}
                value={followUpQuestion}
                onChange={(e) => setFollowUpQuestion(e.target.value)}
                placeholder="Ask a follow-up question..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    void handleFollowUp();
                  }
                }}
              />
              <button
                type="button"
                style={{
                  ...styles.button,
                  fontSize: 'var(--sg-font-size-sm)',
                  padding: 'calc(var(--sg-spacing-unit) * 2) calc(var(--sg-spacing-unit) * 4)',
                  ...(isFollowUpLoading || !followUpQuestion.trim() ? styles.buttonDisabled : {}),
                }}
                disabled={isFollowUpLoading || !followUpQuestion.trim()}
                onClick={() => void handleFollowUp()}
              >
                {isFollowUpLoading ? 'Asking...' : 'Ask'}
              </button>
            </div>
          )}

          {followUpAnswer && (
            <div
              style={{
                marginTop: 'calc(var(--sg-spacing-unit) * 3)',
                padding: 'calc(var(--sg-spacing-unit) * 3)',
                backgroundColor: 'var(--sg-color-bg-secondary)',
                borderRadius: 'var(--sg-border-radius)',
                fontSize: 'var(--sg-font-size-sm)',
                lineHeight: 1.6,
              }}
            >
              {followUpAnswer}
            </div>
          )}
        </>
      )}
    </div>
  );
}

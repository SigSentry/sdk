import React, { useState, useCallback, useRef } from 'react';
import type { AnalysisResult, AnalysisStage, ApiError } from '@sigsentry/core';
import { useSigSentryContext } from './SigSentryProvider.js';
import { useSigSentry, type SigSentryStatus } from '../hooks/useSigSentry.js';
import { AnalysisResultDisplay } from './AnalysisResult.js';

export type TimeRangeOption = '15m' | '30m' | '1h' | '4h' | '12h' | '24h';

export interface AnalysisWidgetProps {
  onAnalysisComplete?: (result: AnalysisResult) => void;
  onError?: (error: ApiError) => void;
  defaultTimeRange?: TimeRangeOption;
  showFollowUp?: boolean;
  showScreenshot?: boolean;
  className?: string;
}

const TIME_RANGE_OPTIONS: { value: TimeRangeOption; label: string; ms: number }[] = [
  { value: '15m', label: 'Last 15 min', ms: 15 * 60 * 1000 },
  { value: '30m', label: 'Last 30 min', ms: 30 * 60 * 1000 },
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
  repo_context: 'Fetching repository context...',
  ai_analyzing: 'AI analyzing root cause...',
  code_correlating: 'Correlating with code changes...',
  complete: 'Analysis complete',
  failed: 'Analysis failed',
};

const spinKeyframes = `@keyframes tb-spin { to { transform: rotate(360deg); } }`;

const s = {
  container: {
    fontFamily: 'var(--tb-font-family)',
    color: 'var(--tb-color-text)',
    backgroundColor: 'var(--tb-color-bg)',
    borderRadius: 'var(--tb-border-radius)',
    border: '1px solid var(--tb-color-border)',
    padding: 20,
  } as React.CSSProperties,
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontWeight: 500,
    fontSize: 'var(--tb-font-size-sm)',
    marginBottom: 6,
    color: 'var(--tb-color-text-secondary)',
  } as React.CSSProperties,
  textarea: {
    width: '100%',
    minHeight: 90,
    padding: 10,
    borderRadius: 'var(--tb-border-radius)',
    border: '1px solid var(--tb-color-border)',
    backgroundColor: 'var(--tb-color-bg-secondary)',
    color: 'var(--tb-color-text)',
    fontFamily: 'var(--tb-font-family)',
    fontSize: 'var(--tb-font-size-sm)',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
    outline: 'none',
  } as React.CSSProperties,
  select: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 'var(--tb-border-radius)',
    border: '1px solid var(--tb-color-border)',
    backgroundColor: 'var(--tb-color-bg-secondary)',
    color: 'var(--tb-color-text)',
    fontFamily: 'var(--tb-font-family)',
    fontSize: 'var(--tb-font-size-sm)',
    boxSizing: 'border-box' as const,
    outline: 'none',
  } as React.CSSProperties,
  btn: {
    padding: '10px 20px',
    borderRadius: 'var(--tb-border-radius)',
    border: 'none',
    backgroundColor: 'var(--tb-color-primary)',
    color: 'var(--tb-color-primary-text)',
    fontFamily: 'var(--tb-font-family)',
    fontSize: 'var(--tb-font-size-sm)',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  } as React.CSSProperties,
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: 'var(--tb-color-bg-secondary)',
    borderRadius: 'var(--tb-border-radius)',
    fontSize: 'var(--tb-font-size-sm)',
    color: 'var(--tb-color-text-secondary)',
  } as React.CSSProperties,
  spinner: {
    width: 14,
    height: 14,
    border: '2px solid var(--tb-color-border)',
    borderTopColor: 'var(--tb-color-primary)',
    borderRadius: '50%',
    animation: 'tb-spin 0.8s linear infinite',
    flexShrink: 0,
  } as React.CSSProperties,
  errorBox: {
    padding: 10,
    backgroundColor: 'var(--tb-color-bg-secondary)',
    borderRadius: 'var(--tb-border-radius)',
    border: '1px solid var(--tb-color-critical)',
    color: 'var(--tb-color-critical)',
    fontSize: 'var(--tb-font-size-sm)',
  } as React.CSSProperties,
  upload: {
    border: '1px dashed var(--tb-color-border)',
    borderRadius: 'var(--tb-border-radius)',
    padding: '16px 12px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'border-color 0.15s',
    backgroundColor: 'var(--tb-color-bg-secondary)',
  } as React.CSSProperties,
  preview: {
    position: 'relative' as const,
    display: 'inline-block',
  } as React.CSSProperties,
  previewImg: {
    maxHeight: 120,
    borderRadius: 'var(--tb-border-radius)',
    border: '1px solid var(--tb-color-border)',
  } as React.CSSProperties,
  removeBtn: {
    position: 'absolute' as const,
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'var(--tb-color-critical)',
    color: 'var(--tb-color-primary-text)',
    fontSize: 12,
    lineHeight: 1,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  followUp: {
    display: 'flex',
    gap: 8,
    marginTop: 16,
  } as React.CSSProperties,
  followUpInput: {
    flex: 1,
    padding: '8px 10px',
    borderRadius: 'var(--tb-border-radius)',
    border: '1px solid var(--tb-color-border)',
    backgroundColor: 'var(--tb-color-bg-secondary)',
    color: 'var(--tb-color-text)',
    fontFamily: 'var(--tb-font-family)',
    fontSize: 'var(--tb-font-size-sm)',
    boxSizing: 'border-box' as const,
    outline: 'none',
  } as React.CSSProperties,
};

function StatusDisplay({ status }: { status: SigSentryStatus }): React.JSX.Element | null {
  if (status === 'idle' || status === 'complete') return null;
  const label = status === 'failed' ? 'Analysis failed' : STAGE_LABELS[status as AnalysisStage] ?? status;
  return (
    <div style={s.statusBar}>
      {status !== 'failed' && <div style={s.spinner} />}
      <span>{label}</span>
    </div>
  );
}

export function AnalysisWidget({
  onAnalysisComplete,
  onError,
  defaultTimeRange = '1h',
  showFollowUp = true,
  showScreenshot = true,
  className,
}: AnalysisWidgetProps): React.JSX.Element {
  const { client } = useSigSentryContext();
  const { submitAnalysis, askFollowUp, status, result, error, isLoading } = useSigSentry({ client });

  const [description, setDescription] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRangeOption>(defaultTimeRange);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpAnswer, setFollowUpAnswer] = useState<string | null>(null);
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  const prevResultRef = useRef<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (result && result !== prevResultRef.current && result.status === 'complete') {
    prevResultRef.current = result;
    onAnalysisComplete?.(result);
  }
  if (error && onError) onError(error);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setScreenshot(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setScreenshotPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setScreenshotPreview(null);
    }
  }

  function removeFile() {
    setScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!description.trim() || isLoading) return;

      const rangeOption = TIME_RANGE_OPTIONS.find((o) => o.value === timeRange);
      const ms = rangeOption?.ms ?? 60 * 60 * 1000;
      const now = new Date();

      setFollowUpAnswer(null);
      prevResultRef.current = null;

      await submitAnalysis({
        description: description.trim(),
        timeStart: new Date(now.getTime() - ms),
        timeEnd: now,
        screenshot: screenshot ?? undefined,
      });
    },
    [description, timeRange, isLoading, submitAnalysis, screenshot],
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

  const showForm = status === 'idle' || status === 'failed';

  return (
    <div style={s.container} className={className}>
      <style>{spinKeyframes}</style>

      {showForm && (
        <form style={s.form} onSubmit={handleSubmit}>
          <div>
            <label style={s.label}>Describe the error</label>
            <textarea
              style={s.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happened? Paste error messages, describe symptoms..."
            />
          </div>

          {showScreenshot && (
            <div>
              <label style={s.label}>Screenshot (optional)</label>
              {screenshotPreview ? (
                <div style={s.preview}>
                  <img src={screenshotPreview} alt="Screenshot" style={s.previewImg} />
                  <button type="button" style={s.removeBtn} onClick={removeFile}>&times;</button>
                </div>
              ) : (
                <div
                  style={s.upload}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => { if (e.key === 'Enter') fileInputRef.current?.click(); }}
                  role="button"
                  tabIndex={0}
                >
                  <p style={{ fontSize: 'var(--tb-font-size-sm)', color: 'var(--tb-color-text-secondary)', margin: 0 }}>
                    Click to upload
                  </p>
                  <p style={{ fontSize: 'var(--tb-font-size-xs)', color: 'var(--tb-color-text-muted, var(--tb-color-text-secondary))', marginTop: 4 }}>
                    PNG, JPG up to 5MB
                  </p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} style={{ display: 'none' }} />
            </div>
          )}

          <div>
            <label style={s.label}>Time range</label>
            <select style={s.select} value={timeRange} onChange={(e) => setTimeRange(e.target.value as TimeRangeOption)}>
              {TIME_RANGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <div style={s.errorBox}>{error.message}</div>
          )}

          <button
            type="submit"
            style={{ ...s.btn, ...(isLoading || !description.trim() ? { opacity: 0.5, cursor: 'not-allowed' } : {}) }}
            disabled={isLoading || !description.trim()}
          >
            Analyze
          </button>
        </form>
      )}

      {isLoading && <StatusDisplay status={status} />}

      {result && status === 'complete' && (
        <>
          <AnalysisResultDisplay result={result} />

          {showFollowUp && (
            <div style={s.followUp}>
              <input
                type="text"
                style={s.followUpInput}
                value={followUpQuestion}
                onChange={(e) => setFollowUpQuestion(e.target.value)}
                placeholder="Ask a follow-up question..."
                onKeyDown={(e) => { if (e.key === 'Enter') void handleFollowUp(); }}
              />
              <button
                type="button"
                style={{ ...s.btn, padding: '8px 16px', ...(isFollowUpLoading || !followUpQuestion.trim() ? { opacity: 0.5, cursor: 'not-allowed' } : {}) }}
                disabled={isFollowUpLoading || !followUpQuestion.trim()}
                onClick={() => void handleFollowUp()}
              >
                {isFollowUpLoading ? 'Asking...' : 'Ask'}
              </button>
            </div>
          )}

          {followUpAnswer && (
            <div style={{ marginTop: 12, padding: 12, backgroundColor: 'var(--tb-color-bg-secondary)', borderRadius: 'var(--tb-border-radius)', fontSize: 'var(--tb-font-size-sm)', lineHeight: 1.6 }}>
              {followUpAnswer}
            </div>
          )}
        </>
      )}
    </div>
  );
}

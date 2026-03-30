import React from 'react';
import type {
  AnalysisResult as AnalysisResultType,
  AnalysisSeverity,
  SuggestedAction,
  TimelineEntry,
  ServiceImpact,
} from '@sigsentry/core';

export interface AnalysisResultProps {
  result: AnalysisResultType;
  showRawLogs?: boolean;
  showCodeCorrelation?: boolean;
  className?: string;
}

const severityColors: Record<AnalysisSeverity, string> = {
  critical: 'var(--sg-color-critical)',
  high: 'var(--sg-color-high)',
  medium: 'var(--sg-color-medium)',
  low: 'var(--sg-color-low)',
  info: 'var(--sg-color-info)',
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
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 'calc(var(--sg-spacing-unit) * 3)',
    marginBottom: 'calc(var(--sg-spacing-unit) * 4)',
  } satisfies React.CSSProperties,
  severityBadge: (severity: AnalysisSeverity): React.CSSProperties => ({
    display: 'inline-block',
    padding: 'calc(var(--sg-spacing-unit) * 1) calc(var(--sg-spacing-unit) * 3)',
    borderRadius: 'calc(var(--sg-border-radius) / 2)',
    backgroundColor: severityColors[severity],
    color: '#ffffff',
    fontSize: 'var(--sg-font-size-sm)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }),
  section: {
    marginBottom: 'calc(var(--sg-spacing-unit) * 5)',
  } satisfies React.CSSProperties,
  sectionTitle: {
    fontSize: 'var(--sg-font-size-base)',
    fontWeight: 600,
    marginBottom: 'calc(var(--sg-spacing-unit) * 2)',
    color: 'var(--sg-color-text)',
  } satisfies React.CSSProperties,
  summary: {
    fontSize: 'var(--sg-font-size-lg)',
    lineHeight: 1.6,
    color: 'var(--sg-color-text)',
  } satisfies React.CSSProperties,
  confidence: {
    fontSize: 'var(--sg-font-size-sm)',
    color: 'var(--sg-color-text-secondary)',
  } satisfies React.CSSProperties,
  rootCauseBox: {
    backgroundColor: 'var(--sg-color-bg-secondary)',
    borderRadius: 'var(--sg-border-radius)',
    padding: 'calc(var(--sg-spacing-unit) * 4)',
    border: '1px solid var(--sg-color-border)',
  } satisfies React.CSSProperties,
  tag: {
    display: 'inline-block',
    padding: 'calc(var(--sg-spacing-unit) * 0.5) calc(var(--sg-spacing-unit) * 2)',
    borderRadius: 'calc(var(--sg-border-radius) / 2)',
    backgroundColor: 'var(--sg-color-bg-secondary)',
    border: '1px solid var(--sg-color-border)',
    fontSize: 'var(--sg-font-size-sm)',
    color: 'var(--sg-color-text-secondary)',
    marginRight: 'calc(var(--sg-spacing-unit) * 2)',
    marginBottom: 'calc(var(--sg-spacing-unit) * 1)',
  } satisfies React.CSSProperties,
  serviceList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  } satisfies React.CSSProperties,
  serviceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'calc(var(--sg-spacing-unit) * 2) 0',
    borderBottom: '1px solid var(--sg-color-border)',
    fontSize: 'var(--sg-font-size-sm)',
  } satisfies React.CSSProperties,
  timelineItem: (isRootCause: boolean): React.CSSProperties => ({
    padding: 'calc(var(--sg-spacing-unit) * 2) calc(var(--sg-spacing-unit) * 3)',
    borderLeft: `3px solid ${isRootCause ? 'var(--sg-color-critical)' : 'var(--sg-color-border)'}`,
    marginBottom: 'calc(var(--sg-spacing-unit) * 2)',
    backgroundColor: isRootCause ? 'var(--sg-color-bg-secondary)' : 'transparent',
    borderRadius: '0 var(--sg-border-radius) var(--sg-border-radius) 0',
  }),
  actionItem: {
    padding: 'calc(var(--sg-spacing-unit) * 3)',
    backgroundColor: 'var(--sg-color-bg-secondary)',
    borderRadius: 'var(--sg-border-radius)',
    marginBottom: 'calc(var(--sg-spacing-unit) * 2)',
    border: '1px solid var(--sg-color-border)',
  } satisfies React.CSSProperties,
  codeBlock: {
    backgroundColor: 'var(--sg-color-bg-secondary)',
    borderRadius: 'var(--sg-border-radius)',
    padding: 'calc(var(--sg-spacing-unit) * 3)',
    fontFamily: 'monospace',
    fontSize: 'var(--sg-font-size-sm)',
    overflowX: 'auto' as const,
    border: '1px solid var(--sg-color-border)',
  } satisfies React.CSSProperties,
  logEntry: {
    padding: 'calc(var(--sg-spacing-unit) * 2)',
    borderBottom: '1px solid var(--sg-color-border)',
    fontFamily: 'monospace',
    fontSize: 'var(--sg-font-size-sm)',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-all' as const,
  } satisfies React.CSSProperties,
} as const;

const actionTypeLabels: Record<SuggestedAction['type'], string> = {
  fix: 'Fix',
  investigate: 'Investigate',
  mitigate: 'Mitigate',
  escalate: 'Escalate',
};

function formatTimestamp(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return String(date);
  }
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function ServiceRow({ service }: { service: ServiceImpact }): React.JSX.Element {
  return (
    <li style={styles.serviceItem}>
      <span>
        <strong>{service.serviceName}</strong>{' '}
        <span style={styles.tag}>{service.role}</span>
      </span>
      <span style={{ color: 'var(--sg-color-text-secondary)' }}>
        {service.errorCount} errors
      </span>
    </li>
  );
}

function TimelineRow({ entry }: { entry: TimelineEntry }): React.JSX.Element {
  return (
    <div style={styles.timelineItem(entry.isRootCause)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'calc(var(--sg-spacing-unit) * 1)' }}>
        <span style={{ fontWeight: entry.isRootCause ? 700 : 400, fontSize: 'var(--sg-font-size-sm)' }}>
          {entry.service}
          {entry.isRootCause ? ' (root cause)' : ''}
        </span>
        <span style={{ fontSize: 'var(--sg-font-size-sm)', color: 'var(--sg-color-text-secondary)' }}>
          {formatTimestamp(entry.timestamp)}
        </span>
      </div>
      <div style={{ fontSize: 'var(--sg-font-size-sm)', color: 'var(--sg-color-text-secondary)' }}>
        {entry.message}
      </div>
    </div>
  );
}

function ActionRow({ action }: { action: SuggestedAction }): React.JSX.Element {
  return (
    <div style={styles.actionItem}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'calc(var(--sg-spacing-unit) * 1)' }}>
        <span style={{ fontWeight: 600, fontSize: 'var(--sg-font-size-sm)' }}>
          {action.action}
        </span>
        <span style={styles.tag}>{actionTypeLabels[action.type]}</span>
      </div>
      <div style={{ fontSize: 'var(--sg-font-size-sm)', color: 'var(--sg-color-text-secondary)' }}>
        {action.rationale}
      </div>
    </div>
  );
}

export function AnalysisResultDisplay({
  result,
  showRawLogs = false,
  showCodeCorrelation = true,
  className,
}: AnalysisResultProps): React.JSX.Element {
  return (
    <div style={styles.container} className={className}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.severityBadge(result.severity)}>{result.severity}</span>
        <span style={styles.confidence}>
          {Math.round(result.confidence * 100)}% confidence
        </span>
      </div>

      {/* Summary */}
      <div style={styles.section}>
        <p style={styles.summary}>{result.summary}</p>
      </div>

      {/* Root Cause */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Root Cause</h3>
        <div style={styles.rootCauseBox}>
          <p style={{ margin: '0 0 calc(var(--sg-spacing-unit) * 2) 0' }}>
            {result.rootCause.description}
          </p>
          <div>
            <span style={styles.tag}>{result.rootCause.service}</span>
            <span style={styles.tag}>{result.rootCause.errorType}</span>
            <span style={styles.tag}>{result.rootCause.category}</span>
          </div>
        </div>
      </div>

      {/* Affected Services */}
      {result.affectedServices.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Affected Services</h3>
          <ul style={styles.serviceList}>
            {result.affectedServices.map((service) => (
              <ServiceRow key={service.serviceName} service={service} />
            ))}
          </ul>
        </div>
      )}

      {/* Timeline */}
      {result.timeline.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Timeline</h3>
          {result.timeline.map((entry, index) => (
            <TimelineRow key={`${entry.service}-${index}`} entry={entry} />
          ))}
        </div>
      )}

      {/* Suggested Actions */}
      {result.suggestedActions.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Suggested Actions</h3>
          {result.suggestedActions
            .sort((a, b) => a.priority - b.priority)
            .map((action, index) => (
              <ActionRow key={`action-${index}`} action={action} />
            ))}
        </div>
      )}

      {/* Code Correlation */}
      {showCodeCorrelation && result.codeCorrelation?.available && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Code Correlation</h3>
          <div style={styles.rootCauseBox}>
            <p style={{ margin: '0 0 calc(var(--sg-spacing-unit) * 2) 0', fontWeight: 600 }}>
              {result.codeCorrelation.suspectedCode.repo} —{' '}
              {result.codeCorrelation.suspectedCode.filePath}
            </p>
            <p style={{ margin: '0 0 calc(var(--sg-spacing-unit) * 2) 0', fontSize: 'var(--sg-font-size-sm)', color: 'var(--sg-color-text-secondary)' }}>
              Function: {result.codeCorrelation.suspectedCode.functionName} (lines{' '}
              {result.codeCorrelation.suspectedCode.lineRange[0]}–
              {result.codeCorrelation.suspectedCode.lineRange[1]})
            </p>
            <pre style={styles.codeBlock}>
              {result.codeCorrelation.suspectedCode.snippet}
            </pre>
            {result.codeCorrelation.causalPR && (
              <div style={{ marginTop: 'calc(var(--sg-spacing-unit) * 3)' }}>
                <p style={{ fontWeight: 600, fontSize: 'var(--sg-font-size-sm)', margin: '0 0 calc(var(--sg-spacing-unit) * 1) 0' }}>
                  Suspected PR
                </p>
                <p style={{ fontSize: 'var(--sg-font-size-sm)', margin: 0 }}>
                  {result.codeCorrelation.causalPR.title} by{' '}
                  {result.codeCorrelation.causalPR.author.name} —{' '}
                  {Math.round(result.codeCorrelation.causalPR.confidence * 100)}% confidence
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Raw Logs */}
      {showRawLogs && result.logEvidence.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Log Evidence</h3>
          <div style={{ border: '1px solid var(--sg-color-border)', borderRadius: 'var(--sg-border-radius)', overflow: 'hidden' }}>
            {result.logEvidence
              .sort((a, b) => b.relevanceScore - a.relevanceScore)
              .map((log, index) => (
                <div key={`log-${index}`} style={styles.logEntry}>
                  <span style={{ color: 'var(--sg-color-text-secondary)', marginRight: 'calc(var(--sg-spacing-unit) * 2)' }}>
                    [{log.service}]
                  </span>
                  {log.raw}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Footer metadata */}
      <div style={{ fontSize: 'var(--sg-font-size-sm)', color: 'var(--sg-color-text-secondary)', borderTop: '1px solid var(--sg-color-border)', paddingTop: 'calc(var(--sg-spacing-unit) * 3)' }}>
        {result.logsScanned.toLocaleString()} logs scanned · Processed in{' '}
        {(result.processingTimeMs / 1000).toFixed(1)}s
      </div>
    </div>
  );
}

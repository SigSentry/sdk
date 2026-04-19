import { describe, it, expect } from 'vitest';
import type {
  ChannelType,
  NotificationPayload,
  ChannelConfig,
  SendResult,
  NotificationChannelAdapter,
  ChannelAdapterMetadata,
} from './notifications.js';
import { SEVERITY_ORDER, SEVERITY_COLORS, meetsThreshold } from './notifications.js';
import type { AnalysisSeverity } from './analysis.js';

describe('SEVERITY_ORDER', () => {
  it('assigns increasing numeric values from info to critical', () => {
    expect(SEVERITY_ORDER.info).toBeLessThan(SEVERITY_ORDER.low);
    expect(SEVERITY_ORDER.low).toBeLessThan(SEVERITY_ORDER.medium);
    expect(SEVERITY_ORDER.medium).toBeLessThan(SEVERITY_ORDER.high);
    expect(SEVERITY_ORDER.high).toBeLessThan(SEVERITY_ORDER.critical);
  });

  it('covers all five AnalysisSeverity values', () => {
    const severities: AnalysisSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];
    for (const s of severities) {
      expect(typeof SEVERITY_ORDER[s]).toBe('number');
    }
  });
});

describe('meetsThreshold', () => {
  it('returns true when severity equals threshold', () => {
    expect(meetsThreshold('high', 'high')).toBe(true);
    expect(meetsThreshold('critical', 'critical')).toBe(true);
    expect(meetsThreshold('info', 'info')).toBe(true);
  });

  it('returns true when severity is above threshold', () => {
    expect(meetsThreshold('critical', 'high')).toBe(true);
    expect(meetsThreshold('high', 'medium')).toBe(true);
    expect(meetsThreshold('medium', 'low')).toBe(true);
    expect(meetsThreshold('low', 'info')).toBe(true);
  });

  it('returns false when severity is below threshold', () => {
    expect(meetsThreshold('high', 'critical')).toBe(false);
    expect(meetsThreshold('low', 'high')).toBe(false);
    expect(meetsThreshold('info', 'medium')).toBe(false);
  });

  it('a channel with threshold high receives critical but not medium', () => {
    expect(meetsThreshold('critical', 'high')).toBe(true);
    expect(meetsThreshold('medium', 'high')).toBe(false);
  });
});

describe('SEVERITY_COLORS', () => {
  it('has a hex color and emoji for every severity', () => {
    const severities: AnalysisSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];
    for (const s of severities) {
      expect(SEVERITY_COLORS[s]).toHaveProperty('hex');
      expect(SEVERITY_COLORS[s]).toHaveProperty('emoji');
      expect(SEVERITY_COLORS[s].hex).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('ChannelType', () => {
  it('accepts all six channel type literals', () => {
    const types: ChannelType[] = ['slack', 'teams', 'discord', 'google_chat', 'webhook', 'email'];
    expect(types).toHaveLength(6);
  });
});

describe('NotificationPayload shape', () => {
  it('constructs a valid payload with required fields', () => {
    const payload: NotificationPayload = {
      analysisId: 'a1',
      projectSlug: 'my-project',
      projectName: 'My Project',
      severity: 'high',
      title: 'DB connection timeout',
      rootCause: 'PostgreSQL connection pool exhausted',
      affectedServices: ['api', 'worker'],
      timelineSummary: '12:00 - first error; 12:05 - cascading failures',
      portalUrl: 'https://app.sigsentry.io/projects/my-project/analyses/a1',
    };
    expect(payload.analysisId).toBe('a1');
    expect(payload.threadContext).toBeUndefined();
  });

  it('accepts optional threadContext', () => {
    const payload: NotificationPayload = {
      analysisId: 'a2',
      projectSlug: 'proj',
      projectName: 'Proj',
      severity: 'critical',
      title: 'OOM',
      rootCause: 'Memory leak in cache layer',
      affectedServices: ['cache'],
      timelineSummary: '',
      portalUrl: 'https://example.com',
      threadContext: { platformThreadId: 'T123', sessionId: 'S456' },
    };
    expect(payload.threadContext?.platformThreadId).toBe('T123');
  });
});

describe('ChannelConfig shape', () => {
  it('constructs a valid channel config', () => {
    const config: ChannelConfig = {
      id: 'ch-1',
      type: 'slack',
      name: 'Ops Slack',
      credentials: { webhookUrl: 'https://hooks.slack.com/xxx' },
      severityThreshold: 'high',
      isActive: true,
    };
    expect(config.type).toBe('slack');
    expect(config.isActive).toBe(true);
  });
});

describe('SendResult shape', () => {
  it('constructs a successful send result', () => {
    const result: SendResult = { success: true, messageId: 'msg-1', threadKey: 'thread-1' };
    expect(result.success).toBe(true);
  });

  it('constructs a failed send result with error fields', () => {
    const result: SendResult = {
      success: false,
      errorCode: 'rate_limited',
      errorMessage: 'Too many requests',
    };
    expect(result.errorCode).toBe('rate_limited');
  });
});

describe('NotificationChannelAdapter shape', () => {
  it('implements the adapter interface with metadata and send()', () => {
    const metadata: ChannelAdapterMetadata = {
      type: 'slack',
      displayName: 'Slack',
      supportsInbound: false,
      supportsThreading: true,
      credentialFields: [
        { key: 'webhookUrl', label: 'Webhook URL', type: 'password', required: true, placeholder: 'https://hooks.slack.com/...' },
      ],
    };

    const adapter: NotificationChannelAdapter = {
      metadata,
      send: async (_config, _payload) => ({ success: true, messageId: 'x' }),
    };

    expect(adapter.metadata.type).toBe('slack');
    expect(adapter.metadata.supportsThreading).toBe(true);
    expect(typeof adapter.send).toBe('function');
  });
});

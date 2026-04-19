import type { AnalysisSeverity } from './analysis.js';

export type RuleType = 'error_count' | 'error_rate' | 'pattern' | 'spike';
export type RuleAction = 'notify_only' | 'auto_analyze';
export type IntervalMode = 'fixed' | 'random';

export interface MonitoringRule {
  id: string;
  tenantId: string;
  projectId: string;
  name: string;
  isEnabled: boolean;

  // Schedule
  intervalMode: IntervalMode;
  intervalMinutes: number;
  avgChecksPerDay: number | null;
  lookbackMinutes: number;

  // Detection
  ruleType: RuleType;
  errorCountThreshold: number | null;
  errorRateThreshold: number | null;
  minErrorCount: number;
  patterns: Array<{ label: string; regex: string }>;
  spikeMultiplier: number;

  // Alert behavior
  action: RuleAction;
  cooldownMinutes: number;
  dailyAlertCap: number;
  channelOverrideIds: string[] | null;
}

export interface EvaluationResult {
  passed: boolean;
  errorCount: number;
  totalLogCount: number;
  errorRate: number;
  matchedPatterns: string[];
  spikeRatio: number | null;
  severity: AnalysisSeverity;
  summary: string;
}

export interface MonitoringAlert {
  id: string;
  evaluationId: string;
  ruleId: string;
  projectId: string;
  tenantId: string;
  severity: AnalysisSeverity;
  summary: string;
  analysisSessionId: string | null;
  channelsNotified: string[];
  createdAt: Date;
}

export const PATTERN_PRESETS = [
  { label: 'Connection errors', regex: 'ECONNREFUSED|ECONNRESET|ETIMEDOUT|EHOSTUNREACH' },
  { label: 'Out of memory', regex: 'OOM|OutOfMemory|heap out of memory|ENOMEM' },
  { label: 'Database errors', regex: 'deadlock|connection pool|too many connections|SQLSTATE' },
  { label: 'Authentication failures', regex: '401|403|unauthorized|forbidden|invalid.?token' },
  { label: 'Timeout errors', regex: 'timeout|timed out|request.*aborted|ESOCKETTIMEDOUT' },
  { label: 'Crash / Fatal', regex: 'FATAL|panic|segfault|SIGSEGV|unhandled.*rejection' },
  { label: 'Rate limiting', regex: '429|rate.?limit|too many requests|throttl' },
  { label: 'Disk / Storage', regex: 'no space left|ENOSPC|disk full|storage.*quota' },
] as const;

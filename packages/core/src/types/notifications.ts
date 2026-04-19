import type { AnalysisSeverity } from './analysis.js';

export type ChannelType = 'slack' | 'teams' | 'discord' | 'google_chat' | 'webhook' | 'email';

export interface NotificationPayload {
  analysisId: string;
  projectSlug: string;
  projectName: string;
  severity: AnalysisSeverity;
  title: string;
  rootCause: string;
  affectedServices: string[];
  timelineSummary: string;
  portalUrl: string;
  threadContext?: { platformThreadId: string; sessionId: string };
}

export interface ChannelConfig {
  id: string;
  type: ChannelType;
  name: string;
  credentials: Record<string, unknown>;
  severityThreshold: AnalysisSeverity;
  isActive: boolean;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  threadKey?: string;
  errorCode?: 'rate_limited' | 'invalid_credentials' | 'not_found' | 'transient' | 'permanent';
  errorMessage?: string;
}

export interface NotificationChannelAdapter {
  metadata: ChannelAdapterMetadata;
  send(config: ChannelConfig, payload: NotificationPayload): Promise<SendResult>;
  // Inbound (2b) — optional per adapter
  verifySignature?(rawBody: string, headers: Record<string, string>, secret: string): boolean;
  normalizeCommand?(rawPayload: unknown): InboundCommandRequest | null;
  normalizeThreadReply?(rawPayload: unknown): InboundThreadReply | null;
  formatAck?(response: CommandResponse): unknown; // platform-native ack format
  postToThread?(config: ChannelConfig, threadKey: string, text: string): Promise<SendResult>;
}

export interface ChannelAdapterMetadata {
  type: ChannelType;
  displayName: string;
  supportsInbound: boolean;
  supportsThreading: boolean;
  credentialFields: Array<{
    key: string;
    label: string;
    type: 'text' | 'password' | 'email';
    required: boolean;
    placeholder?: string;
  }>;
}

/**
 * Severity ordering for threshold comparisons.
 * A channel with threshold 'high' receives notifications
 * for severity >= high (i.e., high and critical).
 */
export const SEVERITY_ORDER: Record<AnalysisSeverity, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function meetsThreshold(severity: AnalysisSeverity, threshold: AnalysisSeverity): boolean {
  return SEVERITY_ORDER[severity] >= SEVERITY_ORDER[threshold];
}

export const SEVERITY_COLORS: Record<AnalysisSeverity, { hex: string; emoji: string }> = {
  critical: { hex: '#991b1b', emoji: '🚨' },
  high: { hex: '#dc2626', emoji: '🔴' },
  medium: { hex: '#eab308', emoji: '🟡' },
  low: { hex: '#0891b2', emoji: '🔵' },
  info: { hex: '#6b7280', emoji: 'ℹ️' },
};

// --- Inbound (2b) ---

export type ChatPlatform = 'slack' | 'teams' | 'discord' | 'google_chat';

export interface InboundCommandRequest {
  platform: ChatPlatform;
  workspaceId: string;
  channelId: string;
  userId: string;
  userEmail?: string;
  commandText: string;
  responseUrl?: string; // Slack delayed response URL
}

export interface CommandResponse {
  ackText: string;
  ackVisibility: 'ephemeral' | 'in_channel';
}

export interface InboundThreadReply {
  platform: ChatPlatform;
  workspaceId: string;
  channelId: string;
  threadKey: string;
  userId: string;
  userEmail?: string;
  messageText: string;
}

export interface ParsedAnalyzeCommand {
  subcommand: 'analyze';
  description: string;
  timeStart: Date;
  timeEnd: Date;
  projectOverride?: string; // --project=slug
}

export interface ParsedLinkProjectCommand {
  subcommand: 'link-project';
  projectSlug: string;
}

export interface ParsedFollowupCommand {
  subcommand: 'followup';
  question: string;
  sessionId?: string;
}

export interface ParsedHelpCommand {
  subcommand: 'help';
}

export type ParsedCommand =
  | ParsedAnalyzeCommand
  | ParsedLinkProjectCommand
  | ParsedFollowupCommand
  | ParsedHelpCommand;

// packages/core/src/types/support-desk.ts
import type { AnalysisSeverity } from './analysis.js';

export type SupportPlatform = 'zendesk' | 'freshdesk' | 'intercom';
export type ResultPostingMode = 'internal' | 'public' | 'both';

export interface TicketContext {
  platformTicketId: string;
  platformTicketUrl: string;
  subject: string;
  description: string;
  requesterEmail?: string;
  requesterName?: string;
  tags?: string[];
  priority?: string;
  createdAt: Date;
  customFields?: Record<string, unknown>;
}

export interface TriageResult {
  severity: AnalysisSeverity;
  affectedService: string | null;
  suggestedProjectId: string | null;
  suggestedTimeWindowStart: Date;
  suggestedTimeWindowEnd: Date;
  descriptionSummary: string;
  keywords: string[];
  confidence: number;
  model: 'haiku' | 'heuristic';
}

export interface SupportDeskAdapter {
  metadata: SupportDeskMetadata;
  verifyWebhook(rawBody: string, headers: Record<string, string>, secret: string): boolean;
  normalizeTicket(rawPayload: unknown): TicketContext | null;
  postNote(credentials: Record<string, unknown>, ticketId: string, content: string, isPublic: boolean): Promise<void>;
  updateFields(credentials: Record<string, unknown>, ticketId: string, fields: Record<string, unknown>): Promise<void>;
  registerWebhook(credentials: Record<string, unknown>, targetUrl: string): Promise<{ webhookId: string }>;
  removeWebhook(credentials: Record<string, unknown>, webhookId: string): Promise<void>;
  fetchTicket(credentials: Record<string, unknown>, ticketId: string): Promise<TicketContext>;
}

export interface SupportDeskMetadata {
  platform: SupportPlatform;
  displayName: string;
  credentialFields: Array<{
    key: string;
    label: string;
    type: 'text' | 'password';
    required: boolean;
    placeholder?: string;
  }>;
}

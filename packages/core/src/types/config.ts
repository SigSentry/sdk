import type { LogSourceType, RepoPlatform, ServiceRepoMapping, ConnectionResult } from './adapters.js';

export interface Tenant {
  id: string;
  name: string;
  plan: PricingTier;
  createdAt: Date;
  settings: TenantSettings;
}

export type PricingTier = 'starter' | 'team' | 'business' | 'enterprise';

export interface TenantSettings {
  timeBufferMinutes: number;
  maxAnalysesPerMonth: number;
  enabledFeatures: FeatureFlag[];
  defaultLogSources: string[];
}

export type FeatureFlag =
  | 'code_correlation'
  | 'pattern_memory'
  | 'slack_integration'
  | 'teams_integration'
  | 'sso'
  | 'custom_llm'
  | 'self_hosted'
  | 'audit_logs';

export interface ApiKeyRecord {
  id: string;
  tenantId: string;
  keyHash: string;
  prefix: string;
  name: string;
  permissions: ApiKeyPermission[];
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  revoked: boolean;
}

// Customer-facing API key permissions. `apikey:write` is intentionally
// not in this list — API key CRUD is dashboard-only (JWT-authenticated),
// so customer-minted keys can never grant or revoke other keys.
// Internal role-based permissions (used in JWT permission resolution) may
// include additional scopes like `apikey:write` and `team:manage`.
export type ApiKeyPermission =
  | 'analysis:create'
  | 'analysis:read'
  | 'config:read'
  | 'config:write'
  | 'admin';

export interface LogSourceConfigRecord {
  id: string;
  tenantId: string;
  type: LogSourceType;
  name: string;
  credentials: string; // encrypted JSON string
  sources: string[];
  isActive: boolean;
  lastTestedAt?: Date;
  lastTestResult?: ConnectionResult;
  createdAt: Date;
}

export interface RepoConfigRecord {
  id: string;
  tenantId: string;
  platform: RepoPlatform;
  credentials: string; // encrypted JSON string
  repositories: string[];
  serviceMappings: ServiceRepoMapping[];
  lookbackDays: number;
  isActive: boolean;
  createdAt: Date;
}

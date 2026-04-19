// --- Log Source Adapter ---

export interface LogSourceAdapter {
  testConnection(config: LogSourceConfig): Promise<ConnectionResult>;
  queryLogs(params: LogQuery): Promise<LogResult>;
  listSources(config: LogSourceConfig): Promise<LogSourceInfo[]>;
  metadata: AdapterMetadata;
}

export interface LogSourceConfig {
  type: LogSourceType;
  credentials: Record<string, string>;
  region?: string;
  settings?: Record<string, unknown>;
}

export type LogSourceType =
  | 'cloudwatch'
  | 'datadog'
  | 'elastic'
  | 'loki'
  | 'splunk'
  | 'gcp_logging';

export interface LogQuery {
  timeRange: { start: Date; end: Date };
  sources: string[];
  filters?: LogFilter[];
  limit?: number;
  cursor?: string;
}

export interface LogFilter {
  field: string;
  operator: 'eq' | 'contains' | 'regex' | 'gt' | 'lt';
  value: string;
}

export interface LogResult {
  entries: LogEntry[];
  totalCount: number;
  nextCursor?: string;
  truncated: boolean;
}

export interface LogEntry {
  timestamp: Date;
  level: string;
  service: string;
  message: string;
  raw: string;
  metadata?: Record<string, string>;
}

export interface LogSourceInfo {
  id: string;
  name: string;
  type: string;
}

export interface ConnectionResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export interface AdapterMetadata {
  type: LogSourceType;
  displayName: string;
  description: string;
  requiredCredentials: CredentialField[];
  supportedFeatures: string[];
}

export interface CredentialField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'select';
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
}

// --- Code Repository Adapter ---

export interface CodeRepoAdapter {
  testConnection(config: RepoConfig): Promise<ConnectionResult>;
  getFileContent(params: {
    repo: string;
    path: string;
    ref?: string;
  }): Promise<FileContent>;
  getBlame(params: {
    repo: string;
    path: string;
    ref?: string;
    lineStart?: number;
    lineEnd?: number;
  }): Promise<BlameResult[]>;
  findPullRequests(params: {
    repo: string;
    paths: string[];
    mergedAfter: Date;
    mergedBefore: Date;
  }): Promise<PullRequestInfo[]>;
  getPullRequestDiff(params: {
    repo: string;
    prId: string;
    filePaths?: string[];
  }): Promise<DiffResult>;
  listRepositories(config: RepoConfig): Promise<RepositoryInfo[]>;
}

export interface RepoConfig {
  platform: RepoPlatform;
  credentials: Record<string, string>;
  baseUrl?: string;
}

export type RepoPlatform = 'github' | 'gitlab' | 'bitbucket' | 'azure_devops';

export interface FileContent {
  path: string;
  content: string;
  encoding: 'utf8' | 'base64';
  sha: string;
  size: number;
}

export interface BlameResult {
  lineStart: number;
  lineEnd: number;
  commit: {
    sha: string;
    author: string;
    date: Date;
    message: string;
  };
}

export interface PullRequestInfo {
  id: string;
  title: string;
  author: { name: string; username: string; avatar?: string };
  mergedAt: Date;
  url: string;
  filesChanged: string[];
  additions: number;
  deletions: number;
}

export interface DiffResult {
  prId: string;
  files: FileDiff[];
}

export interface FileDiff {
  path: string;
  additions: number;
  deletions: number;
  patch: string;
}

export interface RepositoryInfo {
  id: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  url: string;
  private: boolean;
}

export interface ServiceRepoMapping {
  serviceName: string;
  repo: string;
  pathPrefix: string;
  defaultBranch: string;
}

// --- Repo Context (analysis pipeline input) ---

export interface PrefetchedFile {
  repo: string;
  path: string;
  sha: string;
  snippet: string;
  referencedLines: number[];
}

export interface RecentPullRequest {
  repo: string;
  id: string;
  title: string;
  author: string;
  mergedAt: Date;
  url: string;
}

export interface RepoToolCallbacks {
  getFileContent: (params: { repo: string; path: string; ref?: string }) => Promise<string>;
  getPullRequestDiff: (params: { repo: string; prId: string }) => Promise<string>;
}

export interface RepoContext {
  prefetchedFiles: PrefetchedFile[];
  recentPRs: RecentPullRequest[];
  unresolvedServices: string[];
  toolCallbacks?: RepoToolCallbacks;
}

export const EMPTY_REPO_CONTEXT: RepoContext = {
  prefetchedFiles: [],
  recentPRs: [],
  unresolvedServices: [],
};

// --- Repo Credentials (discriminated union stored encrypted) ---

export type RepoCredentials =
  | { authType: 'pat'; token: string; baseUrl?: string }
  | { authType: 'github_app'; installationId: string }
  | { authType: 'gitlab_oauth'; accessToken: string; refreshToken: string; expiresAt: number; baseUrl?: string }
  | { authType: 'bitbucket_oauth'; accessToken: string; refreshToken: string; expiresAt: number; workspace: string };

export type RepoAuthType = RepoCredentials['authType'];

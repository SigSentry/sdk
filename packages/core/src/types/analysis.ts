export type AnalysisSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AnalysisStatus = 'pending' | 'processing' | 'complete' | 'partial' | 'failed';

export interface AnalysisInput {
  screenshot?: File | Buffer;
  description: string;
  timeStart: Date;
  timeEnd: Date;
  metadata?: Record<string, string>;
}

export interface AnalysisResult {
  id: string;
  status: AnalysisStatus;
  createdAt: Date;

  summary: string;
  severity: AnalysisSeverity;
  confidence: number;

  rootCause: {
    description: string;
    service: string;
    errorType: string;
    category: ErrorCategory;
  };

  affectedServices: ServiceImpact[];
  timeline: TimelineEntry[];
  logEvidence: LogEvidence[];

  codeCorrelation?: {
    available: boolean;
    suspectedCode: {
      repo: string;
      filePath: string;
      lineRange: [number, number];
      functionName: string;
      snippet: string;
    };
    causalPR?: {
      id: string;
      title: string;
      author: { name: string; username: string };
      mergedAt: Date;
      url: string;
      confidence: number;
      explanation: string;
    };
    recentCommits: CommitRef[];
  };

  suggestedActions: SuggestedAction[];
  relatedIncidents: string[];

  logsScanned: number;
  timeWindow: { start: Date; end: Date };
  processingTimeMs: number;
}

export type ErrorCategory =
  | 'authentication'
  | 'authorization'
  | 'database'
  | 'network'
  | 'timeout'
  | 'rate_limiting'
  | 'validation'
  | 'null_reference'
  | 'configuration'
  | 'dependency'
  | 'memory'
  | 'disk'
  | 'unknown';

export interface ServiceImpact {
  serviceName: string;
  role: 'origin' | 'propagator' | 'affected';
  errorCount: number;
  firstSeen: Date;
  lastSeen: Date;
}

export interface TimelineEntry {
  timestamp: Date;
  service: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  isRootCause: boolean;
}

export interface LogEvidence {
  timestamp: Date;
  service: string;
  level: string;
  message: string;
  raw: string;
  relevanceScore: number;
}

export interface SuggestedAction {
  priority: number;
  action: string;
  rationale: string;
  type: 'fix' | 'investigate' | 'mitigate' | 'escalate';
}

export interface CommitRef {
  sha: string;
  message: string;
  author: string;
  date: Date;
  filesChanged: string[];
}

export interface FollowUpInput {
  analysisId: string;
  question: string;
}

export interface FollowUpResult {
  analysisId: string;
  answer: string;
  additionalEvidence?: LogEvidence[];
  updatedSuggestedActions?: SuggestedAction[];
}

export interface AnalysisFeedback {
  analysisId: string;
  accuracy: 'correct' | 'partially_correct' | 'incorrect';
  comment?: string;
}

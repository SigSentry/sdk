# @sigsentry/core

TypeScript API client and shared types for [SigSentry](https://sigsentry.dev) — AI-powered log analysis.

## Installation

```bash
npm install @sigsentry/core
```

## Quick Start

```typescript
import { SigSentryClient } from '@sigsentry/core';

const client = new SigSentryClient({
  apiKey: 'your-api-key',
});

// Create an analysis
const result = await client.createAnalysis({
  description: 'Users getting 500 errors on checkout',
  timeStart: new Date('2024-01-15T10:00:00Z'),
  timeEnd: new Date('2024-01-15T11:00:00Z'),
});

// Stream results in real-time
await client.createAnalysis(input, {
  onStatus: (stage) => console.log(`Stage: ${stage}`),
  onPartial: (partial) => console.log(`Severity: ${partial.severity}`),
  onComplete: (id, result) => console.log(`Done: ${result.summary}`),
});
```

## What's Included

- **SigSentryClient** — Framework-agnostic API client with SSE streaming
- **TypeScript types** — AnalysisResult, AnalysisInput, ApiResponse, and more
- **Result<T, E>** — Type-safe error handling without exceptions
- **ErrorCode** — Standardized error codes

## For React

See [@sigsentry/react](https://www.npmjs.com/package/@sigsentry/react) for drop-in React components.

## License

MIT

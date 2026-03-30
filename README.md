# SigSentry SDK

Official SDKs for [SigSentry](https://sigsentry.dev) — AI-powered log analysis that turns error reports into instant root-cause diagnoses.

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| [`@sigsentry/core`](./packages/core) | TypeScript API client, types, and utilities | [![npm](https://img.shields.io/npm/v/@sigsentry/core)](https://www.npmjs.com/package/@sigsentry/core) |
| [`@sigsentry/react`](./packages/react) | Drop-in React components and hooks | [![npm](https://img.shields.io/npm/v/@sigsentry/react)](https://www.npmjs.com/package/@sigsentry/react) |

## Quick Start

### React

```bash
npm install @sigsentry/react
```

```tsx
import { SigSentryProvider, AnalysisWidget } from '@sigsentry/react';

function App() {
  return (
    <SigSentryProvider apiKey="your-api-key">
      <AnalysisWidget onAnalysisComplete={(result) => console.log(result)} />
    </SigSentryProvider>
  );
}
```

### Vanilla TypeScript / Node.js

```bash
npm install @sigsentry/core
```

```typescript
import { SigSentryClient } from '@sigsentry/core';

const client = new SigSentryClient({ apiKey: 'your-api-key' });

const result = await client.createAnalysis({
  description: 'Users getting 500 errors on checkout',
  timeStart: new Date('2024-01-15T10:00:00Z'),
  timeEnd: new Date('2024-01-15T11:00:00Z'),
});
```

## Development

```bash
pnpm install
pnpm build
pnpm test
```

## License

MIT

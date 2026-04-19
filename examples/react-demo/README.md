# SigSentry React SDK — Example App

A minimal example showing three ways to integrate SigSentry into a React application.

## Quick Start

```bash
# From the monorepo root
pnpm install
pnpm --filter sigsentry-react-demo dev
```

Open http://localhost:5173 and explore the three integration patterns.

## Integration Patterns

### 1. Drop-in Widget

The simplest integration — a complete form + result display in one component.

```tsx
import { SigSentryProvider, AnalysisWidget } from '@sigsentry/react';

function App() {
  return (
    <SigSentryProvider apiKey="sg_live_..." theme="dark">
      <AnalysisWidget
        defaultTimeRange="1h"
        showFollowUp={true}
        onAnalysisComplete={(result) => console.log(result)}
      />
    </SigSentryProvider>
  );
}
```

### 2. Modal / Slideout Trigger

A button that opens the analysis widget in a modal or slideout panel.

```tsx
import { SigSentryProvider, SigSentryTrigger } from '@sigsentry/react';

function SupportToolbar() {
  return (
    <SigSentryProvider apiKey="sg_live_...">
      <SigSentryTrigger mode="modal" label="Diagnose Error" />
    </SigSentryProvider>
  );
}
```

### 3. Custom UI with `useSigSentry` Hook

Full programmatic control — build your own UI, use the hook for state management.

```tsx
import { useSigSentry, useSigSentryContext } from '@sigsentry/react';

function CustomAnalysis() {
  const { client } = useSigSentryContext();
  const { submitAnalysis, status, result, isLoading } = useSigSentry({ client });

  async function analyze() {
    await submitAnalysis({
      description: 'Checkout returning 500 errors',
      timeStart: new Date(Date.now() - 3600000),
      timeEnd: new Date(),
    });
  }

  return (
    <div>
      <button onClick={analyze} disabled={isLoading}>
        {isLoading ? `Analyzing (${status})...` : 'Run Analysis'}
      </button>
      {result && <p>{result.summary}</p>}
    </div>
  );
}
```

## Configuration

Edit `src/App.tsx` and set your API key and API URL:

```tsx
const API_KEY = "your-api-key-here";
const API_URL = "http://localhost:3001"; // or your production API URL
```

## Installing in Your Own Project

```bash
npm install @sigsentry/react @sigsentry/core
```

See the [SDK documentation](https://github.com/SigSentry/sdk) for the full API reference.

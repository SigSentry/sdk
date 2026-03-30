# @sigsentry/react

Drop-in React components for [SigSentry](https://sigsentry.dev) — AI-powered log analysis.

## Installation

```bash
npm install @sigsentry/react
```

## Quick Start

```tsx
import { SigSentryProvider, AnalysisWidget } from '@sigsentry/react';

function App() {
  return (
    <SigSentryProvider apiKey="your-api-key" theme="light">
      <AnalysisWidget
        onAnalysisComplete={(result) => console.log(result)}
        defaultTimeRange="1h"
      />
    </SigSentryProvider>
  );
}
```

## Components

### `<SigSentryProvider>`

Context provider that initializes the API client.

```tsx
<SigSentryProvider
  apiKey="your-api-key"
  baseUrl="https://api.sigsentry.dev"  // optional
  theme="light"                         // 'light' | 'dark' | 'auto'
>
  {children}
</SigSentryProvider>
```

### `<AnalysisWidget>`

Full-featured analysis form with streaming results.

```tsx
<AnalysisWidget
  onAnalysisComplete={(result) => {}}
  onError={(error) => {}}
  defaultTimeRange="1h"    // '15m' | '30m' | '1h' | '4h' | '12h' | '24h'
  showFollowUp={true}
  className="my-widget"
/>
```

### `<AnalysisResultDisplay>`

Read-only result renderer. Use when you build your own input form.

```tsx
<AnalysisResultDisplay result={analysisResult} />
```

### `<SigSentryTrigger>`

Button that opens the widget in a modal or slideout panel.

```tsx
<SigSentryTrigger mode="modal" label="Diagnose Error" />
```

### `useSigSentry()` Hook

Headless hook for full control over the analysis flow.

```tsx
const {
  submitAnalysis,
  askFollowUp,
  submitFeedback,
  status,     // 'idle' | AnalysisStage
  result,     // AnalysisResult | null
  error,      // ApiError | null
  isLoading,
} = useSigSentry();
```

## Theming

Customize with CSS custom properties:

```css
:root {
  --sg-color-primary: #6366f1;
  --sg-color-bg: #ffffff;
  --sg-color-text: #111827;
  --sg-font-family: 'Inter', sans-serif;
  --sg-border-radius: 8px;
}
```

## License

MIT

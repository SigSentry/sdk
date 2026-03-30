import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { SigSentryClient } from '@sigsentry/core';
import type { SigSentryClientConfig } from '@sigsentry/core';

export type TracebackTheme = 'light' | 'dark' | 'auto';

export interface SigSentryProviderProps {
  apiKey: string;
  baseUrl?: string;
  theme?: TracebackTheme;
  children: React.ReactNode;
}

interface TracebackContextValue {
  client: SigSentryClient;
  theme: TracebackTheme;
}

const TracebackContext = createContext<TracebackContextValue | null>(null);

export function useSigSentryContext(): TracebackContextValue {
  const context = useContext(TracebackContext);
  if (!context) {
    throw new Error('useSigSentryContext must be used within a <SigSentryProvider>');
  }
  return context;
}

export function SigSentryProvider({
  apiKey,
  baseUrl,
  theme = 'auto',
  children,
}: SigSentryProviderProps): React.JSX.Element {
  const client = useMemo(() => {
    const config: SigSentryClientConfig = { apiKey, baseUrl };
    return new SigSentryClient(config);
  }, [apiKey, baseUrl]);

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (theme !== 'auto') {
      setResolvedTheme(theme);
      return;
    }
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    setResolvedTheme(mql.matches ? 'dark' : 'light');

    const handler = (e: MediaQueryListEvent): void => {
      setResolvedTheme(e.matches ? 'dark' : 'light');
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [theme]);

  const value = useMemo(() => ({ client, theme }), [client, theme]);

  return (
    <TracebackContext.Provider value={value}>
      <div data-theme={resolvedTheme} style={{ fontFamily: 'var(--sg-font-family)' }}>
        {children}
      </div>
    </TracebackContext.Provider>
  );
}

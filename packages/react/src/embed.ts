/**
 * SigSentry Embed — Vanilla JS entry point for non-React consumers.
 *
 * Usage (script tag):
 *   <script src="https://cdn.sigsentry.com/embed.iife.js"></script>
 *   <script>
 *     SigSentry.init({
 *       target: '#sigsentry-widget',
 *       apiKey: 'tb_live_...',
 *       baseUrl: 'https://api.sigsentry.com',
 *       theme: 'dark', // optional: 'light' | 'dark' | 'auto'
 *       mode: 'inline', // optional: 'inline' | 'modal' | 'slideout'
 *       triggerLabel: 'Report Issue', // optional: button text for modal/slideout
 *     });
 *   </script>
 *   <div id="sigsentry-widget"></div>
 *
 * Usage (ESM):
 *   import { init, destroy } from '@sigsentry/react/embed';
 *   const instance = init({ target: '#widget', apiKey: '...' });
 *   instance.destroy();
 */

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { SigSentryProvider } from './components/SigSentryProvider.js';
import { AnalysisWidget } from './components/AnalysisWidget.js';
import { SigSentryTrigger } from './components/SigSentryTrigger.js';
import type { SigSentryTheme } from './components/SigSentryProvider.js';

export interface SigSentryEmbedConfig {
  /** CSS selector or DOM element to mount into */
  target: string | HTMLElement;
  /** SigSentry API key */
  apiKey: string;
  /** API base URL */
  baseUrl?: string;
  /** Theme: 'light' | 'dark' | 'auto' (default: 'light') */
  theme?: SigSentryTheme;
  /** Display mode: 'inline' renders widget directly, 'modal'/'slideout' renders a trigger button */
  mode?: 'inline' | 'modal' | 'slideout';
  /** Button label for modal/slideout mode (default: 'Report Issue') */
  triggerLabel?: string;
}

export interface SigSentryEmbedInstance {
  /** Unmount the widget and clean up */
  destroy: () => void;
}

let activeRoots: Map<HTMLElement, Root> = new Map();

function resolveTarget(target: string | HTMLElement): HTMLElement {
  if (typeof target === 'string') {
    const el = document.querySelector<HTMLElement>(target);
    if (!el) throw new Error(`SigSentry: target element "${target}" not found`);
    return el;
  }
  return target;
}

export function init(config: SigSentryEmbedConfig): SigSentryEmbedInstance {
  const el = resolveTarget(config.target);

  // Prevent double-init on same target
  const existingRoot = activeRoots.get(el);
  if (existingRoot) {
    existingRoot.unmount();
    activeRoots.delete(el);
  }

  const root = createRoot(el);
  activeRoots.set(el, root);

  const mode = config.mode ?? 'inline';
  const theme = config.theme ?? 'light';
  const triggerLabel = config.triggerLabel ?? 'Report Issue';

  const child = mode === 'inline'
    ? React.createElement(AnalysisWidget, null)
    : React.createElement(SigSentryTrigger, { mode, label: triggerLabel });

  const widget = React.createElement(
    SigSentryProvider,
    { apiKey: config.apiKey, baseUrl: config.baseUrl, theme, children: child },
  );

  root.render(widget);

  return {
    destroy() {
      root.unmount();
      activeRoots.delete(el);
    },
  };
}

export function destroy(target: string | HTMLElement): void {
  const el = resolveTarget(target);
  const root = activeRoots.get(el);
  if (root) {
    root.unmount();
    activeRoots.delete(el);
  }
}

// IIFE global: window.SigSentry
if (typeof window !== 'undefined') {
  (window as unknown as { SigSentry: { init: typeof init; destroy: typeof destroy } }).SigSentry = { init, destroy };
}

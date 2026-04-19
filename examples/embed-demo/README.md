# SigSentry Embed Demo

Demonstrates the vanilla JS embed — no React required in your app.

## Setup

```bash
# From the monorepo root
pnpm --filter @sigsentry/react build

# Open the HTML file directly in a browser
open packages/react/examples/embed-demo/index.html
```

## How it works

The IIFE build bundles React internally and exposes a global `SigSentry` object:

```html
<script src="https://cdn.sigsentry.com/embed.iife.js"></script>
<div id="widget"></div>
<script>
  SigSentry.init({
    target: '#widget',
    apiKey: 'tb_live_...',
    baseUrl: 'https://api.yourdomain.com',
    theme: 'dark',
    mode: 'inline',       // or 'modal', 'slideout'
    triggerLabel: 'Report Issue',
  });
</script>
```

## API

### `SigSentry.init(config)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `target` | `string \| HTMLElement` | required | CSS selector or DOM element |
| `apiKey` | `string` | required | SigSentry API key |
| `baseUrl` | `string` | — | API base URL |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'light'` | Widget theme |
| `mode` | `'inline' \| 'modal' \| 'slideout'` | `'inline'` | Display mode |
| `triggerLabel` | `string` | `'Report Issue'` | Button text for modal/slideout |

Returns `{ destroy() }` to unmount.

### `SigSentry.destroy(target)`

Unmount a previously initialized widget.

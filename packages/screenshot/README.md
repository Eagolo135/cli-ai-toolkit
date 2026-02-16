# @cli-ai-toolkit/screenshot

Website screenshot library using Playwright (Chromium).

## Features

- Full page or viewport screenshots
- Element-specific screenshots via CSS selectors
- Custom viewport sizes
- Animation disabling for consistent captures
- Automatic error handling and cleanup
- JSON metadata for each screenshot

## Usage

### As a library:

```typescript
import { captureScreenshot } from '@cli-ai-toolkit/screenshot';
import fs from 'fs/promises';

const result = await captureScreenshot({
  url: 'https://example.com',
  fullPage: true,
  viewport: '1920x1080',
  waitMs: 2000
});

await fs.writeFile('screenshot.png', result.buffer);
console.log(result.metadata);
```

### Direct service access:

```typescript
import { ScreenshotService, ScreenshotUtils } from '@cli-ai-toolkit/screenshot';

const service = new ScreenshotService();
const viewport = ScreenshotUtils.parseViewport('1440x900');

const result = await service.captureScreenshot({
  url: 'https://example.com',
  viewport,
  fullPage: false,
  selector: '.header',
  waitMs: 1500,
  disableAnimations: true
});
```

## Options

- `url` - Website URL (required)
- `viewport` - Viewport size (string like "1920x1080" or object)
- `fullPage` - Capture entire page (default: true)
- `selector` - CSS selector for specific element
- `waitMs` - Additional wait time in ms (default: 1500)
- `disableAnimations` - Disable CSS animations (default: false)

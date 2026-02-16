# @cli-ai-toolkit/imagegen

DALL-E 3 image generation library.

## Features

- Generate images using OpenAI's DALL-E 3
- Support for multiple image sizes
- Automatic retry logic and error handling
- Returns image as Buffer for flexible handling

## Usage

### As a library:

```typescript
import { generateImage } from '@cli-ai-toolkit/imagegen';
import fs from 'fs/promises';

const imageBuffer = await generateImage('A futuristic cityscape', '1024x1024');
await fs.writeFile('image.png', imageBuffer);
```

### Direct service access:

```typescript
import { ImageService } from '@cli-ai-toolkit/imagegen';

const service = new ImageService();
const buffer = await service.generateImage('Abstract art', '1792x1024');
```

## Supported Sizes

- `1024x1024` (square)
- `1792x1024` (landscape)
- `1024x1792` (portrait)

## Configuration

Requires `OPENAI_API_KEY` environment variable.

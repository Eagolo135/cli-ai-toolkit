# @cli-ai-toolkit/cli

CLI wrapper for the AI Toolkit monorepo.

## Commands

- `cli-ai-toolkit web-search "<query>" [options]` - OpenAI web search
- `cli-ai-toolkit gemini "<prompt>" [-f file]` - Gemini content generation
- `cli-ai-toolkit image-generate "<prompt>" [-s size]` - DALL-E image generation
- `cli-ai-toolkit screenshot "<url>" [options]` - Website screenshot

## Development

```bash
npm run dev -- web-search "test query"
```

## Build

```bash
npm run build
```

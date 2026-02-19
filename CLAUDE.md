# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

next-image-export-optimizer is a TypeScript package that enables Next.js's `<Image/>` component to work with static HTML exports. It optimizes images at build time using Sharp.js, generating multiple responsive sizes in modern formats (WebP, AVIF, JPEG, PNG).

## Commands

```bash
npm run build           # Compile TypeScript to dist/
npm test               # Run Jest unit tests (180s timeout)
npm run test:e2e       # Run Playwright E2E tests (Chrome & Firefox on localhost:8080)
npm run test:e2e:basePath    # E2E tests with basePath configuration
npm run exportExample   # Build and export the example Next.js app
```

## Architecture

### Core Components

1. **CLI Script** (`src/optimizeImages.ts`): Main entry point that orchestrates image optimization. Loads Next.js config, discovers images, and processes them through Sharp. Supports `--nextConfigPath` and `--exportFolderPath` CLI arguments.

2. **ExportedImage Component** (`example/src/ExportedImage.tsx`): React wrapper around Next.js `<Image/>` with custom loader for responsive srcsets. Handles blur placeholders, static imports, remote images, and fallback for failed optimizations.

3. **Utilities** (`src/utils/`): Helper modules for file discovery, remote image downloading, hash-based caching, and URL-to-filename conversion.

### Key Patterns

- **Image Naming**: Optimized images use pattern `{filename}-opt-{width}.{extension}`
- **Hash Caching**: MD5 hashes stored in `next-image-export-optimizer-hashes.json` prevent re-optimization of unchanged images
- **Responsive Sizes**: `imageSizes` [16-384px] for responsive images, `deviceSizes` [640-3840px] for full-width
- **Blur Placeholders**: 10px width images used as CSS background-image (not base64)

### Configuration

Set via `next.config.js` environment variables:
- `nextImageExportOptimizer_imageFolderPath`: Source image folder
- `nextImageExportOptimizer_exportFolderPath`: Output folder (default: "out")
- `nextImageExportOptimizer_quality`: Compression quality (default: "75")
- `nextImageExportOptimizer_storePicturesInWEBP`: Enable WebP output
- `nextImageExportOptimizer_generateAndUseBlurImages`: Enable blur placeholders

Legacy config via `images.nextImageExportOptimizer` object is still supported.

## Testing

- **Unit tests**: Jest with snapshots verifying generated image files and metadata across different config scenarios
- **E2E tests**: Playwright testing actual exported HTML serving from the example app
- Run single test: `npm test -- --testNamePattern="test name pattern"`

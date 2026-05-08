import { describe, expect, it } from 'vitest';

import { extractDrawingFeatures } from './drawingAnalyzer';

describe('extractDrawingFeatures', () => {
  it('extracts a palette and story seed from non-white pixels', () => {
    const pixels = new Uint8ClampedArray([
      255, 255, 255, 255, 250, 250, 250, 255, 20, 120, 220, 255, 24, 126, 226, 255, 240, 90, 40, 255,
      242, 92, 42, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    ]);

    const features = extractDrawingFeatures(pixels, 2, 4);

    expect(features.palette.length).toBeGreaterThan(0);
    expect(features.inkCoverage).toBeGreaterThan(0.35);
    expect(features.suggestedName).toMatch(/\w+/);
    expect(features.characterSeed.gift).toBeTruthy();
  });
});

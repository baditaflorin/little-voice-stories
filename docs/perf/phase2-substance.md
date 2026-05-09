# Phase 2 Performance Notes

## Budgets

- Normal image analysis under 1s median.
- Inputs up to 5MB under 3s p95 on a modern laptop.
- Inputs over 5MB show progress and keep a cancel path visible.
- Inputs over 15MB are rejected with an actionable message in v2.0.
- Optional WebLLM remains lazy and is excluded from first-load budget.

## Measurement Plan

The fixture suite records duration for drawing inference and asserts no crash for real-data and synthetic edge cases. Manual smoke uses Playwright on the built Pages output.

## Initial Hot Paths

1. Image decode/canvas draw.
2. Pixel scan and palette bucketing.
3. Optional WebLLM bundle load.

## Phase 2 Changes

- Downscale before analysis.
- Add early file validation before decode.
- Cache inference by source hash within the browser session.
- Keep optional WebLLM lazy.

## Latest Local Measurements

- `npm test`: 17 tests passed in about 2 seconds; fixture assertions completed under 100ms in the latest run.
- `npm run build`: Pages bundle built in under 1 second locally.
- `npm run smoke`: Playwright happy path passed in about 2 seconds.

The automated fixture run measures inference behavior from committed real-data descriptors. Browser decode/canvas timing still needs binary fixtures with clear licensing before it can be treated as a full end-to-end image-performance benchmark.

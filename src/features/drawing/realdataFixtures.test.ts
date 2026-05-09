import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { isDomainError } from '../../lib/domainError';
import { inferDrawingIntelligence, validateDrawingFile } from './drawingAnalyzer';

type DrawingFixture = {
  id: string;
  fileName: string;
  mimeType: string;
  bytes: number;
  signals: null | {
    width: number;
    height: number;
    inkCoverage: number;
    colorfulness: number;
    brightness: number;
    edgeEnergy: number;
    palette: string[];
  };
};

type DrawingExpectation = {
  subject?: string;
  sceneType?: string;
  minimumConfidence?: number;
  maximumConfidence?: number;
  expectedIssues?: string[];
  expectedErrorKind?: string;
  requiredSuggestions?: string[];
  requiredStoryWords?: string[];
};

const realDataDir = join(process.cwd(), 'test/fixtures/realdata');
const syntheticDir = join(process.cwd(), 'test/fixtures/synthetic-edge');

describe('real-data drawing inference fixtures', () => {
  const fixtureIds = readdirSync(realDataDir)
    .filter((name) => name.endsWith('.input.json'))
    .map((name) => name.replace('.input.json', ''))
    .filter((id) => id !== 'short-noisy-voice' && id !== 'long-multispeaker-audio');

  it.each(fixtureIds.map((id) => [id] as const))('handles %s honestly', (id: string) => {
    const input = readFixture<DrawingFixture>(realDataDir, `${id}.input.json`);
    const expected = readFixture<DrawingExpectation>(realDataDir, `${id}.expected.json`);
    const source = { name: input.fileName, type: input.mimeType, size: input.bytes };

    if (!input.signals) {
      expect(() => validateDrawingFile(source)).toThrow();
      try {
        validateDrawingFile(source);
      } catch (error) {
        expect(isDomainError(error)).toBe(true);
        if (isDomainError(error)) {
          expect(error.kind).toBe(expected.expectedErrorKind);
          expect(error.message).toMatch(/PDF|image|photo/i);
        }
      }
      return;
    }

    validateDrawingFile(source);
    const result = inferDrawingIntelligence({
      source,
      ...input.signals,
    });
    const issueIds = result.issues.map((issue) => issue.id);
    const suggestions = result.issues
      .flatMap((issue) => [issue.message, issue.suggestion])
      .join(' ')
      .toLowerCase();

    expect(result.subject.label).toBe(expected.subject);
    expect(result.subject.sceneType).toBe(expected.sceneType);
    if (typeof expected.minimumConfidence === 'number') {
      expect(result.subject.confidence.score).toBeGreaterThanOrEqual(expected.minimumConfidence);
    }
    if (typeof expected.maximumConfidence === 'number') {
      expect(result.subject.confidence.score).toBeLessThanOrEqual(expected.maximumConfidence);
    }
    for (const issue of expected.expectedIssues ?? []) {
      expect(issueIds).toContain(issue);
    }
    for (const suggestion of expected.requiredSuggestions ?? []) {
      expect(suggestions).toContain(suggestion.toLowerCase());
    }
    for (const word of expected.requiredStoryWords ?? []) {
      expect(result.subject.storyHints.join(' ').toLowerCase()).toContain(word);
    }
    expect(result.subject.confidence.reasons.length).toBeGreaterThan(0);
  });
});

describe('synthetic edge drawing fixtures', () => {
  it('rejects huge files before decoding', () => {
    const input = readFixture<DrawingFixture>(syntheticDir, 'huge-image.input.json');

    expect(() =>
      validateDrawingFile({ name: input.fileName, type: input.mimeType, size: input.bytes }),
    ).toThrow(/under 15MB/);
  });

  it('normalizes RTL filenames before subject inference', () => {
    const input = readFixture<DrawingFixture>(syntheticDir, 'rtl-filename.input.json');
    expect(input.signals).not.toBeNull();
    const result = inferDrawingIntelligence({
      source: { name: input.fileName, type: input.mimeType, size: input.bytes },
      ...input.signals!,
    });

    expect(result.subject.label).toBe('house');
    expect(result.subject.confidence.score).toBeGreaterThan(0.7);
  });

  it('keeps empty images low confidence instead of inventing detail', () => {
    const input = readFixture<DrawingFixture>(syntheticDir, 'empty-image.input.json');
    expect(input.signals).not.toBeNull();
    const result = inferDrawingIntelligence({
      source: { name: input.fileName, type: input.mimeType, size: input.bytes },
      ...input.signals!,
    });

    expect(result.subject.confidence.label).toBe('low');
    expect(result.issues.map((issue) => issue.id)).toContain('sparse-drawing');
  });
});

function readFixture<T>(directory: string, fileName: string): T {
  return JSON.parse(readFileSync(join(directory, fileName), 'utf8')) as T;
}

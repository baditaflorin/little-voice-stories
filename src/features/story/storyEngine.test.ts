import { describe, expect, it } from 'vitest';

import type { DrawingAnalysis } from '../drawing/drawingAnalyzer';
import { defaultCharacterProfile, generateTemplateStory } from './storyEngine';

const drawing: DrawingAnalysis = {
  previewDataUrl: 'data:image/webp;base64,abc',
  width: 120,
  height: 80,
  source: {
    id: 'fixture-drawing',
    name: 'house-tree.png',
    type: 'image/png',
    size: 1200,
  },
  palette: [{ hex: '#14b8a6', population: 10 }],
  inkCoverage: 0.4,
  colorfulness: 0.5,
  brightness: 0.8,
  edgeEnergy: 0.3,
  suggestedName: 'Lumi Mint',
  characterSeed: {
    shape: 'pocket comet',
    mood: 'gentle',
    gift: 'keeps promises warm',
    challenge: 'learning to rest',
  },
  subject: {
    label: 'house and tree',
    sceneType: 'place',
    confidence: {
      score: 0.78,
      label: 'high',
      reasons: ['Filename contains house / tree.'],
    },
    storyHints: ['house', 'tree'],
  },
  quality: {
    score: 0.8,
    label: 'high',
    reasons: ['Drawing has enough visible marks for a useful first pass.'],
  },
  issues: [],
};

describe('generateTemplateStory', () => {
  it('writes a deterministic bedtime story starring the drawing character', () => {
    const character = {
      ...defaultCharacterProfile(),
      characterName: 'Pip Lantern',
      childName: 'Mara',
    };

    const first = generateTemplateStory({ drawing, character });
    const second = generateTemplateStory({ drawing, character });

    expect(first.title).toContain('Pip Lantern');
    expect(first.text).toContain('Mara');
    expect(first.text).toContain('house and tree');
    expect(first.provenance.drawingSourceId).toBe('fixture-drawing');
    expect(first.provenance.subjectConfidence).toBe(0.78);
    expect(first.wordCount).toBeGreaterThan(250);
    expect(first).toEqual(second);
  });
});

import { describe, expect, it } from 'vitest';

import { createEmptyProject, migrateProjectState } from './projectState';
import {
  parsePortableProject,
  parseShareSnapshot,
  projectFromShareSnapshot,
  serializePortableProject,
  serializeShareSnapshot,
} from './sessionTransfer';

describe('sessionTransfer', () => {
  it('round-trips a portable project JSON export', () => {
    const project = migrateProjectState({
      ...createEmptyProject('2026-05-09T00:00:00.000Z'),
      character: {
        characterName: 'Pip Lantern',
        childName: 'Mara',
        setting: 'moonlit room',
        bedtimePromise: 'I am close',
        favoriteObject: 'blanket',
        storyTone: 'cozy',
      },
    });

    const serialized = serializePortableProject(project);
    const reparsed = parsePortableProject(serialized);

    expect(reparsed).toEqual(project);
  });

  it('creates a share link snapshot for a small finished story', () => {
    const project = migrateProjectState({
      ...createEmptyProject('2026-05-09T00:00:00.000Z'),
      drawing: {
        previewDataUrl: 'data:image/webp;base64,abc',
        width: 12,
        height: 12,
        source: { id: 'drawing', name: 'drawing.png', type: 'image/png', size: 1000 },
        palette: [{ hex: '#111111', population: 1 }],
        inkCoverage: 0.3,
        colorfulness: 0.2,
        brightness: 0.8,
        edgeEnergy: 0.2,
        suggestedName: 'Pip Lantern',
        characterSeed: {
          shape: 'pocket comet',
          mood: 'gentle',
          gift: 'keeps promises warm',
          challenge: 'learning to rest',
        },
        subject: {
          label: 'house and tree',
          sceneType: 'place',
          confidence: { score: 0.8, label: 'high', reasons: ['fixture'] },
          storyHints: ['house', 'tree'],
        },
        quality: { score: 0.8, label: 'high', reasons: ['fixture'] },
        issues: [],
      },
      character: {
        characterName: 'Pip Lantern',
        childName: 'Mara',
        setting: 'moonlit room',
        bedtimePromise: 'I am close',
        favoriteObject: 'blanket',
        storyTone: 'cozy',
      },
      story: {
        id: 'story-1',
        title: 'Pip Lantern',
        text: 'Mara drifted into sleep while Pip Lantern watched the moon.',
        estimatedMinutes: 3,
        wordCount: 10,
        generatedBy: 'local-story-engine',
        provenance: {
          schemaVersion: 'story.v2',
          appVersion: '0.3.0',
          drawingSourceId: 'drawing',
          subject: 'house and tree',
          subjectConfidence: 0.8,
          storyTone: 'cozy',
        },
      },
    });

    const url = serializeShareSnapshot(project);
    const share = parseShareSnapshot(new URL(url).hash);
    expect(share?.storyTitle).toBe('Pip Lantern');

    const sharedProject = projectFromShareSnapshot(share!);
    expect(sharedProject.story?.text).toContain('Mara');
  });
});

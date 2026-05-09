import { describe, expect, it } from 'vitest';

import { createEmptyProject, defaultAppSettings, migrateProjectState } from './projectState';

describe('projectState', () => {
  it('creates a default project with portable metadata', () => {
    const project = createEmptyProject('2026-05-09T00:00:00.000Z');

    expect(project.schemaVersion).toBe('project.v3');
    expect(project.settings).toEqual(defaultAppSettings());
    expect(project.activity).toEqual([]);
  });

  it('migrates a legacy saved project into the phase 3 schema', () => {
    const project = migrateProjectState({
      updatedAt: '2026-05-09T00:00:00.000Z',
      character: {
        characterName: 'Pip Lantern',
        childName: 'Mara',
        setting: 'moonlit room',
        bedtimePromise: 'I am close',
        favoriteObject: 'blanket',
        storyTone: 'cozy',
      },
    });

    expect(project.schemaVersion).toBe('project.v3');
    expect(project.character.characterName).toBe('Pip Lantern');
    expect(project.settings.autosaveEnabled).toBe(true);
  });
});

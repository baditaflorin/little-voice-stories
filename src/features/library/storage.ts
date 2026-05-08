import { openDB } from 'idb';
import { z } from 'zod';

import { drawingAnalysisSchema } from '../drawing/drawingAnalyzer';
import { characterProfileSchema, generatedStorySchema } from '../story/storyEngine';
import { voiceProfileSchema } from '../voice/voiceAnalysis';

const DB_NAME = 'little-voice-stories';
const STORE_NAME = 'projects';
const CURRENT_PROJECT_ID = 'current';

export const persistedProjectSchema = z.object({
  id: z.literal(CURRENT_PROJECT_ID),
  updatedAt: z.string(),
  drawing: drawingAnalysisSchema.optional(),
  character: characterProfileSchema.optional(),
  story: generatedStorySchema.optional(),
  voiceProfile: voiceProfileSchema.optional(),
});

export type PersistedProject = z.infer<typeof persistedProjectSchema>;

export async function loadCurrentProject(): Promise<PersistedProject | undefined> {
  const db = await openProjectDb();
  const value = await db.get(STORE_NAME, CURRENT_PROJECT_ID);
  if (!value) {
    return undefined;
  }
  return persistedProjectSchema.parse(value);
}

export async function saveCurrentProject(project: Omit<PersistedProject, 'id' | 'updatedAt'>) {
  const db = await openProjectDb();
  await db.put(STORE_NAME, {
    id: CURRENT_PROJECT_ID,
    updatedAt: new Date().toISOString(),
    ...project,
  });
}

export async function clearCurrentProject() {
  const db = await openProjectDb();
  await db.delete(STORE_NAME, CURRENT_PROJECT_ID);
}

async function openProjectDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

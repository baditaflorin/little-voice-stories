import { z } from 'zod';

import { drawingAnalysisSchema } from '../drawing/drawingAnalyzer';
import {
  characterProfileSchema,
  defaultCharacterProfile,
  generatedStorySchema,
} from '../story/storyEngine';
import { voiceProfileSchema } from '../voice/voiceAnalysis';

export const appSettingsSchema = z.object({
  autosaveEnabled: z.boolean(),
  rememberSubjectCorrections: z.boolean(),
  showDebugPanel: z.boolean(),
  preferredStoryGenerator: z.enum(['template', 'local-ai']),
});

export const activityEventSchema = z.object({
  id: z.number(),
  at: z.string(),
  label: z.string(),
});

export const portableProjectSchema = z.object({
  schemaVersion: z.literal('project.v3'),
  updatedAt: z.string(),
  drawing: drawingAnalysisSchema.optional(),
  character: characterProfileSchema,
  story: generatedStorySchema.optional(),
  voiceProfile: voiceProfileSchema.optional(),
  activity: z.array(activityEventSchema),
  subjectCorrections: z.record(z.string(), z.string()),
  settings: appSettingsSchema,
});

const legacyProjectLikeSchema = z
  .object({
    updatedAt: z.string().optional(),
    drawing: drawingAnalysisSchema.optional(),
    character: characterProfileSchema.optional(),
    story: generatedStorySchema.optional(),
    voiceProfile: voiceProfileSchema.optional(),
    activity: z.array(activityEventSchema).optional(),
    subjectCorrections: z.record(z.string(), z.string()).optional(),
    settings: appSettingsSchema.partial().optional(),
  })
  .passthrough();

export type AppSettings = z.infer<typeof appSettingsSchema>;
export type ActivityEvent = z.infer<typeof activityEventSchema>;
export type PortableProject = z.infer<typeof portableProjectSchema>;

export function defaultAppSettings(): AppSettings {
  return {
    autosaveEnabled: true,
    rememberSubjectCorrections: true,
    showDebugPanel: false,
    preferredStoryGenerator: 'template',
  };
}

export function createEmptyProject(now = new Date().toISOString()): PortableProject {
  return {
    schemaVersion: 'project.v3',
    updatedAt: now,
    character: defaultCharacterProfile(),
    activity: [],
    subjectCorrections: {},
    settings: defaultAppSettings(),
  };
}

export function migrateProjectState(raw: unknown): PortableProject {
  const current = portableProjectSchema.safeParse(raw);
  if (current.success) {
    return current.data;
  }

  const legacy = legacyProjectLikeSchema.parse(raw);
  const defaultProject = createEmptyProject(legacy.updatedAt ?? new Date().toISOString());

  return portableProjectSchema.parse({
    ...defaultProject,
    updatedAt: legacy.updatedAt ?? defaultProject.updatedAt,
    drawing: legacy.drawing,
    character: legacy.character ?? defaultProject.character,
    story: legacy.story,
    voiceProfile: legacy.voiceProfile,
    activity: legacy.activity ?? [],
    subjectCorrections: legacy.subjectCorrections ?? {},
    settings: {
      ...defaultProject.settings,
      ...legacy.settings,
    },
  });
}

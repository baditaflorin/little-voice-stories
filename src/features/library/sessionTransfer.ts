import { z } from 'zod';

import { DomainError } from '../../lib/domainError';
import { appMeta } from '../../lib/appMeta';
import { migrateProjectState, portableProjectSchema, type PortableProject } from './projectState';

const shareSnapshotSchema = z.object({
  schemaVersion: z.literal('share.v1'),
  characterName: z.string(),
  childName: z.string(),
  storyTitle: z.string(),
  storyText: z.string(),
  subject: z.string(),
});

export type ShareSnapshot = z.infer<typeof shareSnapshotSchema>;

export function serializePortableProject(project: PortableProject) {
  return `${JSON.stringify(portableProjectSchema.parse(project), null, 2)}\n`;
}

export function parsePortableProject(text: string) {
  try {
    return migrateProjectState(JSON.parse(text)) as PortableProject;
  } catch (error) {
    throw new DomainError(
      'unsupported-format',
      error instanceof Error
        ? 'This session file could not be imported.'
        : 'This session file could not be imported.',
      'Use a Little Voice Stories session JSON export from the same app family.',
    );
  }
}

export function serializeShareSnapshot(project: PortableProject) {
  if (!project.story || !project.drawing) {
    throw new DomainError(
      'unsupported-format',
      'A share link needs both a drawing and a story first.',
      'Create a story, then try sharing again.',
    );
  }

  const snapshot = shareSnapshotSchema.parse({
    schemaVersion: 'share.v1',
    characterName: project.character.characterName,
    childName: project.character.childName,
    storyTitle: project.story.title,
    storyText: project.story.text,
    subject: project.drawing.subject.label,
  });

  const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(snapshot)))));
  if (encoded.length > 3500) {
    throw new DomainError(
      'file-too-large',
      'This story is too large for a reliable share link.',
      'Export the session JSON instead.',
    );
  }
  return `${appMeta.liveUrl}#share=${encoded}`;
}

export function parseShareSnapshot(hash: string): ShareSnapshot | undefined {
  const match = /(?:^#|&)share=([^&]+)/.exec(hash);
  if (!match) {
    return undefined;
  }

  try {
    const decoded = decodeURIComponent(match[1]);
    const json = decodeURIComponent(escape(atob(decoded)));
    return shareSnapshotSchema.parse(JSON.parse(json));
  } catch {
    throw new DomainError(
      'unsupported-format',
      'This share link could not be opened.',
      'Ask for a fresh share link or use a session JSON file.',
    );
  }
}

export function projectFromShareSnapshot(snapshot: ShareSnapshot): PortableProject {
  return migrateProjectState({
    updatedAt: new Date().toISOString(),
    character: {
      ...portableProjectSchema.shape.character.parse({
        characterName: snapshot.characterName || 'Bedtime Friend',
        childName: snapshot.childName || 'my little one',
        setting: 'the bedroom doorway where moonlight lands',
        bedtimePromise: 'I am always close, even when I am away',
        favoriteObject: 'a soft blanket',
        storyTone: 'cozy',
      }),
    },
    story: {
      id: `shared-${
        snapshot.storyTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || 'story'
      }`,
      title: snapshot.storyTitle,
      text: snapshot.storyText,
      estimatedMinutes: Math.max(
        3,
        Math.round(snapshot.storyText.trim().split(/\s+/).filter(Boolean).length / 145),
      ),
      wordCount: snapshot.storyText.trim().split(/\s+/).filter(Boolean).length,
      generatedBy: 'local-story-engine',
      provenance: {
        schemaVersion: 'story.v2',
        appVersion: appMeta.version,
        drawingSourceId: 'shared-story',
        subject: snapshot.subject,
        subjectConfidence: 0.5,
        storyTone: 'cozy',
      },
    },
  });
}

export function storyTextDownloadName(project: PortableProject) {
  const base =
    project.story?.title ||
    project.character.characterName ||
    project.drawing?.suggestedName ||
    'little-voice-story';
  return `${
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'little-voice-story'
  }.txt`;
}

export function sessionDownloadName(project: PortableProject) {
  const base =
    project.character.characterName || project.drawing?.suggestedName || 'little-voice-session';
  return `${
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'little-voice-session'
  }.json`;
}

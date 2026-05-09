import {
  Clipboard,
  BookOpen,
  BrainCircuit,
  Brush,
  CircleStop,
  Copy,
  Download,
  Eraser,
  FileJson,
  FileUp,
  GitBranch,
  HeartHandshake,
  Link2,
  Loader2,
  Mic,
  Pause,
  Play,
  Printer,
  Settings2,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react';
import { type ChangeEvent, useEffect, useEffectEvent, useRef, useState } from 'react';

import {
  analyzeAudioBlob,
  createDemoVoiceProfile,
  type VoiceProfile,
} from '../features/voice/voiceAnalysis';
import {
  analyzeDrawingFile,
  loadSampleDrawing,
  type DrawingAnalysis,
} from '../features/drawing/drawingAnalyzer';
import {
  clearCurrentProject,
  loadCurrentProject,
  saveCurrentProject,
} from '../features/library/storage';
import {
  createEmptyProject,
  defaultAppSettings,
  type ActivityEvent,
  type AppSettings,
  type PortableProject,
} from '../features/library/projectState';
import {
  parsePortableProject,
  parseShareSnapshot,
  projectFromShareSnapshot,
  serializePortableProject,
  serializeShareSnapshot,
  sessionDownloadName,
  storyTextDownloadName,
} from '../features/library/sessionTransfer';
import {
  defaultCharacterProfile,
  generateTemplateStory,
  type CharacterProfile,
  type GeneratedStory,
} from '../features/story/storyEngine';
import { generateWithWebLlm, type WebLlmProgress } from '../features/story/webLlm';
import { canNarrate, speakStory, type NarrationControls } from '../features/voice/narration';
import { appMeta } from '../lib/appMeta';
import { isDomainError } from '../lib/domainError';

type StepId = 'drawing' | 'character' | 'story' | 'voice';

type Toast = {
  id: number;
  message: string;
  tone: 'info' | 'success' | 'error';
};
const steps: Array<{ id: StepId | 'settings'; label: string }> = [
  { id: 'drawing', label: 'Drawing' },
  { id: 'character', label: 'Character' },
  { id: 'story', label: 'Story' },
  { id: 'voice', label: 'Voice' },
  { id: 'settings', label: 'Settings' },
];

export function ProjectWorkspace() {
  const [activeStep, setActiveStep] = useState<StepId | 'settings'>('drawing');
  const [drawing, setDrawing] = useState<DrawingAnalysis>();
  const [character, setCharacter] = useState<CharacterProfile>(defaultCharacterProfile());
  const [story, setStory] = useState<GeneratedStory>();
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile>();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [subjectCorrections, setSubjectCorrections] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<AppSettings>(defaultAppSettings());
  const importRef = useRef<HTMLInputElement>(null);
  const skipNextAutosaveRef = useRef(false);
  const debugEnabled =
    settings.showDebugPanel || new URLSearchParams(window.location.search).get('debug') === '1';

  useEffect(() => {
    let active = true;

    async function restoreProject() {
      try {
        const shared = parseShareSnapshot(window.location.hash);
        if (shared) {
          if (!active) {
            return;
          }
          applyProject(projectFromShareSnapshot(shared));
          pushToast('Shared story loaded.', 'success');
          return;
        }
      } catch (error) {
        if (active) {
          pushToast(formatError(error, 'Shared story could not be restored.'), 'error');
        }
      }

      try {
        const record = await loadCurrentProject();
        if (active && record?.project) {
          applyProject(record.project);
        }
      } catch {
        if (active) {
          pushToast('Saved project could not be restored.', 'error');
        }
      } finally {
        if (active) {
          setHasLoaded(true);
        }
      }
    }

    void restoreProject();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }
    if (!settings.autosaveEnabled) {
      return;
    }
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return;
    }
    const handle = window.setTimeout(() => {
      saveCurrentProject({
        ...createEmptyProject(new Date().toISOString()),
        updatedAt: new Date().toISOString(),
        drawing,
        character,
        story,
        voiceProfile,
        activity,
        subjectCorrections,
        settings,
      }).catch(() => pushToast('Local save failed in this browser.', 'error'));
    }, 400);
    return () => window.clearTimeout(handle);
  }, [activity, character, drawing, hasLoaded, settings, story, subjectCorrections, voiceProfile]);

  function pushToast(message: string, tone: Toast['tone'] = 'info') {
    const id = Date.now();
    setToasts((items) => [...items, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((items) => items.filter((toast) => toast.id !== id));
    }, 5200);
  }

  function recordActivity(label: string) {
    setActivity((items) =>
      [
        {
          id: Date.now(),
          at: new Date().toISOString(),
          label,
        },
        ...items,
      ].slice(0, 8),
    );
  }

  function applyProject(project: PortableProject) {
    setDrawing(project.drawing);
    setCharacter(project.character);
    setStory(project.story);
    setVoiceProfile(project.voiceProfile);
    setActivity(project.activity);
    setSubjectCorrections(project.subjectCorrections);
    setSettings(project.settings);
  }

  function buildProjectState(): PortableProject {
    return {
      ...createEmptyProject(new Date().toISOString()),
      updatedAt: new Date().toISOString(),
      drawing,
      character,
      story,
      voiceProfile,
      activity,
      subjectCorrections,
      settings,
    };
  }

  async function resetProject() {
    const confirmed = window.confirm(
      'Reset the local bedtime session? Export the session first if you want a backup.',
    );
    if (!confirmed) {
      return;
    }
    await clearCurrentProject();
    skipNextAutosaveRef.current = true;
    applyProject(createEmptyProject());
    window.history.replaceState({}, document.title, window.location.pathname);
    setActiveStep('drawing');
    pushToast('Local project cleared.', 'success');
  }

  async function importSession(file: File) {
    try {
      const project = parsePortableProject(await file.text());
      applyProject(project);
      setActiveStep(project.story ? 'story' : project.drawing ? 'character' : 'drawing');
      recordActivity(`Imported session ${file.name}`);
      pushToast('Session imported.', 'success');
    } catch (error) {
      pushToast(formatError(error, 'Session import failed.'), 'error');
    }
  }

  async function handleImportSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      await importSession(file);
    }
    event.target.value = '';
  }

  async function exportSession() {
    const project = buildProjectState();
    downloadTextFile(
      serializePortableProject(project),
      sessionDownloadName(project),
      'application/json',
    );
    recordActivity('Exported session JSON');
    pushToast('Session JSON exported.', 'success');
  }

  async function copyProjectJson() {
    try {
      await navigator.clipboard.writeText(serializePortableProject(buildProjectState()));
      pushToast('Session JSON copied.', 'success');
    } catch {
      pushToast('Session JSON copy is not available in this browser.', 'error');
    }
  }

  async function shareStoryLink() {
    try {
      const url = serializeShareSnapshot(buildProjectState());
      await navigator.clipboard.writeText(url);
      recordActivity('Copied share link');
      pushToast('Share link copied.', 'success');
    } catch (error) {
      pushToast(formatError(error, 'Share link failed.'), 'error');
    }
  }

  function printStory() {
    if (!story) {
      pushToast('Create a story first, then print it.', 'error');
      return;
    }
    recordActivity('Opened print view');
    window.print();
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href={appMeta.liveUrl} aria-label="Little Voice Stories home">
          <span className="brand__mark">
            <Sparkles size={18} />
          </span>
          <span>
            <strong>{appMeta.name}</strong>
            <small>
              v{appMeta.version} · {appMeta.commit}
            </small>
          </span>
        </a>

        <nav className="topbar__links" aria-label="Project links">
          <a href={appMeta.repositoryUrl} target="_blank" rel="noreferrer">
            <GitBranch size={18} />
            <span>Star on GitHub</span>
          </a>
          <a href={appMeta.supportUrl} target="_blank" rel="noreferrer">
            <HeartHandshake size={18} />
            <span>Support</span>
          </a>
        </nav>
      </header>

      <main className="workspace">
        <section className="workspace__intro" aria-labelledby="workspace-title">
          <p className="eyebrow">Local-first bedtime studio</p>
          <h1 id="workspace-title">Drawing to story to parent-style narration.</h1>
          <p>
            The drawing, voice recording, and story draft stay in this browser. The optional local AI
            path downloads a model only after you ask for it.
          </p>
        </section>

        <input
          ref={importRef}
          className="visually-hidden"
          type="file"
          accept="application/json,.json"
          onChange={(event) => void handleImportSelection(event)}
        />

        <SessionToolbar
          hasStory={Boolean(story)}
          hasDrawing={Boolean(drawing)}
          onImport={() => importRef.current?.click()}
          onExport={() => void exportSession()}
          onCopyJson={() => void copyProjectJson()}
          onShare={() => void shareStoryLink()}
          onPrint={printStory}
          onSettings={() => setActiveStep('settings')}
        />

        <StepTabs activeStep={activeStep} onChange={setActiveStep} />

        <section className="tool-surface" aria-live="polite">
          {activeStep === 'drawing' && (
            <DrawingStep
              drawing={drawing}
              onDrawing={(analysis) => {
                const learnedName = settings.rememberSubjectCorrections
                  ? subjectCorrections[analysis.subject.label]
                  : undefined;
                const inferredName = learnedName ?? toTitleCase(analysis.subject.label);
                setDrawing(analysis);
                setCharacter((current) => ({
                  ...current,
                  characterName: current.characterName || inferredName || analysis.suggestedName,
                }));
                setStory(undefined);
                setActiveStep('character');
                recordActivity(
                  `Drawing analyzed as ${analysis.subject.label} (${analysis.subject.confidence.label})`,
                );
                pushToast(
                  analysis.subject.confidence.label === 'low'
                    ? 'Drawing analyzed with low confidence. Check the suggested fix.'
                    : `Drawing analyzed as ${analysis.subject.label}.`,
                  analysis.subject.confidence.label === 'low' ? 'info' : 'success',
                );
              }}
              onToast={pushToast}
            />
          )}

          {activeStep === 'character' && (
            <CharacterStep
              drawing={drawing}
              character={character}
              onCharacter={setCharacter}
              onSubjectNameCorrection={(subject, name) => {
                if (settings.rememberSubjectCorrections && name.trim()) {
                  setSubjectCorrections((current) => ({ ...current, [subject]: name.trim() }));
                }
              }}
              onNext={() => setActiveStep('story')}
            />
          )}

          {activeStep === 'story' && (
            <StoryStep
              drawing={drawing}
              character={character}
              story={story}
              settings={settings}
              onStory={(nextStory) => {
                setStory(nextStory);
                if (story?.id !== nextStory.id) {
                  recordActivity(`Story generated from ${nextStory.provenance.subject}`);
                }
              }}
              onCopyStory={(text) => void copyText(text, 'Story copied.', pushToast)}
              onDownloadStory={(text) => {
                downloadTextFile(text, storyTextDownloadName(buildProjectState()), 'text/plain');
                recordActivity('Downloaded story text');
                pushToast('Story text downloaded.', 'success');
              }}
              onToast={pushToast}
              onNext={() => setActiveStep('voice')}
            />
          )}

          {activeStep === 'voice' && (
            <VoiceStep
              story={story}
              voiceProfile={voiceProfile}
              onVoiceProfile={(profile) => {
                setVoiceProfile(profile);
                recordActivity(`Voice profile quality ${profile.quality.label}`);
              }}
              onToast={pushToast}
            />
          )}

          {activeStep === 'settings' && (
            <SettingsStep
              settings={settings}
              onSettings={(nextSettings) => {
                setSettings(nextSettings);
                if (!nextSettings.rememberSubjectCorrections) {
                  setSubjectCorrections({});
                }
              }}
              onToast={pushToast}
            />
          )}
        </section>

        <footer className="footer">
          <span>GitHub Pages · Mode A static PWA · No analytics</span>
          <button className="text-button" type="button" onClick={() => void resetProject()}>
            <Eraser size={16} />
            Reset local data
          </button>
        </footer>

        {debugEnabled && (
          <DebugPanel drawing={drawing} story={story} voiceProfile={voiceProfile} activity={activity} />
        )}
      </main>

      <div className="toast-region" aria-live="assertive" aria-relevant="additions">
        {toasts.map((toast) => (
          <div className={`toast toast--${toast.tone}`} key={toast.id}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

function StepTabs({
  activeStep,
  onChange,
}: {
  activeStep: StepId | 'settings';
  onChange: (step: StepId | 'settings') => void;
}) {
  return (
    <div className="step-tabs" role="tablist" aria-label="Story creation steps">
      {steps.map((step, index) => (
        <button
          key={step.id}
          type="button"
          className={activeStep === step.id ? 'step-tab step-tab--active' : 'step-tab'}
          onClick={() => onChange(step.id)}
          role="tab"
          aria-selected={activeStep === step.id}
        >
          <span>{index + 1}</span>
          {step.label}
        </button>
      ))}
    </div>
  );
}

function SessionToolbar({
  hasStory,
  hasDrawing,
  onImport,
  onExport,
  onCopyJson,
  onShare,
  onPrint,
  onSettings,
}: {
  hasStory: boolean;
  hasDrawing: boolean;
  onImport: () => void;
  onExport: () => void;
  onCopyJson: () => void;
  onShare: () => void;
  onPrint: () => void;
  onSettings: () => void;
}) {
  return (
    <section className="session-toolbar" aria-label="Session tools">
      <button className="secondary-button" type="button" onClick={onImport}>
        <FileUp size={18} />
        Import session
      </button>
      <button
        className="secondary-button"
        type="button"
        onClick={onExport}
        title={
          hasDrawing
            ? 'Download the full bedtime session as JSON.'
            : 'Export a session after loading a drawing.'
        }
      >
        <Download size={18} />
        Export session
      </button>
      <button
        className="secondary-button"
        type="button"
        onClick={onCopyJson}
        title={hasDrawing ? 'Copy the full session JSON.' : 'Copy session JSON after loading a drawing.'}
      >
        <FileJson size={18} />
        Copy JSON
      </button>
      <button
        className="secondary-button"
        type="button"
        onClick={onShare}
        disabled={!hasStory}
        title="Create a share link once the current story is ready."
      >
        <Link2 size={18} />
        Share link
      </button>
      <button
        className="secondary-button"
        type="button"
        onClick={onPrint}
        disabled={!hasStory}
        title="Print the current story once it is ready."
      >
        <Printer size={18} />
        Print story
      </button>
      <button className="secondary-button" type="button" onClick={onSettings}>
        <Settings2 size={18} />
        Settings
      </button>
      <p className="session-toolbar__hint">
        Export saves the full local session. Share and print unlock after a story is ready.
      </p>
    </section>
  );
}

function DrawingStep({
  drawing,
  onDrawing,
  onToast,
}: {
  drawing?: DrawingAnalysis;
  onDrawing: (drawing: DrawingAnalysis) => void;
  onToast: (message: string, tone?: Toast['tone']) => void;
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function analyze(file: File) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsAnalyzing(true);
    try {
      onDrawing(await analyzeDrawingFile(file, { signal: controller.signal }));
      return true;
    } catch (error) {
      onToast(formatError(error, 'Drawing analysis failed.'), isDomainError(error) ? 'info' : 'error');
      return false;
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setIsAnalyzing(false);
      }
    }
  }

  async function analyzeFiles(files: File[]) {
    const usable = files.filter((file) => file.type.startsWith('image/'));
    if (usable.length === 0) {
      onToast('No supported image files were found in that selection.', 'error');
      return;
    }

    for (const [index, file] of usable.entries()) {
      if (drawing) {
        onToast(`Replacing the current drawing with ${file.name}.`, 'info');
      }
      const loaded = await analyze(file);
      if (loaded) {
        if (usable.length > 1) {
          onToast(
            `Loaded the first usable drawing from ${usable.length} files. ${usable.length - index - 1} left unused.`,
            'info',
          );
        }
        return;
      }
    }
  }

  async function loadSample() {
    try {
      await analyze(await loadSampleDrawing());
    } catch (error) {
      onToast(formatError(error, 'Sample drawing failed.'), 'error');
    }
  }

  async function readClipboardImage() {
    if (!navigator.clipboard?.read) {
      onToast('Use Ctrl+V or Cmd+V to paste a drawing in this browser.', 'info');
      return;
    }

    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((type) => type.startsWith('image/'));
        if (!imageType) {
          continue;
        }
        const blob = await item.getType(imageType);
        const extension = imageType.split('/')[1] || 'png';
        await analyzeFiles([new File([blob], `clipboard-drawing.${extension}`, { type: imageType })]);
        return;
      }
      onToast('Clipboard did not contain an image.', 'info');
    } catch {
      onToast('Clipboard image access was not granted. Try pasting directly.', 'error');
    }
  }

  const onPasteImage = useEffectEvent((event: ClipboardEvent) => {
    const files = Array.from(event.clipboardData?.files ?? []).filter((file) =>
      file.type.startsWith('image/'),
    );
    if (files.length > 0) {
      event.preventDefault();
      void analyzeFiles(files);
    }
  });

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const files = Array.from(event.clipboardData?.files ?? []).filter((file) =>
        file.type.startsWith('image/'),
      );
      if (files.length > 0) {
        onPasteImage(event);
      }
    }

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  return (
    <div className="step-grid">
      <div
        className={isDragging ? 'drop-zone drop-zone--active' : 'drop-zone'}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          const files = Array.from(event.dataTransfer.files ?? []);
          if (files.length > 0) {
            void analyzeFiles(files);
          }
        }}
      >
        <input
          ref={inputRef}
          className="visually-hidden"
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length > 0) {
              void analyzeFiles(files);
            }
            event.target.value = '';
          }}
        />
        <Brush size={34} />
        <h2>Kid drawing digitizer</h2>
        <p>Upload, drop, paste, or read a drawing from the clipboard.</p>
        <div className="button-row">
          <button className="primary-button" type="button" onClick={() => inputRef.current?.click()}>
            <Upload size={18} />
            Add drawing
          </button>
          <button className="secondary-button" type="button" onClick={() => void loadSample()}>
            <Sparkles size={18} />
            Use sample
          </button>
          <button className="secondary-button" type="button" onClick={() => void readClipboardImage()}>
            <Clipboard size={18} />
            Read clipboard
          </button>
        </div>
        {isAnalyzing && (
          <div className="inline-status">
            <span>
              <Loader2 className="spin" size={18} />
              Reading colors and shapes
            </span>
            <button
              className="text-button text-button--compact"
              type="button"
              onClick={() => abortRef.current?.abort()}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <DrawingSummary drawing={drawing} />
    </div>
  );
}

function DrawingSummary({ drawing }: { drawing?: DrawingAnalysis }) {
  if (!drawing) {
    return (
      <aside className="summary-panel">
        <h2>Character seed</h2>
        <p className="muted">A palette, mood, gift, and bedtime challenge will appear here.</p>
      </aside>
    );
  }

  return (
    <aside className="summary-panel">
      <img className="drawing-preview" src={drawing.previewDataUrl} alt="Digitized kid drawing" />
      <div className={`confidence-banner confidence-banner--${drawing.subject.confidence.label}`}>
        <strong>{drawing.subject.label}</strong>
        <span>
          {drawing.subject.confidence.label} confidence ·{' '}
          {Math.round(drawing.subject.confidence.score * 100)}%
        </span>
      </div>
      <div>
        <h2>{drawing.suggestedName}</h2>
        <p>
          {drawing.characterSeed.mood} {drawing.characterSeed.shape} who {drawing.characterSeed.gift}.
        </p>
      </div>
      <details className="explain-block">
        <summary>Why this guess?</summary>
        <ul>
          {drawing.subject.confidence.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </details>
      {drawing.issues.length > 0 && (
        <div className="issue-list" role="status">
          {drawing.issues.map((issue) => (
            <p key={issue.id}>
              <strong>{issue.message}</strong> {issue.suggestion}
            </p>
          ))}
        </div>
      )}
      <div className="palette" aria-label="Extracted drawing palette">
        {drawing.palette.map((color) => (
          <span key={color.hex} style={{ backgroundColor: color.hex }} title={color.hex} />
        ))}
      </div>
      <dl className="metric-grid">
        <Metric label="Ink" value={`${Math.round(drawing.inkCoverage * 100)}%`} />
        <Metric label="Color" value={`${Math.round(drawing.colorfulness * 100)}%`} />
        <Metric label="Edges" value={`${Math.round(drawing.edgeEnergy * 100)}%`} />
        <Metric label="Quality" value={`${Math.round(drawing.quality.score * 100)}%`} />
      </dl>
    </aside>
  );
}

function CharacterStep({
  drawing,
  character,
  onCharacter,
  onSubjectNameCorrection,
  onNext,
}: {
  drawing?: DrawingAnalysis;
  character: CharacterProfile;
  onCharacter: (character: CharacterProfile) => void;
  onSubjectNameCorrection: (subject: string, name: string) => void;
  onNext: () => void;
}) {
  const update = (patch: Partial<CharacterProfile>) => {
    if (drawing && typeof patch.characterName === 'string') {
      onSubjectNameCorrection(drawing.subject.label, patch.characterName);
    }
    onCharacter({ ...character, ...patch });
  };
  const inferredName = drawing ? toTitleCase(drawing.subject.label) : 'Lumi Sky';

  return (
    <div className="form-grid">
      <div className="form-block">
        <h2>Character</h2>
        <label>
          Character name
          <input
            value={character.characterName}
            placeholder={inferredName}
            onChange={(event) => update({ characterName: event.target.value })}
          />
        </label>
        {drawing && character.characterName.trim() !== inferredName && (
          <button
            className="text-button align-start"
            type="button"
            onClick={() => update({ characterName: inferredName })}
          >
            Use "{inferredName}"
          </button>
        )}
        <label>
          Child name
          <input
            value={character.childName}
            onChange={(event) => update({ childName: event.target.value })}
          />
        </label>
        <label>
          Favorite comfort object
          <input
            value={character.favoriteObject}
            onChange={(event) => update({ favoriteObject: event.target.value })}
          />
        </label>
      </div>

      <div className="form-block">
        <h2>Story shape</h2>
        <label>
          Bedtime place
          <input
            value={character.setting}
            onChange={(event) => update({ setting: event.target.value })}
          />
        </label>
        <label>
          Parent promise
          <textarea
            rows={3}
            value={character.bedtimePromise}
            onChange={(event) => update({ bedtimePromise: event.target.value })}
          />
        </label>
        <fieldset>
          <legend>Tone</legend>
          <div className="segmented">
            {(['cozy', 'silly', 'adventurous', 'tender'] as const).map((tone) => (
              <button
                key={tone}
                type="button"
                className={character.storyTone === tone ? 'segment segment--active' : 'segment'}
                onClick={() => update({ storyTone: tone })}
              >
                {tone}
              </button>
            ))}
          </div>
        </fieldset>
        <button className="primary-button align-start" type="button" onClick={onNext}>
          <BookOpen size={18} />
          Continue to story
        </button>
      </div>
    </div>
  );
}

function StoryStep({
  drawing,
  character,
  story,
  settings,
  onStory,
  onCopyStory,
  onDownloadStory,
  onToast,
  onNext,
}: {
  drawing?: DrawingAnalysis;
  character: CharacterProfile;
  story?: GeneratedStory;
  settings: AppSettings;
  onStory: (story: GeneratedStory) => void;
  onCopyStory: (text: string) => void;
  onDownloadStory: (text: string) => void;
  onToast: (message: string, tone?: Toast['tone']) => void;
  onNext: () => void;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<WebLlmProgress>();
  const canGenerate = Boolean(drawing && character.characterName.trim());
  const localAiAvailable = 'gpu' in navigator;

  function generateLocal() {
    if (!drawing) {
      onToast('Add a drawing first.', 'error');
      return;
    }
    onStory(generateTemplateStory({ drawing, character }));
    onToast('Story composed locally.', 'success');
  }

  async function generateLlm() {
    if (!drawing) {
      onToast('Add a drawing first.', 'error');
      return;
    }

    setIsGenerating(true);
    setProgress(undefined);
    try {
      const result = await generateWithWebLlm({ drawing, character }, setProgress);
      onStory(result);
      onToast('Local AI story generated in this browser.', 'success');
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Local AI generation failed.', 'error');
    } finally {
      setIsGenerating(false);
    }
  }

  const metrics = story
    ? `${story.wordCount} words · about ${story.estimatedMinutes} min`
    : 'No story yet';

  return (
    <div className="story-layout">
      <div className="story-actions">
        <h2>Bedtime story</h2>
        <p className="muted">{metrics}</p>
        {!localAiAvailable && (
          <p className="muted">
            Local AI needs a recent browser with WebGPU. Template story generation remains fully
            supported.
          </p>
        )}
        {story && (
          <p className="provenance-line">
            Story {story.id} · {story.provenance.subject} ·{' '}
            {Math.round(story.provenance.subjectConfidence * 100)}% subject confidence
          </p>
        )}
        <div className="button-row">
          <button
            className="primary-button"
            type="button"
            onClick={
              settings.preferredStoryGenerator === 'local-ai' ? () => void generateLlm() : generateLocal
            }
            disabled={
              !canGenerate || (settings.preferredStoryGenerator === 'local-ai' && !localAiAvailable)
            }
          >
            {settings.preferredStoryGenerator === 'local-ai' ? (
              <BrainCircuit size={18} />
            ) : (
              <Wand2 size={18} />
            )}
            {settings.preferredStoryGenerator === 'local-ai' ? 'Local AI story' : 'Compose story'}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={
              settings.preferredStoryGenerator === 'local-ai' ? generateLocal : () => void generateLlm()
            }
            disabled={
              !canGenerate ||
              isGenerating ||
              (settings.preferredStoryGenerator !== 'local-ai' && !localAiAvailable)
            }
          >
            {isGenerating ? (
              <Loader2 className="spin" size={18} />
            ) : settings.preferredStoryGenerator === 'local-ai' ? (
              <Wand2 size={18} />
            ) : (
              <Sparkles size={18} />
            )}
            {settings.preferredStoryGenerator === 'local-ai' ? 'Template story' : 'Local AI'}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => story && onCopyStory(story.text)}
            disabled={!story}
          >
            <Copy size={18} />
            Copy story
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => story && onDownloadStory(story.text)}
            disabled={!story}
          >
            <Download size={18} />
            Download story
          </button>
        </div>
        {progress && (
          <div className="progress-line">
            <span>{progress.label}</span>
            <progress value={progress.progress} max={1} />
          </div>
        )}
        <button
          className="secondary-button align-start"
          type="button"
          onClick={onNext}
          disabled={!story}
        >
          <Mic size={18} />
          Continue to voice
        </button>
      </div>

      <div className="story-editor">
        <input
          aria-label="Story title"
          value={story?.title ?? ''}
          placeholder="Story title"
          onChange={(event) =>
            story &&
            onStory({
              ...story,
              title: event.target.value,
            })
          }
        />
        <textarea
          aria-label="Story text"
          value={story?.text ?? ''}
          placeholder="Your story will appear here."
          onChange={(event) =>
            story &&
            onStory({
              ...story,
              text: event.target.value,
              wordCount: event.target.value.trim().split(/\s+/).filter(Boolean).length,
              estimatedMinutes: Math.max(
                3,
                Math.round(event.target.value.trim().split(/\s+/).filter(Boolean).length / 145),
              ),
            })
          }
        />
      </div>
    </div>
  );
}

function VoiceStep({
  story,
  voiceProfile,
  onVoiceProfile,
  onToast,
}: {
  story?: GeneratedStory;
  voiceProfile?: VoiceProfile;
  onVoiceProfile: (profile: VoiceProfile) => void;
  onToast: (message: string, tone?: Toast['tone']) => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [spokenChunks, setSpokenChunks] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const narrationRef = useRef<NarrationControls | null>(null);

  useEffect(() => {
    if (!isRecording) {
      return;
    }
    const interval = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      narrationRef.current?.cancel();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia) {
      onToast('Microphone recording is not supported in this browser.', 'error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        analyzeAudioBlob(blob)
          .then((profile) => {
            onVoiceProfile(profile);
            onToast(
              profile.quality.label === 'low'
                ? 'Voice profile created, but the recording needs another take.'
                : 'Parent voice profile created locally.',
              profile.quality.label === 'low' ? 'info' : 'success',
            );
          })
          .catch((error) =>
            onToast(error instanceof Error ? error.message : 'Voice analysis failed.', 'error'),
          );
        stream.getTracks().forEach((track) => track.stop());
      };
      setSeconds(0);
      recorder.start();
      setIsRecording(true);
    } catch {
      onToast('Microphone permission was not granted.', 'error');
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setIsRecording(false);
  }

  function playNarration() {
    if (!story || !voiceProfile) {
      onToast('Create a story and voice profile first.', 'error');
      return;
    }
    if (!canNarrate()) {
      onToast('Speech synthesis is not supported in this browser.', 'error');
      return;
    }

    setIsSpeaking(true);
    narrationRef.current = speakStory(
      story.text,
      voiceProfile,
      (spoken, total) => {
        setSpokenChunks(spoken);
        setTotalChunks(total);
      },
      () => {
        setIsSpeaking(false);
        setIsPaused(false);
        onToast('Narration finished.', 'success');
      },
      (message) => {
        setIsSpeaking(false);
        setIsPaused(false);
        onToast(message, 'error');
      },
    );
  }

  function stopNarration() {
    narrationRef.current?.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }

  const recordingTargetReached = seconds >= 30;
  const progressLabel = totalChunks ? `${spokenChunks}/${totalChunks} narration chunks` : 'Ready';

  return (
    <div className="voice-layout">
      <div className="voice-recorder">
        <h2>Parent voice profile</h2>
        <p className="muted">Record around 30 seconds of bedtime reading.</p>
        <div className="record-meter" aria-label="Recording duration">
          <span>{seconds}s</span>
          <progress value={Math.min(seconds, 30)} max={30} />
        </div>
        <div className="button-row">
          {!isRecording ? (
            <button className="primary-button" type="button" onClick={() => void startRecording()}>
              <Mic size={18} />
              Record
            </button>
          ) : (
            <button className="danger-button" type="button" onClick={stopRecording}>
              <CircleStop size={18} />
              Stop
            </button>
          )}
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              onVoiceProfile(createDemoVoiceProfile());
              onToast('Demo voice profile loaded.', 'success');
            }}
          >
            <Sparkles size={18} />
            Demo voice
          </button>
        </div>
        {recordingTargetReached && isRecording && (
          <p className="inline-status">Enough audio captured.</p>
        )}
      </div>

      <div className="voice-profile-panel">
        <h2>Narration</h2>
        {voiceProfile ? (
          <>
            <dl className="metric-grid">
              <Metric label="Profile" value={voiceProfile.label} />
              <Metric label="Pitch" value={`${Math.round(voiceProfile.averagePitchHz)} Hz`} />
              <Metric label="Warmth" value={`${Math.round(voiceProfile.warmth * 100)}%`} />
              <Metric label="Duration" value={`${Math.round(voiceProfile.durationSeconds)}s`} />
              <Metric
                label="Quality"
                value={`${voiceProfile.quality.label} · ${Math.round(voiceProfile.quality.score * 100)}%`}
              />
            </dl>
            <div className="issue-list">
              {voiceProfile.quality.suggestions.map((suggestion) => (
                <p key={suggestion}>{suggestion}</p>
              ))}
            </div>
          </>
        ) : (
          <p className="muted">Voice profile is waiting.</p>
        )}
        <div className="button-row">
          {!isSpeaking ? (
            <button
              className="primary-button"
              type="button"
              onClick={playNarration}
              disabled={!story || !voiceProfile}
            >
              <Play size={18} />
              Play story
            </button>
          ) : (
            <>
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  if (isPaused) {
                    window.speechSynthesis.resume();
                    setIsPaused(false);
                    return;
                  }
                  window.speechSynthesis.pause();
                  setIsPaused(true);
                }}
              >
                <Pause size={18} />
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button className="danger-button" type="button" onClick={stopNarration}>
                <CircleStop size={18} />
                Stop
              </button>
            </>
          )}
        </div>
        <p className="inline-status">{progressLabel}</p>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function SettingsStep({
  settings,
  onSettings,
  onToast,
}: {
  settings: AppSettings;
  onSettings: (settings: AppSettings) => void;
  onToast: (message: string, tone?: Toast['tone']) => void;
}) {
  const update = (patch: Partial<AppSettings>) => onSettings({ ...settings, ...patch });

  return (
    <div className="settings-grid">
      <section className="form-block">
        <h2>Session settings</h2>
        <label className="toggle-row">
          <span>Autosave locally</span>
          <input
            type="checkbox"
            checked={settings.autosaveEnabled}
            onChange={(event) => {
              update({ autosaveEnabled: event.target.checked });
              onToast(
                event.target.checked
                  ? 'Autosave is back on for this browser.'
                  : 'Autosave is off. The current session stays in memory until you close the page.',
                'info',
              );
            }}
          />
        </label>
        <label className="toggle-row">
          <span>Remember subject name corrections</span>
          <input
            type="checkbox"
            checked={settings.rememberSubjectCorrections}
            onChange={(event) => update({ rememberSubjectCorrections: event.target.checked })}
          />
        </label>
        <label className="toggle-row">
          <span>Show debug details in the app</span>
          <input
            type="checkbox"
            checked={settings.showDebugPanel}
            onChange={(event) => update({ showDebugPanel: event.target.checked })}
          />
        </label>
      </section>

      <section className="form-block">
        <h2>Story defaults</h2>
        <fieldset>
          <legend>Preferred generator</legend>
          <div className="segmented">
            {(['template', 'local-ai'] as const).map((option) => (
              <button
                key={option}
                type="button"
                className={
                  settings.preferredStoryGenerator === option ? 'segment segment--active' : 'segment'
                }
                onClick={() => update({ preferredStoryGenerator: option })}
              >
                {option === 'template' ? 'Template' : 'Local AI'}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="muted">
          Template stories always work. Local AI stays optional and only appears as the default when this
          setting is selected.
        </p>
      </section>
    </div>
  );
}

function DebugPanel({
  drawing,
  story,
  voiceProfile,
  activity,
}: {
  drawing?: DrawingAnalysis;
  story?: GeneratedStory;
  voiceProfile?: VoiceProfile;
  activity: ActivityEvent[];
}) {
  return (
    <section className="debug-panel" aria-label="Debug state">
      <h2>Debug</h2>
      <pre>
        {JSON.stringify(
          {
            app: appMeta,
            drawing: drawing && {
              source: drawing.source,
              subject: drawing.subject,
              quality: drawing.quality,
              issues: drawing.issues,
            },
            story: story && {
              id: story.id,
              provenance: story.provenance,
              wordCount: story.wordCount,
            },
            voiceProfile: voiceProfile && {
              id: voiceProfile.id,
              quality: voiceProfile.quality,
              durationSeconds: voiceProfile.durationSeconds,
            },
            activity,
          },
          null,
          2,
        )}
      </pre>
    </section>
  );
}

function formatError(error: unknown, fallback: string) {
  if (isDomainError(error)) {
    return error.message;
  }
  return error instanceof Error ? error.message : fallback;
}

function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

async function copyText(
  value: string,
  successMessage: string,
  onToast: (message: string, tone?: Toast['tone']) => void,
) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      copyWithSelectionFallback(value);
    }
    onToast(successMessage, 'success');
  } catch {
    try {
      copyWithSelectionFallback(value);
      onToast(successMessage, 'success');
    } catch {
      onToast(
        'Clipboard access is not available in this browser. Use the download action instead.',
        'error',
      );
    }
  }
}

function copyWithSelectionFallback(value: string) {
  const input = document.createElement('textarea');
  input.value = value;
  input.setAttribute('readonly', 'true');
  input.className = 'visually-hidden';
  document.body.append(input);
  input.select();
  const copied = document.execCommand('copy');
  input.remove();
  if (!copied) {
    throw new Error('Clipboard copy fallback failed.');
  }
}

function downloadTextFile(value: string, fileName: string, mimeType: string) {
  const blob = new Blob([value], { type: `${mimeType};charset=utf-8` });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(href);
}

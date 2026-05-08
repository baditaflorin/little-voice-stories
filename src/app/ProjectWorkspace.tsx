import {
  BookOpen,
  Brush,
  CircleStop,
  Eraser,
  GitBranch,
  HeartHandshake,
  Loader2,
  Mic,
  Pause,
  Play,
  Sparkles,
  SquarePen,
  Wand2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
  defaultCharacterProfile,
  generateTemplateStory,
  type CharacterProfile,
  type GeneratedStory,
} from '../features/story/storyEngine';
import { generateWithWebLlm, type WebLlmProgress } from '../features/story/webLlm';
import { canNarrate, speakStory, type NarrationControls } from '../features/voice/narration';
import { appMeta } from '../lib/appMeta';

type StepId = 'drawing' | 'character' | 'story' | 'voice';

type Toast = {
  id: number;
  message: string;
  tone: 'info' | 'success' | 'error';
};

const steps: Array<{ id: StepId; label: string }> = [
  { id: 'drawing', label: 'Drawing' },
  { id: 'character', label: 'Character' },
  { id: 'story', label: 'Story' },
  { id: 'voice', label: 'Voice' },
];

export function ProjectWorkspace() {
  const [activeStep, setActiveStep] = useState<StepId>('drawing');
  const [drawing, setDrawing] = useState<DrawingAnalysis>();
  const [character, setCharacter] = useState<CharacterProfile>(defaultCharacterProfile());
  const [story, setStory] = useState<GeneratedStory>();
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile>();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    loadCurrentProject()
      .then((project) => {
        if (project?.drawing) {
          setDrawing(project.drawing);
        }
        if (project?.character) {
          setCharacter(project.character);
        }
        if (project?.story) {
          setStory(project.story);
        }
        if (project?.voiceProfile) {
          setVoiceProfile(project.voiceProfile);
        }
      })
      .catch(() => pushToast('Saved project could not be restored.', 'error'))
      .finally(() => setHasLoaded(true));
  }, []);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }
    const handle = window.setTimeout(() => {
      saveCurrentProject({ drawing, character, story, voiceProfile }).catch(() =>
        pushToast('Local save failed in this browser.', 'error'),
      );
    }, 400);
    return () => window.clearTimeout(handle);
  }, [character, drawing, hasLoaded, story, voiceProfile]);

  function pushToast(message: string, tone: Toast['tone'] = 'info') {
    const id = Date.now();
    setToasts((items) => [...items, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((items) => items.filter((toast) => toast.id !== id));
    }, 5200);
  }

  async function resetProject() {
    await clearCurrentProject();
    setDrawing(undefined);
    setCharacter(defaultCharacterProfile());
    setStory(undefined);
    setVoiceProfile(undefined);
    setActiveStep('drawing');
    pushToast('Local project cleared.', 'success');
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

        <StepTabs activeStep={activeStep} onChange={setActiveStep} />

        <section className="tool-surface" aria-live="polite">
          {activeStep === 'drawing' && (
            <DrawingStep
              drawing={drawing}
              onDrawing={(analysis) => {
                setDrawing(analysis);
                setCharacter((current) => ({
                  ...current,
                  characterName: current.characterName || analysis.suggestedName,
                }));
                setStory(undefined);
                setActiveStep('character');
                pushToast('Drawing digitized into a character seed.', 'success');
              }}
              onToast={pushToast}
            />
          )}

          {activeStep === 'character' && (
            <CharacterStep
              drawing={drawing}
              character={character}
              onCharacter={setCharacter}
              onNext={() => setActiveStep('story')}
            />
          )}

          {activeStep === 'story' && (
            <StoryStep
              drawing={drawing}
              character={character}
              story={story}
              onStory={setStory}
              onToast={pushToast}
              onNext={() => setActiveStep('voice')}
            />
          )}

          {activeStep === 'voice' && (
            <VoiceStep
              story={story}
              voiceProfile={voiceProfile}
              onVoiceProfile={setVoiceProfile}
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

function StepTabs({ activeStep, onChange }: { activeStep: StepId; onChange: (step: StepId) => void }) {
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

  async function analyze(file: File) {
    setIsAnalyzing(true);
    try {
      onDrawing(await analyzeDrawingFile(file));
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Drawing analysis failed.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function loadSample() {
    setIsAnalyzing(true);
    try {
      onDrawing(await analyzeDrawingFile(await loadSampleDrawing()));
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Sample drawing failed.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  }

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
          const file = event.dataTransfer.files[0];
          if (file) {
            void analyze(file);
          }
        }}
      >
        <input
          ref={inputRef}
          className="visually-hidden"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void analyze(file);
            }
          }}
        />
        <Brush size={34} />
        <h2>Kid drawing digitizer</h2>
        <p>Drop a drawing or load the sample character.</p>
        <div className="button-row">
          <button className="primary-button" type="button" onClick={() => inputRef.current?.click()}>
            <SquarePen size={18} />
            Upload drawing
          </button>
          <button className="secondary-button" type="button" onClick={() => void loadSample()}>
            <Sparkles size={18} />
            Use sample
          </button>
        </div>
        {isAnalyzing && (
          <p className="inline-status">
            <Loader2 className="spin" size={18} />
            Reading colors and shapes
          </p>
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
      <div>
        <h2>{drawing.suggestedName}</h2>
        <p>
          {drawing.characterSeed.mood} {drawing.characterSeed.shape} who {drawing.characterSeed.gift}.
        </p>
      </div>
      <div className="palette" aria-label="Extracted drawing palette">
        {drawing.palette.map((color) => (
          <span key={color.hex} style={{ backgroundColor: color.hex }} title={color.hex} />
        ))}
      </div>
      <dl className="metric-grid">
        <Metric label="Ink" value={`${Math.round(drawing.inkCoverage * 100)}%`} />
        <Metric label="Color" value={`${Math.round(drawing.colorfulness * 100)}%`} />
        <Metric label="Edges" value={`${Math.round(drawing.edgeEnergy * 100)}%`} />
      </dl>
    </aside>
  );
}

function CharacterStep({
  drawing,
  character,
  onCharacter,
  onNext,
}: {
  drawing?: DrawingAnalysis;
  character: CharacterProfile;
  onCharacter: (character: CharacterProfile) => void;
  onNext: () => void;
}) {
  const update = (patch: Partial<CharacterProfile>) => onCharacter({ ...character, ...patch });

  return (
    <div className="form-grid">
      <div className="form-block">
        <h2>Character</h2>
        <label>
          Character name
          <input
            value={character.characterName}
            placeholder={drawing?.suggestedName ?? 'Lumi Sky'}
            onChange={(event) => update({ characterName: event.target.value })}
          />
        </label>
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
  onStory,
  onToast,
  onNext,
}: {
  drawing?: DrawingAnalysis;
  character: CharacterProfile;
  story?: GeneratedStory;
  onStory: (story: GeneratedStory) => void;
  onToast: (message: string, tone?: Toast['tone']) => void;
  onNext: () => void;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<WebLlmProgress>();
  const canGenerate = Boolean(drawing && character.characterName.trim());

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
        <div className="button-row">
          <button
            className="primary-button"
            type="button"
            onClick={generateLocal}
            disabled={!canGenerate}
          >
            <Wand2 size={18} />
            Compose story
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => void generateLlm()}
            disabled={!canGenerate || isGenerating}
          >
            {isGenerating ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
            Local AI
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
            onToast('Parent voice profile created locally.', 'success');
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
        onToast('Narration finished.', 'success');
      },
      (message) => {
        setIsSpeaking(false);
        onToast(message, 'error');
      },
    );
  }

  function stopNarration() {
    narrationRef.current?.cancel();
    setIsSpeaking(false);
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
          <dl className="metric-grid">
            <Metric label="Profile" value={voiceProfile.label} />
            <Metric label="Pitch" value={`${Math.round(voiceProfile.averagePitchHz)} Hz`} />
            <Metric label="Warmth" value={`${Math.round(voiceProfile.warmth * 100)}%`} />
            <Metric label="Duration" value={`${Math.round(voiceProfile.durationSeconds)}s`} />
          </dl>
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
                onClick={() => window.speechSynthesis.pause()}
              >
                <Pause size={18} />
                Pause
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

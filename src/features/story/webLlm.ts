import type { StoryInputs } from './storyEngine';
import { buildLocalLlmPrompt, countWords, generatedStorySchema } from './storyEngine';

const MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';

export type WebLlmProgress = {
  label: string;
  progress: number;
};

export async function generateWithWebLlm(
  inputs: StoryInputs,
  onProgress: (progress: WebLlmProgress) => void,
) {
  if (!('gpu' in navigator)) {
    throw new Error('WebGPU is not available in this browser.');
  }

  onProgress({ label: 'Loading local model runtime', progress: 0.05 });
  const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
  const engine = await CreateMLCEngine(MODEL_ID, {
    initProgressCallback: (report: { progress?: number; text?: string }) => {
      onProgress({
        label: report.text ?? 'Loading local model',
        progress: report.progress ?? 0.25,
      });
    },
  });

  onProgress({ label: 'Writing bedtime story locally', progress: 0.92 });
  const completion = await engine.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          'You are a gentle bedtime storyteller. You write specific, soothing stories for young children.',
      },
      { role: 'user', content: buildLocalLlmPrompt(inputs) },
    ],
    temperature: 0.8,
    max_tokens: 900,
  });

  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) {
    throw new Error('The local model did not return a story.');
  }

  return generatedStorySchema.parse({
    id: `story-web-llm-${inputs.drawing.source.id.slice(0, 8)}`,
    title: `${inputs.character.characterName || inputs.drawing.suggestedName}'s Bedtime Road`,
    text,
    estimatedMinutes: Math.max(3, Math.round(countWords(text) / 145)),
    wordCount: countWords(text),
    generatedBy: 'web-llm',
    provenance: {
      schemaVersion: 'story.v2',
      appVersion: __APP_VERSION__,
      drawingSourceId: inputs.drawing.source.id,
      subject: inputs.drawing.subject.label,
      subjectConfidence: inputs.drawing.subject.confidence.score,
      storyTone: inputs.character.storyTone,
    },
  });
}

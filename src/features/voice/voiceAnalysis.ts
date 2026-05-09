import { z } from 'zod';

import { DomainError } from '../../lib/domainError';

export const voiceProfileSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  durationSeconds: z.number(),
  averagePitchHz: z.number(),
  energy: z.number(),
  warmth: z.number(),
  speechPitch: z.number(),
  speechRate: z.number(),
  speechVolume: z.number(),
  label: z.string(),
  quality: z.object({
    score: z.number().min(0).max(1),
    label: z.enum(['high', 'medium', 'low']),
    issues: z.array(z.string()),
    suggestions: z.array(z.string()),
  }),
});

export type VoiceProfile = z.infer<typeof voiceProfileSchema>;

export function validateVoiceRecordingSource(file: Pick<File, 'name' | 'size' | 'type'>) {
  if (file.type.startsWith('audio/') || /\.(mp3|m4a|wav|ogg|flac)$/i.test(file.name)) {
    throw new DomainError(
      'unsupported-format',
      'Imported audio is not supported for the parent voice profile in v1.',
      'Use the microphone to record about 30 seconds from a single parent in a quiet room.',
    );
  }
}

export async function analyzeAudioBlob(blob: Blob): Promise<VoiceProfile> {
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error('Audio analysis is not supported in this browser.');
  }

  const context = new AudioContextClass();
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = await context.decodeAudioData(arrayBuffer.slice(0));
  const channel = buffer.getChannelData(0);
  const profile = analyzeSamples(channel, buffer.sampleRate, buffer.duration);
  await context.close();
  return profile;
}

export function analyzeSamples(
  samples: Float32Array,
  sampleRate: number,
  durationSeconds: number,
): VoiceProfile {
  const rms = rootMeanSquare(samples);
  const averagePitchHz = estimatePitchByZeroCrossing(samples, sampleRate, durationSeconds);
  const warmth = estimateWarmth(samples);
  const clippingRatio = estimateClipping(samples);
  const quality = assessVoiceQuality({
    durationSeconds,
    energy: rms,
    warmth,
    clippingRatio,
  });
  const speechPitch = clamp(0.72 + (averagePitchHz - 120) / 220, 0.55, 1.65);
  const speechRate = clamp(0.86 + warmth * 0.18 - rms * 0.08, 0.72, 1.08);
  const speechVolume = clamp(0.82 + rms * 1.3, 0.72, 1);
  const label =
    warmth > 0.58 ? 'warm and close' : averagePitchHz > 175 ? 'bright and gentle' : 'calm and steady';

  return voiceProfileSchema.parse({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    durationSeconds,
    averagePitchHz,
    energy: rms,
    warmth,
    speechPitch,
    speechRate,
    speechVolume,
    label,
    quality,
  });
}

export function createDemoVoiceProfile(): VoiceProfile {
  return voiceProfileSchema.parse({
    id: 'demo-parent-voice',
    createdAt: new Date().toISOString(),
    durationSeconds: 30,
    averagePitchHz: 142,
    energy: 0.18,
    warmth: 0.72,
    speechPitch: 0.82,
    speechRate: 0.9,
    speechVolume: 0.92,
    label: 'warm and close',
    quality: {
      score: 0.86,
      label: 'high',
      issues: [],
      suggestions: ['Demo profile is ready for local narration.'],
    },
  });
}

export function assessVoiceQuality(input: {
  durationSeconds: number;
  energy: number;
  warmth: number;
  clippingRatio: number;
}) {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 0.88;

  if (input.durationSeconds < 20) {
    issues.push('too-short');
    suggestions.push('Record closer to 30 seconds of steady bedtime reading.');
    score -= 0.34;
  }
  if (input.energy < 0.025) {
    issues.push('too-quiet');
    suggestions.push('Move closer to the microphone or speak a little louder.');
    score -= 0.24;
  }
  if (input.warmth < 0.38) {
    issues.push('too-noisy-or-thin');
    suggestions.push('Try a quieter room and read at a relaxed pace.');
    score -= 0.2;
  }
  if (input.clippingRatio > 0.015) {
    issues.push('clipping');
    suggestions.push('Move slightly farther from the microphone.');
    score -= 0.16;
  }

  const normalized = clamp(score, 0.08, 0.96);
  return {
    score: normalized,
    label: normalized >= 0.72 ? 'high' : normalized >= 0.52 ? 'medium' : 'low',
    issues,
    suggestions: suggestions.length ? suggestions : ['Voice sample is usable for local narration.'],
  } as const;
}

function rootMeanSquare(samples: Float32Array) {
  if (samples.length === 0) {
    return 0;
  }

  let sum = 0;
  const stride = Math.max(1, Math.floor(samples.length / 48000));
  for (let index = 0; index < samples.length; index += stride) {
    sum += samples[index] * samples[index];
  }
  return Math.sqrt(sum / Math.ceil(samples.length / stride));
}

function estimatePitchByZeroCrossing(
  samples: Float32Array,
  sampleRate: number,
  durationSeconds: number,
) {
  if (samples.length < 2 || durationSeconds <= 0) {
    return 140;
  }

  let crossings = 0;
  const stride = Math.max(1, Math.floor(samples.length / 96000));
  let previous = samples[0];
  for (let index = stride; index < samples.length; index += stride) {
    const current = samples[index];
    if (previous <= 0 && current > 0) {
      crossings += 1;
    }
    previous = current;
  }

  const adjustedDuration = (samples.length / stride / sampleRate) * stride;
  return clamp(crossings / Math.max(0.01, adjustedDuration), 85, 255);
}

function estimateWarmth(samples: Float32Array) {
  if (samples.length < 3) {
    return 0.6;
  }

  let smoothness = 0;
  const stride = Math.max(1, Math.floor(samples.length / 42000));
  for (let index = stride; index < samples.length; index += stride) {
    smoothness += Math.abs(samples[index] - samples[index - stride]);
  }
  return clamp(1 - smoothness / Math.ceil(samples.length / stride) / 0.18, 0.25, 0.9);
}

function estimateClipping(samples: Float32Array) {
  if (samples.length === 0) {
    return 0;
  }

  let clipped = 0;
  const stride = Math.max(1, Math.floor(samples.length / 48000));
  for (let index = 0; index < samples.length; index += stride) {
    if (Math.abs(samples[index]) > 0.98) {
      clipped += 1;
    }
  }
  return clipped / Math.ceil(samples.length / stride);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

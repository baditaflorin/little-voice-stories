import { z } from 'zod';

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
});

export type VoiceProfile = z.infer<typeof voiceProfileSchema>;

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
  });
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

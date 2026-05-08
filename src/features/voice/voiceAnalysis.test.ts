import { describe, expect, it, vi } from 'vitest';

import { analyzeSamples, createDemoVoiceProfile } from './voiceAnalysis';

vi.stubGlobal('crypto', {
  randomUUID: () => 'test-uuid',
});

describe('voice profile analysis', () => {
  it('maps a simple waveform into narration settings', () => {
    const sampleRate = 48_000;
    const duration = 1;
    const samples = new Float32Array(sampleRate * duration);
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] = Math.sin((2 * Math.PI * 140 * index) / sampleRate) * 0.25;
    }

    const profile = analyzeSamples(samples, sampleRate, duration);

    expect(profile.averagePitchHz).toBeGreaterThan(120);
    expect(profile.averagePitchHz).toBeLessThan(160);
    expect(profile.speechRate).toBeGreaterThan(0.7);
    expect(profile.speechVolume).toBeGreaterThan(0.7);
  });

  it('creates a reusable demo voice profile', () => {
    expect(createDemoVoiceProfile().label).toBe('warm and close');
  });
});

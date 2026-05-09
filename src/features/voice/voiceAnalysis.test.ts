import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { isDomainError } from '../../lib/domainError';
import {
  analyzeSamples,
  assessVoiceQuality,
  createDemoVoiceProfile,
  validateVoiceRecordingSource,
} from './voiceAnalysis';

type VoiceFixture = {
  fileName: string;
  mimeType: string;
  bytes: number;
  voiceSignals: {
    durationSeconds: number;
    energy: number;
    warmth: number;
    clippingRatio: number;
  };
};

type VoiceExpectation = {
  minimumQualityIssues?: number;
  expectedIssues?: string[];
  maximumQualityScore?: number;
  expectedErrorKind?: string;
  expectedMessageWords?: string[];
};

const realDataDir = join(process.cwd(), 'test/fixtures/realdata');

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
    expect(profile.quality.issues).toContain('too-short');
  });

  it('creates a reusable demo voice profile', () => {
    const profile = createDemoVoiceProfile();
    expect(profile.label).toBe('warm and close');
    expect(profile.quality.label).toBe('high');
  });

  it('flags short and noisy voice samples before narration', () => {
    const input = readFixture<VoiceFixture>('short-noisy-voice.input.json');
    const expected = readFixture<VoiceExpectation>('short-noisy-voice.expected.json');
    const quality = assessVoiceQuality(input.voiceSignals);

    expect(quality.score).toBeLessThanOrEqual(expected.maximumQualityScore ?? 1);
    expect(quality.issues.length).toBeGreaterThanOrEqual(expected.minimumQualityIssues ?? 0);
    expect(quality.issues).toEqual(expect.arrayContaining(expected.expectedIssues ?? []));
  });

  it('explains why imported public audio is out of scope for v1', () => {
    const input = readFixture<VoiceFixture>('long-multispeaker-audio.input.json');
    const expected = readFixture<VoiceExpectation>('long-multispeaker-audio.expected.json');

    try {
      validateVoiceRecordingSource({
        name: input.fileName,
        type: input.mimeType,
        size: input.bytes,
      });
      throw new Error('Expected imported audio to be rejected.');
    } catch (error) {
      expect(isDomainError(error)).toBe(true);
      if (isDomainError(error)) {
        expect(error.kind).toBe(expected.expectedErrorKind);
        for (const word of expected.expectedMessageWords ?? []) {
          expect(error.message.toLowerCase()).toContain(word.toLowerCase());
        }
      }
    }
  });
});

function readFixture<T>(fileName: string): T {
  return JSON.parse(readFileSync(join(realDataDir, fileName), 'utf8')) as T;
}

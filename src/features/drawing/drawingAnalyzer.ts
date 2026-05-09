import { z } from 'zod';

import { DomainError } from '../../lib/domainError';

export const confidenceSchema = z.object({
  score: z.number().min(0).max(1),
  label: z.enum(['high', 'medium', 'low']),
  reasons: z.array(z.string()),
});

export const inferenceIssueSchema = z.object({
  id: z.string(),
  severity: z.enum(['info', 'warning', 'error']),
  message: z.string(),
  suggestion: z.string(),
});

export const paletteColorSchema = z.object({
  hex: z.string(),
  population: z.number(),
});

export const drawingSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  size: z.number(),
});

export const drawingSubjectSchema = z.object({
  label: z.string(),
  sceneType: z.enum(['character', 'place', 'mixed', 'abstract', 'unknown']),
  confidence: confidenceSchema,
  storyHints: z.array(z.string()),
});

export const drawingAnalysisSchema = z.object({
  previewDataUrl: z.string(),
  width: z.number(),
  height: z.number(),
  source: drawingSourceSchema,
  palette: z.array(paletteColorSchema),
  inkCoverage: z.number(),
  colorfulness: z.number(),
  brightness: z.number(),
  edgeEnergy: z.number(),
  suggestedName: z.string(),
  characterSeed: z.object({
    shape: z.string(),
    mood: z.string(),
    gift: z.string(),
    challenge: z.string(),
  }),
  subject: drawingSubjectSchema,
  quality: confidenceSchema,
  issues: z.array(inferenceIssueSchema),
});

export type Confidence = z.infer<typeof confidenceSchema>;
export type DrawingAnalysis = z.infer<typeof drawingAnalysisSchema>;
export type DrawingSubject = z.infer<typeof drawingSubjectSchema>;
export type InferenceIssue = z.infer<typeof inferenceIssueSchema>;
export type PaletteColor = z.infer<typeof paletteColorSchema>;

export type DrawingSignalInput = {
  width: number;
  height: number;
  inkCoverage: number;
  colorfulness: number;
  brightness: number;
  edgeEnergy: number;
  palette: string[];
};

type PixelFeatures = Omit<
  DrawingAnalysis,
  'previewDataUrl' | 'width' | 'height' | 'source' | 'subject' | 'quality' | 'issues'
>;

type DecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
};

type AnalyzeOptions = {
  signal?: AbortSignal;
};

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const SUPPORTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);

const DEFAULT_PALETTE: PaletteColor[] = [
  { hex: '#2563eb', population: 1 },
  { hex: '#f97316', population: 1 },
  { hex: '#0f766e', population: 1 },
];
const analysisCache = new Map<string, DrawingAnalysis>();

const SHAPES = ['cloud-skipper', 'moon cartographer', 'pocket comet', 'pillow knight'];
const MOODS = ['gentle', 'brave', 'curious', 'sparkly', 'steady'];
const GIFTS = [
  'listens to tiny sounds',
  'finds paths in the dark',
  'makes lost things giggle',
  'keeps promises warm',
];
const CHALLENGES = [
  'learning to rest',
  'asking for help',
  'sharing the spotlight',
  'crossing a sleepy forest',
];

const SUBJECT_KEYWORDS: Array<{
  words: string[];
  label: string;
  sceneType: DrawingSubject['sceneType'];
  hints: string[];
}> = [
  {
    words: ['love', 'text', 'letter'],
    label: 'family and house',
    sceneType: 'mixed',
    hints: ['family', 'house'],
  },
  {
    words: ['house', 'home', 'tree', 'apple'],
    label: 'house and tree',
    sceneType: 'place',
    hints: ['house', 'tree'],
  },
  {
    words: ['family', 'mom', 'dad', 'people', 'person'],
    label: 'family',
    sceneType: 'character',
    hints: ['family'],
  },
  {
    words: ['smiley', 'face', 'portrait'],
    label: 'smiley face',
    sceneType: 'character',
    hints: ['face'],
  },
  {
    words: ['dragon', 'monster', 'creature'],
    label: 'creature',
    sceneType: 'character',
    hints: ['creature'],
  },
  {
    words: ['cover', 'story', 'book'],
    label: 'story cover',
    sceneType: 'mixed',
    hints: ['story cover'],
  },
  { words: ['בית', 'ילד'], label: 'house', sceneType: 'place', hints: ['house'] },
];

export async function analyzeDrawingFile(
  file: File,
  options: AnalyzeOptions = {},
): Promise<DrawingAnalysis> {
  validateDrawingFile(file);
  throwIfCancelled(options.signal);

  const source = await sourceMetadata(file);
  const cached = analysisCache.get(source.id);
  if (cached) {
    return cached;
  }

  const decoded = await decodeImage(file).catch((error: unknown) => {
    if (error instanceof DomainError) {
      throw error;
    }
    throw new DomainError(
      'decode-failed',
      'This drawing could not be opened as an image.',
      'Try a clear PNG, JPEG, WebP, or SVG photo of the drawing.',
    );
  });
  throwIfCancelled(options.signal);

  const maxSide = 680;
  const scale = Math.min(1, maxSide / Math.max(decoded.width, decoded.height));
  const width = Math.max(1, Math.round(decoded.width * scale));
  const height = Math.max(1, Math.round(decoded.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    throw new DomainError(
      'decode-failed',
      'This browser could not create a drawing canvas.',
      'Try a current desktop browser or a smaller image.',
    );
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(decoded.source, 0, 0, width, height);
  decoded.cleanup();

  const imageData = context.getImageData(0, 0, width, height);
  const features = extractDrawingFeatures(imageData.data, width, height);
  const intelligence = inferDrawingIntelligence({
    source,
    width,
    height,
    inkCoverage: features.inkCoverage,
    colorfulness: features.colorfulness,
    brightness: features.brightness,
    edgeEnergy: features.edgeEnergy,
    palette: features.palette.map((color) => color.hex),
  });

  const analysis = drawingAnalysisSchema.parse({
    previewDataUrl: canvas.toDataURL('image/webp', 0.86),
    width,
    height,
    source,
    ...features,
    ...intelligence,
  });
  analysisCache.set(source.id, analysis);
  return analysis;
}

export function validateDrawingFile(file: Pick<File, 'name' | 'size' | 'type'>) {
  const lowerName = normalizeText(file.name);
  if (file.size > MAX_FILE_BYTES) {
    throw new DomainError(
      'file-too-large',
      'This drawing file is too large for the local browser analyzer.',
      'Use a photo under 15MB or crop the drawing first.',
    );
  }

  if (file.type === 'application/pdf' || lowerName.endsWith('.pdf')) {
    throw new DomainError(
      'unsupported-format',
      'This looks like a PDF, not a drawing image.',
      'Export or photograph one page as PNG, JPEG, WebP, or SVG.',
    );
  }

  if (file.type && !SUPPORTED_TYPES.has(file.type)) {
    throw new DomainError(
      'unsupported-format',
      `This file type is ${file.type}, which the drawing analyzer cannot read.`,
      'Use PNG, JPEG, WebP, or SVG.',
    );
  }
}

async function sourceMetadata(file: File) {
  const id = await stableFileId(file);
  return drawingSourceSchema.parse({
    id,
    name: file.name,
    type: file.type || inferTypeFromName(file.name),
    size: file.size,
  });
}

async function stableFileId(file: File) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)]
    .slice(0, 12)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function decodeImage(file: File): Promise<DecodedImage> {
  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // Some browsers reject SVG blobs here; the image element path handles them.
    }
  }

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = 'async';
  image.src = objectUrl;
  await image.decode();
  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    cleanup: () => URL.revokeObjectURL(objectUrl),
  };
}

export async function loadSampleDrawing(): Promise<File> {
  const response = await fetch(`${import.meta.env.BASE_URL}sample-drawing.svg`);
  if (!response.ok) {
    throw new DomainError(
      'decode-failed',
      'The sample drawing could not be loaded.',
      'Try uploading a local drawing instead.',
    );
  }
  const blob = await response.blob();
  return new File([blob], 'sample-house-tree-character.svg', { type: 'image/svg+xml' });
}

export function extractDrawingFeatures(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): PixelFeatures {
  const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();
  let inkPixels = 0;
  let totalBrightness = 0;
  let colorfulnessTotal = 0;
  let edgeTotal = 0;
  let considered = 0;
  const stride = width > 420 ? 2 : 1;

  for (let y = 0; y < height; y += stride) {
    for (let x = 0; x < width; x += stride) {
      const offset = (y * width + x) * 4;
      const alpha = pixels[offset + 3] / 255;
      if (alpha < 0.1) {
        continue;
      }

      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      const brightness = luminance(red, green, blue);
      const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);
      const isInk = brightness < 244 || saturation > 26;

      considered += 1;
      totalBrightness += brightness;
      colorfulnessTotal += saturation;

      if (isInk) {
        inkPixels += 1;
        const key = `${Math.round(red / 32) * 32},${Math.round(green / 32) * 32},${
          Math.round(blue / 32) * 32
        }`;
        const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, count: 0 };
        bucket.r += red;
        bucket.g += green;
        bucket.b += blue;
        bucket.count += 1;
        buckets.set(key, bucket);
      }

      if (x > 0 && y > 0) {
        const left = (y * width + x - 1) * 4;
        const up = ((y - 1) * width + x) * 4;
        edgeTotal +=
          Math.abs(brightness - luminance(pixels[left], pixels[left + 1], pixels[left + 2])) +
          Math.abs(brightness - luminance(pixels[up], pixels[up + 1], pixels[up + 2]));
      }
    }
  }

  const palette = [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((bucket) => ({
      hex: rgbToHex(bucket.r / bucket.count, bucket.g / bucket.count, bucket.b / bucket.count),
      population: bucket.count,
    }));

  const safeConsidered = Math.max(1, considered);
  const inkCoverage = inkPixels / safeConsidered;
  const brightness = totalBrightness / safeConsidered / 255;
  const colorfulness = colorfulnessTotal / safeConsidered / 255;
  const edgeEnergy = Math.min(1, edgeTotal / safeConsidered / 255);
  const chosenPalette = palette.length > 0 ? palette : DEFAULT_PALETTE;

  return {
    palette: chosenPalette,
    inkCoverage,
    colorfulness,
    brightness,
    edgeEnergy,
    suggestedName: suggestCharacterName(chosenPalette, inkCoverage, colorfulness, edgeEnergy),
    characterSeed: {
      shape: pickByMetric(SHAPES, edgeEnergy + inkCoverage),
      mood: pickByMetric(MOODS, brightness + colorfulness),
      gift: pickByMetric(GIFTS, colorfulness + edgeEnergy),
      challenge: pickByMetric(CHALLENGES, inkCoverage + 1 - brightness),
    },
  };
}

export function inferDrawingIntelligence(input: {
  source: { name: string; type: string; size: number };
  width: number;
  height: number;
  inkCoverage: number;
  colorfulness: number;
  brightness: number;
  edgeEnergy: number;
  palette: string[];
}) {
  const issues: InferenceIssue[] = [];
  const normalizedName = normalizeText(input.source.name);
  const keyword = SUBJECT_KEYWORDS.find((candidate) =>
    candidate.words.some((word) => normalizedName.includes(normalizeText(word))),
  );
  const storyHints = new Set<string>();

  let subjectLabel = 'drawing character';
  let sceneType: DrawingSubject['sceneType'] = 'unknown';
  let subjectScore = 0.42;
  const subjectReasons: string[] = [];

  if (keyword) {
    subjectLabel = keyword.label;
    sceneType = keyword.sceneType;
    subjectScore = 0.76;
    keyword.hints.forEach((hint) => storyHints.add(hint));
    subjectReasons.push(`Filename contains ${keyword.words.slice(0, 2).join(' / ')}.`);
  } else if (input.inkCoverage < 0.035) {
    subjectLabel = input.colorfulness < 0.04 ? 'faint drawing' : 'small scribble';
    sceneType = 'abstract';
    subjectScore = 0.34;
    storyHints.add('small marks');
    subjectReasons.push('The drawing has very little visible ink.');
  } else if (input.colorfulness > 0.45 && input.edgeEnergy > 0.32) {
    subjectLabel = 'busy colorful character';
    sceneType = 'mixed';
    subjectScore = 0.54;
    storyHints.add('colorful details');
    subjectReasons.push('The drawing has many colorful edges and shapes.');
  } else {
    storyHints.add('crayon lines');
    subjectReasons.push('No clear subject word was available, so the app kept the guess broad.');
  }

  if (/img_|photo|table|shadow/.test(normalizedName) || input.brightness < 0.55) {
    issues.push({
      id: 'photo-shadow-risk',
      severity: 'warning',
      message: 'This looks like a photo of paper with possible shadows or background.',
      suggestion: 'Crop closer to the drawing or take a brighter photo.',
    });
    if (!keyword) {
      subjectLabel = 'drawing photo';
      subjectScore = 0.48;
    }
    subjectScore = Math.min(subjectScore, 0.48);
  }

  if (input.source.size > 5 * 1024 * 1024 || Math.max(input.width, input.height) > 3000) {
    issues.push({
      id: 'large-file',
      severity: 'info',
      message: 'This is a large drawing file for an in-browser analyzer.',
      suggestion: 'The app will downscale it locally; cancel and crop first if it feels slow.',
    });
  }

  if (input.inkCoverage < 0.04) {
    if (!keyword) {
      sceneType = 'unknown';
    } else {
      subjectScore = Math.min(subjectScore, 0.7);
    }
    issues.push({
      id: 'sparse-drawing',
      severity: 'warning',
      message: 'The drawing has very little visible ink.',
      suggestion: 'Add a note or retake the photo closer to the page.',
    });
  }

  if (input.brightness > 0.92 && input.colorfulness < 0.05) {
    issues.push({
      id: 'low-contrast',
      severity: 'warning',
      message: 'The drawing is very faint or low contrast.',
      suggestion: 'Use a darker photo or brighter lighting.',
    });
    if (!keyword) {
      subjectLabel = 'faint drawing';
      sceneType = 'unknown';
    }
    subjectScore = Math.min(subjectScore, 0.4);
  }

  if (/love|mom|dad|people|house/.test(normalizedName) && /text|letter|love/.test(normalizedName)) {
    issues.push({
      id: 'mixed-subjects',
      severity: 'info',
      message: 'The drawing may contain both characters and words.',
      suggestion: 'Choose the part of the drawing that should star in the story.',
    });
    sceneType = 'mixed';
    storyHints.add('message on the page');
  }

  input.palette.slice(0, 3).forEach((color) => storyHints.add(color));
  const qualityScore = clamp(
    0.35 + input.inkCoverage * 0.45 + input.colorfulness * 0.25 + input.edgeEnergy * 0.2,
    0.1,
    0.95,
  );
  const issuePenalty = issues.filter((issue) => issue.severity === 'warning').length * 0.09;
  const quality = confidence(
    clamp(qualityScore - issuePenalty, 0.1, 0.95),
    issues.length
      ? ['Quality estimate lowered by drawing issues.']
      : ['Drawing has enough visible marks for a useful first pass.'],
  );

  return {
    subject: {
      label: subjectLabel,
      sceneType,
      confidence: confidence(subjectScore - issuePenalty, subjectReasons),
      storyHints: [...storyHints].slice(0, 6),
    },
    quality,
    issues,
  };
}

function confidence(score: number, reasons: string[]): Confidence {
  const normalized = clamp(score, 0, 1);
  return {
    score: normalized,
    label: normalized >= 0.72 ? 'high' : normalized >= 0.5 ? 'medium' : 'low',
    reasons,
  };
}

function throwIfCancelled(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DomainError(
      'analysis-cancelled',
      'Drawing analysis was cancelled.',
      'Your previous drawing state is still intact.',
    );
  }
}

function inferTypeFromName(name: string) {
  const lowerName = normalizeText(name);
  if (lowerName.endsWith('.png')) return 'image/png';
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'image/jpeg';
  if (lowerName.endsWith('.webp')) return 'image/webp';
  if (lowerName.endsWith('.svg')) return 'image/svg+xml';
  return 'unknown';
}

function normalizeText(value: string) {
  return value.normalize('NFKC').replace(/\s+/g, ' ').toLowerCase();
}

function suggestCharacterName(
  palette: PaletteColor[],
  inkCoverage: number,
  colorfulness: number,
  edgeEnergy: number,
) {
  const hueName = colorName(palette[0]?.hex ?? '#2563eb');
  const energyName = edgeEnergy > 0.35 ? 'Zig' : inkCoverage > 0.28 ? 'Moss' : 'Lumi';
  const sparkle = colorfulness > 0.28 ? 'Rainbow' : hueName;
  return `${energyName} ${sparkle}`;
}

function luminance(red: number, green: number, blue: number) {
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue]
    .map((value) =>
      Math.max(0, Math.min(255, Math.round(value)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

function colorName(hex: string) {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);

  if (red > green && red > blue) {
    return red > 210 ? 'Coral' : 'Berry';
  }
  if (green > red && green > blue) {
    return green > 150 ? 'Mint' : 'Forest';
  }
  if (blue > red && blue > green) {
    return blue > 170 ? 'Sky' : 'Indigo';
  }
  return 'Golden';
}

function pickByMetric<T>(items: T[], metric: number) {
  const index = Math.abs(Math.round(metric * 10)) % items.length;
  return items[index];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

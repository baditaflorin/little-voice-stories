import { z } from 'zod';

export const paletteColorSchema = z.object({
  hex: z.string(),
  population: z.number(),
});

export const drawingAnalysisSchema = z.object({
  previewDataUrl: z.string(),
  width: z.number(),
  height: z.number(),
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
});

export type DrawingAnalysis = z.infer<typeof drawingAnalysisSchema>;
export type PaletteColor = z.infer<typeof paletteColorSchema>;

type PixelFeatures = Omit<DrawingAnalysis, 'previewDataUrl' | 'width' | 'height'>;
type DecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
};

const DEFAULT_PALETTE: PaletteColor[] = [
  { hex: '#2563eb', population: 1 },
  { hex: '#f97316', population: 1 },
  { hex: '#0f766e', population: 1 },
];

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

export async function analyzeDrawingFile(file: File): Promise<DrawingAnalysis> {
  const decoded = await decodeImage(file);
  const maxSide = 680;
  const scale = Math.min(1, maxSide / Math.max(decoded.width, decoded.height));
  const width = Math.max(1, Math.round(decoded.width * scale));
  const height = Math.max(1, Math.round(decoded.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    throw new Error('Canvas is unavailable in this browser.');
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(decoded.source, 0, 0, width, height);
  decoded.cleanup();

  const imageData = context.getImageData(0, 0, width, height);
  const features = extractDrawingFeatures(imageData.data, width, height);

  return drawingAnalysisSchema.parse({
    previewDataUrl: canvas.toDataURL('image/webp', 0.86),
    width,
    height,
    ...features,
  });
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
    throw new Error('Sample drawing could not be loaded.');
  }
  const blob = await response.blob();
  return new File([blob], 'sample-drawing.svg', { type: 'image/svg+xml' });
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

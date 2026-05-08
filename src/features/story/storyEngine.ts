import { z } from 'zod';

import type { DrawingAnalysis } from '../drawing/drawingAnalyzer';

export const characterProfileSchema = z.object({
  characterName: z.string().min(1),
  childName: z.string().min(1),
  setting: z.string().min(1),
  bedtimePromise: z.string().min(1),
  favoriteObject: z.string().min(1),
  storyTone: z.enum(['cozy', 'silly', 'adventurous', 'tender']),
});

export const generatedStorySchema = z.object({
  title: z.string(),
  text: z.string(),
  estimatedMinutes: z.number(),
  wordCount: z.number(),
  generatedBy: z.enum(['local-story-engine', 'web-llm']),
});

export type CharacterProfile = z.infer<typeof characterProfileSchema>;
export type GeneratedStory = z.infer<typeof generatedStorySchema>;

export type StoryInputs = {
  character: CharacterProfile;
  drawing: DrawingAnalysis;
};

const OPENINGS = [
  'On the night the window turned silver',
  'When the pillows were almost asleep',
  'Just after the last lamp clicked softly',
  'Beside the blanket fort of quiet stars',
];

const HELPERS = [
  'a map made of hums',
  'a teaspoon of moonlight',
  'a brave little button',
  'a paper lantern',
];
const LULLABY_ENDINGS = [
  'and the room remembered how to breathe slowly',
  'and every shadow curled up like a folded sock',
  'and the stars blinked in the exact rhythm of home',
  'and the whole world practiced being gentle',
];

export function defaultCharacterProfile(): CharacterProfile {
  return {
    characterName: '',
    childName: 'my little one',
    setting: 'the bedroom doorway where moonlight lands',
    bedtimePromise: 'I am always close, even when I am away',
    favoriteObject: 'a soft blanket',
    storyTone: 'cozy',
  };
}

export function generateTemplateStory(inputs: StoryInputs): GeneratedStory {
  const { character, drawing } = inputs;
  const seed = hashString(
    `${character.characterName}:${character.childName}:${character.setting}:${drawing.palette
      .map((color) => color.hex)
      .join(',')}`,
  );
  const pick = picker(seed);
  const hero = character.characterName.trim() || drawing.suggestedName;
  const child = character.childName.trim() || 'my little one';
  const helper = pick(HELPERS);
  const opening = pick(OPENINGS);
  const ending = pick(LULLABY_ENDINGS);
  const paletteWords = drawing.palette
    .map((color) => color.hex)
    .slice(0, 3)
    .join(', ');
  const seedWords = drawing.characterSeed;
  const tone = toneWords(character.storyTone);

  const paragraphs = [
    `${opening}, ${hero} stretched in the corner of a drawing and discovered that crayon lines could become roads. ${hero} was a ${seedWords.mood} ${seedWords.shape}, colored with ${paletteWords}, and carrying the special gift that ${seedWords.gift}.`,
    `${child} had drawn ${hero} with just enough wiggles to make the moon curious. So when the room grew quiet, ${hero} stepped gently from the page, brushed off a sprinkle of paper dust, and whispered, "Tonight we will make distance feel small."`,
    `The first stop was ${character.setting}. There, the floorboards sounded like tiny drums and the air smelled like clean pajamas. ${hero} tucked ${character.favoriteObject} under one arm and followed a trail of sleepy sparkles toward a door that only opened for kind voices.`,
    `Behind the door waited the problem of the night: ${seedWords.challenge}. It was not a scary problem. It was the sort that sat heavily on the edge of the bed and forgot how to ask for comfort. ${hero} sat beside it and listened until the problem became small enough to hold.`,
    `That was when ${helper} appeared. It glowed in the strongest color from the drawing and pointed toward a bridge stitched from bedtime promises. ${hero} stepped onto the bridge and said, "${character.bedtimePromise}." The bridge hummed back in a voice that sounded like home.`,
    `Across the bridge, ${hero} found a village of yawns trying to stay awake. They had lost their goodnight story and were bumping into each other in the dark. ${hero} opened the drawing-wide pockets that all brave bedtime characters have and shared a little ${tone.texture}, a little ${tone.motion}, and a little ${tone.secret}.`,
    `The yawns settled. The moon lowered its voice. Even the doorknob stopped clicking. ${hero} looked at ${child} and knew the best adventures do not end by getting louder. They end by making the heart feel held.`,
    `So ${hero} returned to the page, but not all the way. A tiny shine stayed near the pillow, just bright enough to say, "I came from your imagination, and I know the way back."`,
    `Before sleep arrived, ${hero} made one last promise: whenever someone who loves you is traveling, this story can stretch like a ribbon from there to here. It can cross train stations, hotel rooms, airports, and long roads without losing its softness.`,
    `Then ${hero} curled into the drawing, ${ending}. ${child} could close their eyes knowing that love had a voice, imagination had a lantern, and morning would know exactly where to find them.`,
  ];

  const text = paragraphs.join('\n\n');
  const wordCount = countWords(text);

  return generatedStorySchema.parse({
    title: `${hero} and the Bridge of Goodnight`,
    text,
    estimatedMinutes: Math.max(3, Math.round(wordCount / 145)),
    wordCount,
    generatedBy: 'local-story-engine',
  });
}

export function buildLocalLlmPrompt(inputs: StoryInputs) {
  const { character, drawing } = inputs;
  return [
    'Write a warm 3 to 5 minute bedtime story for a child.',
    `Child name: ${character.childName}.`,
    `Main character from the drawing: ${character.characterName || drawing.suggestedName}.`,
    `Character traits inferred from the drawing: ${drawing.characterSeed.mood}, ${drawing.characterSeed.shape}, ${drawing.characterSeed.gift}.`,
    `Story setting: ${character.setting}.`,
    `Favorite comfort object: ${character.favoriteObject}.`,
    `Emotional promise from parent: ${character.bedtimePromise}.`,
    `Tone: ${character.storyTone}.`,
    'Keep it gentle, imaginative, non-scary, and suitable for bedtime.',
    'End with a calm line that makes the child feel loved while the parent is away.',
  ].join('\n');
}

export function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function toneWords(tone: CharacterProfile['storyTone']) {
  switch (tone) {
    case 'silly':
      return { texture: 'giggle-fizz', motion: 'wobble', secret: 'ridiculous kindness' };
    case 'adventurous':
      return { texture: 'starlit courage', motion: 'bold stepping', secret: 'quiet bravery' };
    case 'tender':
      return { texture: 'velvet calm', motion: 'slow rocking', secret: 'remembered love' };
    case 'cozy':
    default:
      return { texture: 'blanket-soft light', motion: 'tiptoe', secret: 'warm patience' };
  }
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function picker(seed: number) {
  let state = seed || 1;
  return <T>(items: T[]) => {
    state = Math.imul(1664525, state) + 1013904223;
    return items[(state >>> 0) % items.length];
  };
}

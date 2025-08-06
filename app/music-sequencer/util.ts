export interface Beat {
  bpm: number;
  synth: number[]; // Array of indices where synth[noteIndex][step] is true
  drums: number[]; // Array of indices where drums[drumIndex][step] is true
  rootNote?: string; // Optional with default fallback
  scale?: ScaleName; // Optional with default fallback
}

// Scale definitions - semitone intervals from root note
export const SCALES = {
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // All notes
  major: [0, 2, 4, 5, 7, 9, 11], // Major scale
  minor: [0, 2, 3, 5, 7, 8, 10], // Natural minor scale
  pentatonic_major: [0, 2, 4, 7, 9], // Major pentatonic
  pentatonic_minor: [0, 3, 5, 7, 10], // Minor pentatonic
  blues: [0, 3, 5, 6, 7, 10], // Blues scale
  dorian: [0, 2, 3, 5, 7, 9, 10], // Dorian mode
  mixolydian: [0, 2, 4, 5, 7, 9, 10], // Mixolydian mode
  harmonic_minor: [0, 2, 3, 5, 7, 8, 11], // Harmonic minor
} as const;

export type ScaleName = keyof typeof SCALES;

export const SCALE_NAMES: Record<ScaleName, string> = {
  chromatic: "Chromatic (All Notes)",
  major: "Major",
  minor: "Minor",
  pentatonic_major: "Pentatonic Major",
  pentatonic_minor: "Pentatonic Minor",
  blues: "Blues",
  dorian: "Dorian",
  mixolydian: "Mixolydian",
  harmonic_minor: "Harmonic Minor",
};

// Root note options (C, C#, D, etc.)
export const ROOT_NOTES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

// Generate note indices for a given scale and root
export function getScaleNotes(
  rootNote: string,
  scaleName: ScaleName,
): number[] {
  const rootIndex = ROOT_NOTES.indexOf(rootNote);
  if (rootIndex === -1) return [];

  const scaleIntervals = SCALES[scaleName];
  const scaleNotes: number[] = [];

  // Generate notes across two octaves (24 semitones total)
  for (let octave = 0; octave < 2; octave++) {
    scaleIntervals.forEach((interval) => {
      const noteIndex = (rootIndex + interval + octave * 12) % 24;
      if (noteIndex < 24) {
        // We have 24 synth notes (2 octaves)
        scaleNotes.push(noteIndex);
      }
    });
  }

  return scaleNotes.sort((a, b) => a - b);
}

// Find the nearest note in a scale for transposition
export function findNearestScaleNote(
  noteIndex: number,
  scaleNotes: number[],
): number {
  if (scaleNotes.includes(noteIndex)) {
    return noteIndex; // Note is already in scale
  }

  // Find the closest note in the scale
  let minDistance = Infinity;
  let nearestNote = scaleNotes[0];

  for (const scaleNote of scaleNotes) {
    const distance = Math.abs(noteIndex - scaleNote);
    if (distance < minDistance) {
      minDistance = distance;
      nearestNote = scaleNote;
    }
  }

  return nearestNote;
}

// Transpose beat to fit a new scale
export function transposeBeatToScale(
  beat: Beat,
  rootNote: string,
  scaleName: ScaleName,
): Beat {
  const scaleNotes = getScaleNotes(rootNote, scaleName);

  // If chromatic scale, no transposition needed
  if (scaleName === "chromatic") {
    return beat;
  }

  const newBeat: Beat = {
    ...beat,
    synth: [],
    drums: [...beat.drums], // Copy drums unchanged
  };

  // Transpose synth notes
  beat.synth.forEach((encoded) => {
    const noteIndex = Math.floor(encoded / NUM_STEPS);
    const step = encoded % NUM_STEPS;
    if (noteIndex >= 0 && noteIndex < 24 && step >= 0 && step < NUM_STEPS) {
      const transposedNote = findNearestScaleNote(noteIndex, scaleNotes);
      const transposedEncoded = transposedNote * NUM_STEPS + step;
      if (!newBeat.synth.includes(transposedEncoded)) {
        newBeat.synth.push(transposedEncoded);
      }
    }
  });

  return newBeat;
}

export const NUM_STEPS = 16;

export const defaultBeat: Beat = {
  bpm: 120,
  synth: [], // Empty array for no active notes
  drums: [], // Empty array for no active drums
  rootNote: "C",
  scale: "chromatic",
};

export function encodeBeat(beat: Beat): string {
  const params = new URLSearchParams();
  if (beat.bpm !== 120) params.set("bpm", beat.bpm.toString());
  if (beat.rootNote && beat.rootNote !== "C")
    params.set("rootNote", beat.rootNote);
  if (beat.scale && beat.scale !== "chromatic") params.set("scale", beat.scale);
  if (beat.synth.length) params.set("synth", beat.synth.join(","));
  if (beat.drums.length) params.set("drums", beat.drums.join(","));
  return params.toString();
}

type SearchParamsLike = {
  get(name: string): string | null;
};

function decodeBeatFromParams(params: SearchParamsLike): Beat {
  const legacy = params.get("beat");
  if (legacy) {
    return decodeBeat(legacy);
  }

  const parseArray = (value: string | null): number[] =>
    value
      ? value
          .split(",")
          .map((n) => parseInt(n, 10))
          .filter((n) => !Number.isNaN(n))
      : [];

  return {
    bpm: Number(params.get("bpm")) || 120,
    synth: parseArray(params.get("synth")),
    drums: parseArray(params.get("drums")),
    rootNote: params.get("rootNote") || "C",
    scale: (params.get("scale") as ScaleName) || "chromatic",
  };
}

export function decodeBeat(
  input: string | SearchParamsLike | null,
): Beat {
  if (!input) return defaultBeat;

  if (typeof input === "string") {
    try {
      const json =
        typeof atob === "function"
          ? atob(input)
          : Buffer.from(input, "base64").toString("utf8");
      const beat = JSON.parse(json) as Beat;
      return {
        bpm: beat.bpm || 120,
        synth: beat.synth || [],
        drums: beat.drums || [],
        rootNote: beat.rootNote || "C",
        scale: beat.scale || "chromatic",
      };
    } catch {
      return decodeBeatFromParams(new URLSearchParams(input));
    }
  }

  return decodeBeatFromParams(input);
}

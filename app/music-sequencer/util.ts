export interface Beat {
  bpm: number;
  synth: boolean[][];
  drums: boolean[][];
  rootNote?: string; // Optional for backwards compatibility
  scale?: ScaleName; // Optional for backwards compatibility
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
  "C", "C#", "D", "D#", "E", "F", 
  "F#", "G", "G#", "A", "A#", "B"
];

// Generate note indices for a given scale and root
export function getScaleNotes(rootNote: string, scaleName: ScaleName): number[] {
  const rootIndex = ROOT_NOTES.indexOf(rootNote);
  if (rootIndex === -1) return [];
  
  const scaleIntervals = SCALES[scaleName];
  const scaleNotes: number[] = [];
  
  // Generate notes across two octaves (24 semitones total)
  for (let octave = 0; octave < 2; octave++) {
    scaleIntervals.forEach(interval => {
      const noteIndex = (rootIndex + interval + octave * 12) % 24;
      if (noteIndex < 24) { // We have 24 synth notes (2 octaves)
        scaleNotes.push(noteIndex);
      }
    });
  }
  
  return scaleNotes.sort((a, b) => a - b);
}

// Find the nearest note in a scale for transposition
export function findNearestScaleNote(noteIndex: number, scaleNotes: number[]): number {
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
export function transposeBeatToScale(beat: Beat, rootNote: string, scaleName: ScaleName): Beat {
  const scaleNotes = getScaleNotes(rootNote, scaleName);
  
  // If chromatic scale, no transposition needed
  if (scaleName === 'chromatic') {
    return beat;
  }
  
  const newBeat: Beat = {
    ...beat,
    synth: Array.from({ length: 24 }, () => Array(NUM_STEPS).fill(false)),
    drums: beat.drums.map(row => [...row]), // Copy drums unchanged
  };
  
  // Transpose synth notes
  beat.synth.forEach((row, noteIndex) => {
    row.forEach((active, step) => {
      if (active) {
        const transposedNote = findNearestScaleNote(noteIndex, scaleNotes);
        newBeat.synth[transposedNote][step] = true;
      }
    });
  });
  
  return newBeat;
}

// Compact representation for URL encoding
interface CompactBeat {
  bpm: number;
  synth: number[]; // Array of indices where synth[noteIndex][step] is true
  drums: number[]; // Array of indices where drums[drumIndex][step] is true
  rootNote?: string; // Optional for backwards compatibility
  scale?: ScaleName; // Optional for backwards compatibility
}

export const NUM_STEPS = 16;

export const defaultBeat: Beat = {
  bpm: 120,
  synth: Array.from({ length: 24 }, () => Array(NUM_STEPS).fill(false)), // 24 notes for 2 octaves
  drums: Array.from({ length: 3 }, () => Array(NUM_STEPS).fill(false)),
  rootNote: "C",
  scale: "chromatic",
};

// Convert Beat to CompactBeat format
export function beatToCompact(beat: Beat): CompactBeat {
  const compactBeat: CompactBeat = {
    bpm: beat.bpm,
    synth: [],
    drums: [],
    rootNote: beat.rootNote,
    scale: beat.scale,
  };

  // Encode synth notes: combine noteIndex and step into single number
  beat.synth.forEach((row, noteIndex) => {
    row.forEach((active, step) => {
      if (active) {
        // Encode as noteIndex * NUM_STEPS + step
        compactBeat.synth.push(noteIndex * NUM_STEPS + step);
      }
    });
  });

  // Encode drums: combine drumIndex and step into single number
  beat.drums.forEach((row, drumIndex) => {
    row.forEach((active, step) => {
      if (active) {
        // Encode as drumIndex * NUM_STEPS + step
        compactBeat.drums.push(drumIndex * NUM_STEPS + step);
      }
    });
  });

  return compactBeat;
}

// Convert CompactBeat to Beat format
export function compactToBeat(compactBeat: CompactBeat): Beat {
  const beat: Beat = {
    bpm: compactBeat.bpm || 120,
    synth: Array.from({ length: 24 }, () => Array(NUM_STEPS).fill(false)), // 24 notes for 2 octaves
    drums: Array.from({ length: 3 }, () => Array(NUM_STEPS).fill(false)),
    rootNote: compactBeat.rootNote || "C",
    scale: compactBeat.scale || "chromatic",
  };

  // Decode synth notes
  if (compactBeat.synth) {
    compactBeat.synth.forEach((encoded) => {
      const noteIndex = Math.floor(encoded / NUM_STEPS);
      const step = encoded % NUM_STEPS;
      if (noteIndex >= 0 && noteIndex < 24 && step >= 0 && step < NUM_STEPS) { // Updated to 24
        beat.synth[noteIndex][step] = true;
      }
    });
  }

  // Decode drums
  if (compactBeat.drums) {
    compactBeat.drums.forEach((encoded) => {
      const drumIndex = Math.floor(encoded / NUM_STEPS);
      const step = encoded % NUM_STEPS;
      if (drumIndex >= 0 && drumIndex < 3 && step >= 0 && step < NUM_STEPS) {
        beat.drums[drumIndex][step] = true;
      }
    });
  }

  return beat;
}

export function encodeBeat(beat: Beat): string {
  const compactBeat = beatToCompact(beat);
  const json = JSON.stringify(compactBeat);
  if (typeof btoa === "function") {
    return btoa(json);
  }
  // Node.js fallback
  return Buffer.from(json, "utf8").toString("base64");
}

export function decodeBeat(str: string | null): Beat {
  if (!str) return defaultBeat;
  
  try {
    const json =
      typeof atob === "function"
        ? atob(str)
        : Buffer.from(str, "base64").toString("utf8");
    
    const compactBeat = JSON.parse(json) as CompactBeat;
    
    // Handle legacy format (full Beat object)
    if ('synth' in compactBeat && Array.isArray(compactBeat.synth) && 
        compactBeat.synth.length > 0 && Array.isArray(compactBeat.synth[0])) {
      // This is the old format, return as-is
      return compactBeat as unknown as Beat;
    }
    
    // Convert from compact format back to full format
    return compactToBeat(compactBeat);
  } catch {
    return defaultBeat;
  }
}

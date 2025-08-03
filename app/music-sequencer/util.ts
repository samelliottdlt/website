export interface Beat {
  bpm: number;
  synth: boolean[][];
  drums: boolean[][];
}

export const NUM_STEPS = 16;

export const defaultBeat: Beat = {
  bpm: 120,
  synth: Array.from({ length: 12 }, () => Array(NUM_STEPS).fill(false)),
  drums: Array.from({ length: 3 }, () => Array(NUM_STEPS).fill(false)),
};

export function encodeBeat(beat: Beat): string {
  const json = JSON.stringify(beat);
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
    return JSON.parse(json) as Beat;
  } catch {
    return defaultBeat;
  }
}

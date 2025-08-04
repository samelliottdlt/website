import {
  encodeBeat,
  decodeBeat,
  defaultBeat,
  Beat,
  NUM_STEPS,
} from "../app/music-sequencer/util";

describe("music sequencer util", () => {
  test("encodes and decodes beat", () => {
    const encoded = encodeBeat(defaultBeat);
    expect(decodeBeat(encoded)).toEqual(defaultBeat);
  });

  test("invalid decode returns default", () => {
    expect(decodeBeat("not-base64")).toEqual(defaultBeat);
  });

  test("compact encoding is more efficient", () => {
    // Create a beat with some active notes that matches the current structure
    const testBeat: Beat = {
      bpm: 140,
      synth: Array.from({ length: 24 }, () => Array(NUM_STEPS).fill(false)), // 24 notes for 2 octaves
      drums: Array.from({ length: 3 }, () => Array(NUM_STEPS).fill(false)),
      rootNote: "C",
      scale: "chromatic",
    };

    // Add a few active notes
    testBeat.synth[0][0] = true; // C4 on step 1
    testBeat.synth[5][4] = true; // F4 on step 5
    testBeat.drums[0][0] = true; // Kick on step 1
    testBeat.drums[1][8] = true; // Snare on step 9

    const encoded = encodeBeat(testBeat);
    const decoded = decodeBeat(encoded);

    // Should decode correctly
    expect(decoded).toEqual(testBeat);

    // The encoded string should be much shorter than the old format
    // (The old format would be ~1000+ characters, new should be <200)
    expect(encoded.length).toBeLessThan(200);
  });

  test("handles empty beat efficiently", () => {
    const encoded = encodeBeat(defaultBeat);
    const decoded = decodeBeat(encoded);
    
    expect(decoded).toEqual(defaultBeat);
    // Empty beat should be very short
    expect(encoded.length).toBeLessThan(100);
  });
});

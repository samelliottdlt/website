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
    // Create a beat with some active notes using the compact format
    const testBeat: Beat = {
      bpm: 140,
      synth: [
        0 * NUM_STEPS + 0, // Note 0, step 0 (C4 on step 1)
        5 * NUM_STEPS + 4, // Note 5, step 4 (F4 on step 5)
      ],
      drums: [
        0 * NUM_STEPS + 0, // Drum 0, step 0 (Kick on step 1)
        1 * NUM_STEPS + 8, // Drum 1, step 8 (Snare on step 9)
      ],
      rootNote: "C",
      scale: "chromatic",
    };

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

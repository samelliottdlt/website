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

  test("decodes legacy encoded beat", () => {
    const legacy = Buffer.from(JSON.stringify(defaultBeat), "utf8").toString(
      "base64",
    );
    const params = new URLSearchParams();
    params.set("beat", legacy);
    expect(decodeBeat(params)).toEqual(defaultBeat);
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
    const decoded = decodeBeat(new URLSearchParams(encoded));

    // Should decode correctly
    expect(decoded).toEqual(testBeat);

    // The encoded string should be much shorter than the old format
    expect(encoded.length).toBeLessThan(200);
  });

  test("handles empty beat efficiently", () => {
    const encoded = encodeBeat(defaultBeat);
    const decoded = decodeBeat(encoded);

    expect(decoded).toEqual(defaultBeat);
    // Empty beat should return the default beat
    expect(encoded).toBe(
      "bpm=120&rootNote=C&scale=pentatonic_minor&synth=0%2C83%2C125%2C198%2C249%2C318%2C363&drums=0%2C4%2C12%2C24%2C25%2C26%2C27",
    );
  });
});

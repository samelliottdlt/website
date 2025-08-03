import {
  encodeBeat,
  decodeBeat,
  defaultBeat,
} from "../app/music-sequencer/util";

describe("music sequencer util", () => {
  test("encodes and decodes beat", () => {
    const encoded = encodeBeat(defaultBeat);
    expect(decodeBeat(encoded)).toEqual(defaultBeat);
  });

  test("invalid decode returns default", () => {
    expect(decodeBeat("not-base64")).toEqual(defaultBeat);
  });
});

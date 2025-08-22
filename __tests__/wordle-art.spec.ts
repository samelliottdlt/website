import words from "../app/wordle-art/words.json";
import {
  evaluateGuess,
  findWordForPattern,
  type CellColor,
} from "../app/wordle-art/util";

describe("wordle art utilities", () => {
  test("evaluateGuess identifies colors correctly", () => {
    expect(evaluateGuess("cigar", "cigar")).toEqual([
      "green",
      "green",
      "green",
      "green",
      "green",
    ]);

    expect(evaluateGuess("rebut", "grape")).toEqual([
      "yellow",
      "yellow",
      "gray",
      "gray",
      "gray",
    ]);

    expect(evaluateGuess("allee", "apple")).toEqual([
      "green",
      "yellow",
      "gray",
      "gray",
      "green",
    ]);
  });

  test("findWordForPattern finds matching word", () => {
    const pattern: CellColor[] = ["green", "green", "green", "green", "green"];
    expect(findWordForPattern("cigar", pattern, words)).toBe("cigar");
  });
});

export type CellColor = "gray" | "yellow" | "green";

export const evaluateGuess = (guess: string, answer: string): CellColor[] => {
  const result: CellColor[] = Array(guess.length).fill("gray");
  const answerChars = answer.split("");

  // first pass for greens
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answer[i]) {
      result[i] = "green";
      answerChars[i] = "";
    }
  }

  // second pass for yellows
  for (let i = 0; i < guess.length; i++) {
    if (result[i] === "green") continue;
    const idx = answerChars.indexOf(guess[i]);
    if (idx !== -1) {
      result[i] = "yellow";
      answerChars[idx] = "";
    }
  }

  return result;
};

export const findWordForPattern = (
  answer: string,
  pattern: CellColor[],
  words: string[],
): string | null => {
  const target = pattern.join("");
  return (
    words.find((w) => evaluateGuess(w, answer).join("") === target) || null
  );
};

export const generateWordsForGrid = (
  answer: string,
  grid: CellColor[][],
  words: string[],
): (string | null)[] => {
  return grid.map((row) => findWordForPattern(answer, row, words));
};

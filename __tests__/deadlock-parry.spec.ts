import {
  evaluateParryPress,
  makeOutcome,
  parryReactionMs,
  DEFAULT_SETTINGS,
} from "../app/deadlock-parry/util";

describe("evaluateParryPress", () => {
  const settings = { windupDurationMs: 700, parryWindowMs: 500 };
  const windupStart = 1000;
  // parry window = [1000, 1500] (deadline 500ms after windup cue)

  test("press inside parry window → success", () => {
    expect(evaluateParryPress(1000, windupStart, settings)).toBe("success");
    expect(evaluateParryPress(1250, windupStart, settings)).toBe("success");
    expect(evaluateParryPress(1500, windupStart, settings)).toBe("success");
  });

  test("press before windup cue → too-early", () => {
    expect(evaluateParryPress(999, windupStart, settings)).toBe("too-early");
    expect(evaluateParryPress(500, windupStart, settings)).toBe("too-early");
  });

  test("press after parry window → miss", () => {
    expect(evaluateParryPress(1501, windupStart, settings)).toBe("miss");
    expect(evaluateParryPress(5000, windupStart, settings)).toBe("miss");
  });

  test("zero-length windup still classifies", () => {
    const s = { windupDurationMs: 0, parryWindowMs: 0 };
    expect(evaluateParryPress(1000, 1000, s)).toBe("success");
    expect(evaluateParryPress(1001, 1000, s)).toBe("miss");
  });

  test("default settings exist and are sane", () => {
    expect(DEFAULT_SETTINGS.windupDurationMs).toBeGreaterThan(0);
    expect(DEFAULT_SETTINGS.parryWindowMs).toBeGreaterThan(0);
    expect(DEFAULT_SETTINGS.parryWindowMs).toBeLessThanOrEqual(
      DEFAULT_SETTINGS.windupDurationMs,
    );
  });
});

describe("parryReactionMs", () => {
  test("returns elapsed ms since windup start", () => {
    expect(parryReactionMs(1250, 1000)).toBe(250);
  });
  test("clamps negative to 0", () => {
    expect(parryReactionMs(900, 1000)).toBe(0);
  });
});

describe("makeOutcome", () => {
  const settings = { windupDurationMs: 700, parryWindowMs: 500 };
  test("no press → hit", () => {
    expect(makeOutcome({ pressed: false }, 1000, settings)).toEqual({
      kind: "hit",
    });
  });
  test("in-window press → parried with reaction", () => {
    expect(
      makeOutcome({ pressed: true, pressTimeMs: 1400 }, 1000, settings),
    ).toEqual({ kind: "parried", reactionMs: 400 });
  });
  test("early press → too-early", () => {
    expect(
      makeOutcome({ pressed: true, pressTimeMs: 900 }, 1000, settings),
    ).toEqual({ kind: "too-early", reactionMs: 0 });
  });
  test("late press → hit", () => {
    expect(
      makeOutcome({ pressed: true, pressTimeMs: 2000 }, 1000, settings),
    ).toEqual({ kind: "hit" });
  });
});

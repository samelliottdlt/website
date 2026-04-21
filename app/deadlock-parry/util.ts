export type ParryResult = "success" | "too-early" | "miss";

export type ParrySettings = {
  windupDurationMs: number;
  parryWindowMs: number;
  /**
   * Chance (0–100) that the wind-up will show the visual cue. Setting this
   * below 100 forces the trainee to react to audio alone some of the time,
   * which is the whole point of the trainer.
   */
  visualChancePercent?: number;
};

export const DEFAULT_SETTINGS: ParrySettings = {
  // Upstream reference implementation (apxsta/ParryTrainer) treats the heavy
  // melee alert as the start of a 1.2s reaction deadline — any F-press within
  // that window counts as a parry.
  // Source: https://github.com/apxsta/ParryTrainer (RESPONSE_TIME = 1.2).
  windupDurationMs: 1200,
  parryWindowMs: 1200,
  visualChancePercent: 50,
};

export function evaluateParryPress(
  pressTimeMs: number,
  windupStartMs: number,
  settings: ParrySettings,
): ParryResult {
  // The parry window is a reaction deadline that starts at the windup cue.
  // A press is valid anywhere in [windupStart, windupStart + parryWindow].
  const windowEnd = windupStartMs + settings.parryWindowMs;
  if (pressTimeMs < windupStartMs) return "too-early";
  if (pressTimeMs > windowEnd) return "miss";
  return "success";
}

export function parryReactionMs(
  pressTimeMs: number,
  windupStartMs: number,
): number {
  return Math.max(0, pressTimeMs - windupStartMs);
}

export function randomDelayMs(minMs: number, maxMs: number): number {
  if (maxMs < minMs) throw new Error("maxMs must be >= minMs");
  return minMs + Math.random() * (maxMs - minMs);
}

export type RoundOutcome =
  | { kind: "parried"; reactionMs: number }
  | { kind: "hit" }
  | { kind: "too-early"; reactionMs: number };

export function makeOutcome(
  press: { pressed: true; pressTimeMs: number } | { pressed: false },
  windupStartMs: number,
  settings: ParrySettings,
): RoundOutcome {
  if (!press.pressed) return { kind: "hit" };
  const result = evaluateParryPress(press.pressTimeMs, windupStartMs, settings);
  const reactionMs = parryReactionMs(press.pressTimeMs, windupStartMs);
  if (result === "success") return { kind: "parried", reactionMs };
  if (result === "too-early") return { kind: "too-early", reactionMs };
  return { kind: "hit" };
}

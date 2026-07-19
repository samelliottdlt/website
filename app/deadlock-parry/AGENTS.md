# Deadlock parry trainer

This client-side reaction trainer schedules unpredictable rounds and evaluates
parry timing.

- Keep timing calculations and outcome classification pure in `util.ts`.
- The valid parry interval is inclusive from windup start through
  `parryWindowMs`; presses before it are early and presses after it are misses.
- Maintain timer, audio-handle, and session cleanup when changing the round
  state machine.
- `cues.tsx` encapsulates audio and visuals. The configured asset pack must
  retain the synthesized fallback when files are unavailable.
- The best reaction time persists under
  `deadlock-parry:best-reaction-ms`; do not reset it with session statistics.
- Keep utility edge cases covered in `__tests__/deadlock-parry.spec.ts`.

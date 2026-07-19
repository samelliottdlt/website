# Deadlock counter picker

This tool ranks counter items for selected enemy heroes.

- `data.ts` is the canonical hero-to-ranked-counter mapping.
- Keep one to three unique items per hero. Earlier tuple positions are stronger
  and use the descending weights in `TIER_WEIGHTS`.
- `COUNTERS`, `HEROES`, and item lists are derived from the canonical records;
  do not maintain duplicate lists manually.
- A lane or problem selection implies game selection. Removing a hero from the
  game also removes its derived flags.
- Deadlock teams are 6v6; preserve the six-enemy warning and fast keyboard
  selection workflow.
- Update `__tests__/deadlock-counters.spec.ts` whenever data shape, ranking, or
  derivation rules change.

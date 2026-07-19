# Fusion calculator

This tool calculates Yu-Gi-Oh! Forbidden Memories fusion paths for a five-card
hand.

- `card.json` is the canonical card and fusion dataset.
- Build graph edges in both material orders because a fusion can be initiated
  from either card.
- Preserve distinct `idCounter` values for duplicate card instances in a hand;
  card IDs alone are not valid React keys there.
- Keep the hand capped at five cards and rank displayed paths by final attack.
- Keep graph and path calculations in `util.ts`, separate from React rendering.
- Extend `__tests__/fusion-calculator.spec.ts` when changing graph traversal,
  hand identity, memoization, or path semantics.

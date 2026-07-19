# Smoothie calculator

This client tool filters recipes against an ingredient inventory.

- `ingredients.json` is the canonical ingredient and recipe dataset.
- A string recipe entry requires that exact ingredient.
- An array recipe entry represents alternatives; at least one listed option is
  required.
- A smoothie is possible only when every recipe entry is satisfied.
- Keep ingredient labels associated with their checkboxes and preserve the
  scrollable disclosure for long inventories.
- Keep filtering derived with `useMemo`; do not duplicate possible smoothies
  in state.

// Single source of truth for Deadlock counter data.
//
// Adding a new item:
//   Append a key to `Items`. Use `Items.NewItemKey` everywhere — the type
//   system will autocomplete it and reject typos.
//
// Adding a new hero:
//   Append a key to `COUNTERS_BY_HERO` whose value is a 1–3 tuple of `Item`
//   values, ordered strongest counter first. TS rejects duplicate keys, unknown
//   items, and tier lists that are empty or longer than 3.
//
// Invariants that TypeScript cannot express (covered by unit tests):
//   - No item appears twice in the same hero's tier list.

// Enum-like const map of canonical item display names. The keys are the
// programmer-friendly handles you reference in `COUNTERS_BY_HERO`; the values
// are what gets shown in the UI.
export const Items = {
  Counterspell: "Counterspell",
  Curse: "Curse",
  DebuffReducer: "Debuff Reducer",
  DisarmingHex: "Disarming Hex",
  DispelMagic: "Dispel Magic",
  DivineBarrier: "Divine Barrier",
  EnchantersEmblem: "Enchanter's Emblem",
  EtherealShift: "Ethereal Shift",
  ExtraStamina: "Extra Stamina",
  Inhibitor: "Inhibitor",
  Knockdown: "Knockdown",
  MetalSkin: "Metal Skin",
  MonsterRounds: "Monster Rounds",
  PlatedArmor: "Plated Armor",
  ReactiveBarrier: "Reactive Barrier",
  Rebuttal: "Rebuttal",
  RescueBeam: "Rescue Beam",
  RestorativeLocket: "Restorative Locket",
  ReturnFire: "Return Fire",
  RustedBarrel: "Rusted Barrel",
  SilenceWave: "Silence Wave",
  SlowingHex: "Slowing Hex",
  SpiritShielding: "Spirit Shielding",
  Suppressor: "Suppressor",
  Healbane: "Healbane",
  WarpStone: "Warp Stone",
} as const;

export type Item = (typeof Items)[keyof typeof Items];
export const ITEM_LIST: readonly Item[] = Object.values(Items);

// Tier weights — index 0 is tier 1 (strongest counter).
export const TIER_WEIGHTS = [3, 2, 1] as const;
export const MAX_TIERS = TIER_WEIGHTS.length;

// 1–3 ordered items, strongest first.
export type CounterTiers =
  | readonly [Item]
  | readonly [Item, Item]
  | readonly [Item, Item, Item];

// Hero → tiers. Object literal so duplicate hero keys are caught by TS at
// compile time. `satisfies` preserves the literal key types so `Hero` is
// derived from this record rather than declared separately.
export const COUNTERS_BY_HERO = {
  Abrams: [Items.ReactiveBarrier, Items.Rebuttal],
  Apollo: [Items.RestorativeLocket, Items.SlowingHex, Items.Counterspell],
  Bebop: [Items.ReactiveBarrier, Items.Counterspell, Items.DispelMagic],
  Billy: [Items.ReactiveBarrier, Items.Rebuttal, Items.Counterspell],
  Calico: [Items.EnchantersEmblem, Items.Rebuttal],
  Celeste: [Items.RestorativeLocket, Items.SlowingHex],
  Doorman: [Items.RestorativeLocket, Items.SilenceWave, Items.WarpStone],
  Drifter: [Items.RustedBarrel, Items.Suppressor, Items.DisarmingHex],
  Dynamo: [Items.ReactiveBarrier, Items.SilenceWave, Items.SlowingHex],
  Graves: [Items.RestorativeLocket, Items.MonsterRounds],
  "Grey Talon": [
    Items.RestorativeLocket,
    Items.Counterspell,
    Items.Knockdown,
  ],
  Haze: [Items.ReactiveBarrier, Items.MetalSkin, Items.ReturnFire],
  Holiday: [Items.DebuffReducer, Items.SlowingHex, Items.RescueBeam],
  Infernus: [Items.DispelMagic, Items.DebuffReducer, Items.Counterspell],
  Ivy: [Items.ReactiveBarrier],
  Kelvin: [Items.Healbane],
  "Lady Geist": [Items.RestorativeLocket, Items.SilenceWave],
  Lash: [Items.ReactiveBarrier, Items.SlowingHex, Items.Counterspell],
  McGinnis: [Items.MonsterRounds],
  Mina: [Items.SlowingHex, Items.EnchantersEmblem],
  Mirage: [Items.DispelMagic, Items.PlatedArmor, Items.Healbane],
  Mo: [Items.ReactiveBarrier, Items.DebuffReducer, Items.Healbane],
  Paige: [Items.ReactiveBarrier, Items.DispelMagic, Items.DebuffReducer],
  Paradox: [Items.SilenceWave, Items.WarpStone],
  Pocket: [Items.DebuffReducer, Items.SlowingHex, Items.DivineBarrier],
  Rem: [Items.SlowingHex, Items.Counterspell, Items.ReactiveBarrier],
  Seven: [Items.Knockdown],
  Shiv: [Items.DispelMagic, Items.DebuffReducer, Items.Healbane],
  Silver: [Items.DisarmingHex, Items.MetalSkin, Items.Curse],
  Sinclair: [Items.ReactiveBarrier, Items.Counterspell, Items.DebuffReducer],
  Venator: [Items.RustedBarrel, Items.DisarmingHex, Items.DebuffReducer],
  Victor: [Items.Curse, Items.Inhibitor, Items.Healbane],
  Vindicta: [Items.ReactiveBarrier, Items.Knockdown],
  Viscous: [Items.Rebuttal],
  Vyper: [Items.MetalSkin],
  Warden: [Items.RustedBarrel, Items.DisarmingHex, Items.DispelMagic],
  Wraith: [Items.ReactiveBarrier, Items.DisarmingHex],
  Yamato: [Items.SilenceWave, Items.EnchantersEmblem, Items.EtherealShift],
} as const satisfies Record<string, CounterTiers>;

export type Hero = keyof typeof COUNTERS_BY_HERO;

export type CounterEntry = { hero: Hero; tiers: CounterTiers };

// Iterable view used by the UI. Derived from the record so it stays in sync.
export const COUNTERS: readonly CounterEntry[] = (
  Object.entries(COUNTERS_BY_HERO) as [Hero, CounterTiers][]
).map(([hero, tiers]) => ({ hero, tiers }));

export const HEROES: readonly Hero[] = Object.keys(COUNTERS_BY_HERO) as Hero[];

export function tierWeight(tierIndex: number): number {
  return TIER_WEIGHTS[tierIndex] ?? 0;
}

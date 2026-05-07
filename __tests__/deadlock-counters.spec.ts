import {
  COUNTERS,
  COUNTERS_BY_HERO,
  HEROES,
  ITEM_LIST,
  Items,
  MAX_TIERS,
  tierWeight,
  TIER_WEIGHTS,
} from "../app/deadlock-counters/data";
import { anyHeroMatches, normalize } from "../app/deadlock-counters/util";

describe("deadlock-counters data", () => {
  // The type system already enforces:
  //   - hero key uniqueness (object literal keys must be unique)
  //   - item names are valid (Item is a literal union)
  //   - tier list length is 1..3 (CounterTiers tuple union)
  // The remaining invariant that TS can't express is uniqueness of items
  // *within* a single hero's tier list, which is what this test guards.
  it("does not list the same counter item twice for any hero", () => {
    const offenders: string[] = [];
    for (const { hero, tiers } of COUNTERS) {
      const seen = new Set<string>();
      for (const item of tiers) {
        if (seen.has(item)) offenders.push(`${hero}: duplicate "${item}"`);
        seen.add(item);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("uses tier lists no longer than MAX_TIERS", () => {
    for (const { hero, tiers } of COUNTERS) {
      expect(tiers.length).toBeGreaterThanOrEqual(1);
      expect(tiers.length).toBeLessThanOrEqual(MAX_TIERS);
      // hero is a typed Hero — referenced to keep iteration meaningful in the
      // assertion failure message.
      expect(typeof hero).toBe("string");
    }
  });

  it("derives COUNTERS and HEROES from the same record", () => {
    expect(COUNTERS).toHaveLength(Object.keys(COUNTERS_BY_HERO).length);
    expect(HEROES).toHaveLength(COUNTERS.length);
  });

  it("declares one weight per tier slot", () => {
    expect(TIER_WEIGHTS).toHaveLength(MAX_TIERS);
    expect(tierWeight(0)).toBeGreaterThan(tierWeight(1));
    expect(tierWeight(1)).toBeGreaterThan(tierWeight(2));
    expect(tierWeight(99)).toBe(0);
  });

  it("exposes every item in ITEM_LIST", () => {
    expect(ITEM_LIST).toEqual(Object.values(Items));
    expect(new Set(ITEM_LIST).size).toBe(ITEM_LIST.length);
  });
});

describe("deadlock-counters search helpers", () => {
  it("normalize() strips non-alphanumerics and lowercases", () => {
    expect(normalize("Lady Geist")).toBe("ladygeist");
    expect(normalize("Grey-Talon!")).toBe("greytalon");
    expect(normalize("")).toBe("");
  });

  it("anyHeroMatches() is true when query is a substring of some hero", () => {
    // Empty query: matches everything.
    expect(anyHeroMatches("")).toBe(true);
    // Mid-name substring still matches (Apollo, Pocket).
    expect(anyHeroMatches("apol")).toBe(true);
    expect(anyHeroMatches("apoll")).toBe(true);
    // Full name matches itself.
    expect(anyHeroMatches("abrams")).toBe(true);
  });

  it("anyHeroMatches() returns false once typing dead-ends the search", () => {
    // The modifier-key shortcut relies on this: once "abrams" + "l" no longer
    // matches anything, the trailing "l" is treated as a lane modifier.
    expect(anyHeroMatches("abramsl")).toBe(false);
    expect(anyHeroMatches("apollog")).toBe(false);
    expect(anyHeroMatches("bebopg")).toBe(false);
    // Importantly, valid in-name characters do NOT dead-end and must keep
    // typing as normal:
    expect(anyHeroMatches("apoll")).toBe(true); // Apollo
    expect(anyHeroMatches("bebop")).toBe(true); // Bebop
    expect(anyHeroMatches("pocket")).toBe(true); // Pocket
  });
});

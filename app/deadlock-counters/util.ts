import { COUNTERS } from "./data";

export function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Whether any hero's normalized name contains the normalized query as a
// substring. An empty query matches everything.
export function anyHeroMatches(query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  return COUNTERS.some((c) => normalize(c.hero).includes(q));
}

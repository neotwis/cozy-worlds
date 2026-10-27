import type { SeededRandom } from "../core/random.js";
import { CozyWorldError } from "../core/validation.js";
import type { Rarity, WorldMap } from "../types/index.js";
import { RARITY_ORDER, RARITY_WEIGHTS } from "./tables.js";

/**
 * Roll a rarity tier. `luck` (0..1) shifts weight from common toward rarer tiers.
 */
export function rollRarity(rng: SeededRandom, luck = 0, minRarity: Rarity = "common"): Rarity {
  const minIdx = RARITY_ORDER.indexOf(minRarity);
  const entries = RARITY_ORDER.map((r, i) => ({
    value: r,
    weight: i < minIdx ? 0 : RARITY_WEIGHTS[r] * Math.pow(1 + luck * 2, i),
  }));
  return rng.weighted(entries);
}

export function rarityAtLeast(r: Rarity, min: Rarity): boolean {
  return RARITY_ORDER.indexOf(r) >= RARITY_ORDER.indexOf(min);
}

/**
 * Pick a random cell matching `predicate`. Tries random sampling first, then a
 * deterministic scan from a random offset so it always succeeds if any cell matches.
 */
export function pickCell(map: WorldMap, rng: SeededRandom, predicate: (i: number) => boolean): number {
  const n = map.width * map.height;
  for (let t = 0; t < 64; t++) {
    const i = rng.int(0, n - 1);
    if (predicate(i)) return i;
  }
  const start = rng.int(0, n - 1);
  for (let k = 0; k < n; k++) {
    const i = (start + k) % n;
    if (predicate(i)) return i;
  }
  throw new CozyWorldError("NO_VALID_CELL", "No cell in the world matches the requested constraints");
}

export function capitalize(s: string): string {
  return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1);
}

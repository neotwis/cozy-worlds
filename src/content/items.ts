import type { SeededRandom } from "../core/random.js";
import type { Rarity } from "../types/index.js";
import { rollRarity, rarityAtLeast } from "./common.js";
import { ITEMS, RARITY_ORDER, type ItemTemplate } from "./tables.js";

export interface LootItem {
  id: string;
  itemId: string;
  name: string;
  category: ItemTemplate["category"];
  rarity: Rarity;
  quantity: number;
  value: number;
  biome: string | null;
}

export interface LootOptions {
  biome?: string;
  luck?: number;
  minRarity?: Rarity;
}

/**
 * Roll a rarity, then pick an item of that rarity valid for the biome. If no
 * item exists at that rarity for the biome, steps down until one is found.
 */
export function generateLoot(rng: SeededRandom, opts: LootOptions = {}): LootItem {
  const biome = opts.biome ?? null;
  const minRarity = opts.minRarity ?? "common";
  const valid = ITEMS.filter((it) => it.biomes === "any" || biome === null || it.biomes.includes(biome));
  let rarity = rollRarity(rng, opts.luck ?? 0, minRarity);
  let pool: ItemTemplate[] = [];
  for (let idx = RARITY_ORDER.indexOf(rarity); idx >= 0; idx--) {
    rarity = RARITY_ORDER[idx] as Rarity;
    pool = valid.filter((it) => it.rarity === rarity);
    if (pool.length > 0) break;
  }
  if (pool.length === 0) pool = valid.filter((it) => rarityAtLeast(it.rarity, minRarity));
  if (pool.length === 0) pool = valid;
  const item = rng.pick(pool);
  const quantity = item.rarity === "common" ? rng.int(1, 5) : item.rarity === "uncommon" ? rng.int(1, 2) : 1;
  return {
    id: rng.id("item"),
    itemId: item.id,
    name: item.name,
    category: item.category,
    rarity: item.rarity,
    quantity,
    value: item.value * quantity,
    biome,
  };
}

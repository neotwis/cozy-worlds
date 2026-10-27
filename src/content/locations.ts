import type { SeededRandom } from "../core/random.js";
import { CozyWorldError } from "../core/validation.js";
import type { Rarity, WorldMap } from "../types/index.js";
import { WaterKind } from "../types/index.js";
import { pickCell, rollRarity } from "./common.js";
import {
  DESCRIPTION_DETAILS, DESCRIPTION_OPENERS, DISCOVERY_KINDS, LOCATION_KINDS, NAME_PREFIXES, NAME_SUFFIXES,
} from "./tables.js";

export interface PointOfInterest {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface Location {
  id: string;
  name: string;
  kind: string;
  description: string;
  biome: string;
  x: number;
  y: number;
  elevation: number;
  regionId: number;
  rarity: Rarity;
  hidden: boolean;
  pointsOfInterest: PointOfInterest[];
}

export interface LocationOptions {
  /** Restrict to a biome id present in the map. */
  biome?: string;
  /** Allow placement on water-adjacent cells only. */
  nearWater?: boolean;
  luck?: number;
}

function biomeIndex(map: WorldMap, biome: string | undefined): number {
  if (biome === undefined) return -1;
  const idx = map.biomeKeys.indexOf(biome);
  if (idx === -1) throw new CozyWorldError("UNKNOWN_BIOME", `Biome "${biome}" is not part of this world`);
  return idx;
}

function isNearWater(map: WorldMap, i: number): boolean {
  const x = i % map.width;
  const y = (i - x) / map.width;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue;
    if (map.water[ny * map.width + nx] !== WaterKind.Land) return true;
  }
  return false;
}

export function makeName(rng: SeededRandom, biome: string): string {
  const pre = NAME_PREFIXES[biome] ?? NAME_PREFIXES["default"]!;
  const suf = NAME_SUFFIXES[biome] ?? NAME_SUFFIXES["default"]!;
  return `${rng.pick(pre)} ${rng.pick(suf)}`;
}

function describe(rng: SeededRandom, biome: string, kind: string): string {
  const details = DESCRIPTION_DETAILS[biome] ?? DESCRIPTION_DETAILS["default"]!;
  const [a, b] = rng.shuffle(details);
  const article = /^[aeiou]/.test(kind) ? "an" : "a";
  return `${rng.pick(DESCRIPTION_OPENERS)} ${a}${b ? ` and ${b}` : ""}. You find ${article} ${kind} here.`;
}

function buildPois(rng: SeededRandom, map: WorldMap, cx: number, cy: number, names: string[]): PointOfInterest[] {
  const count = Math.min(names.length, rng.int(1, 3));
  return rng.shuffle(names).slice(0, count).map((name) => ({
    id: rng.id("poi", 1),
    name,
    x: Math.max(0, Math.min(map.width - 1, cx + rng.int(-2, 2))),
    y: Math.max(0, Math.min(map.height - 1, cy + rng.int(-2, 2))),
  }));
}

export function generateLocation(map: WorldMap, rng: SeededRandom, opts: LocationOptions = {}): Location {
  const bi = biomeIndex(map, opts.biome);
  const i = pickCell(map, rng, (c) =>
    map.water[c] === WaterKind.Land &&
    (bi === -1 || map.biomeIds[c] === bi) &&
    (!opts.nearWater || isNearWater(map, c)),
  );
  const x = i % map.width;
  const y = (i - x) / map.width;
  const biome = map.biomeKeys[map.biomeIds[i] as number] as string;
  const kind = rng.weighted(LOCATION_KINDS.map((k) => ({ value: k, weight: k.weight })));
  const name = `${makeName(rng, biome)} ${kind.kind === "clearing" ? "" : capitalizeWord(kind.kind)}`.trim();
  return {
    id: rng.id("loc"),
    name,
    kind: kind.kind,
    description: describe(rng, biome, kind.kind),
    biome,
    x, y,
    elevation: map.heightmap[i] as number,
    regionId: map.regionIds[i] as number,
    rarity: rollRarity(rng, opts.luck ?? 0),
    hidden: false,
    pointsOfInterest: buildPois(rng, map, x, y, kind.poi),
  };
}

function capitalizeWord(s: string): string {
  return s.replace(/(^|\s)\S/g, (m) => m.toUpperCase());
}

/** A rare, hidden location. Prefers cells far from regions' centroids and high/remote spots. */
export function generateDiscovery(map: WorldMap, rng: SeededRandom, opts: LocationOptions = {}): Location {
  const bi = biomeIndex(map, opts.biome);
  const i = pickCell(map, rng, (c) => map.water[c] === WaterKind.Land && (bi === -1 || map.biomeIds[c] === bi));
  const x = i % map.width;
  const y = (i - x) / map.width;
  const biome = map.biomeKeys[map.biomeIds[i] as number] as string;
  const kind = rng.pick(DISCOVERY_KINDS);
  return {
    id: rng.id("disc"),
    name: `The ${makeName(rng, biome)} ${capitalizeWord(kind.kind)}`,
    kind: kind.kind,
    description: `${describe(rng, biome, kind.kind)} It does not appear on any map.`,
    biome,
    x, y,
    elevation: map.heightmap[i] as number,
    regionId: map.regionIds[i] as number,
    rarity: rollRarity(rng, opts.luck ?? 0, "rare"),
    hidden: true,
    pointsOfInterest: buildPois(rng, map, x, y, kind.poi),
  };
}

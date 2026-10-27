/**
 * Deterministic pseudo-random number generation.
 *
 * Uses a 32-bit FNV-1a hash (with avalanche finalizer) to turn any string or
 * number seed into a 32-bit state, and mulberry32 as the generator. Both are
 * pure integer math (Math.imul / >>>), so results are bit-identical across
 * every compliant JavaScript engine.
 */

export type Seed = string | number;

export interface WeightedEntry<T> {
  value: T;
  weight: number;
}

/** Hash an arbitrary seed into an unsigned 32-bit integer. */
export function hashSeed(seed: Seed): number {
  const s = typeof seed === "number" ? `#n:${seed}` : `#s:${seed}`;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return h >>> 0;
}

export class SeededRandom {
  /** The 32-bit state this generator was created with. */
  readonly initialState: number;
  private state: number;

  constructor(seed: Seed) {
    this.initialState = hashSeed(seed);
    this.state = this.initialState;
  }

  /** Float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Float in [min, max). */
  float(min = 0, max = 1): number {
    return min + (max - min) * this.next();
  }

  /** Integer in [min, max] (inclusive). */
  int(min: number, max: number): number {
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      throw new RangeError("SeededRandom.int: bounds must be finite numbers");
    }
    const lo = Math.ceil(Math.min(min, max));
    const hi = Math.floor(Math.max(min, max));
    return lo + Math.floor(this.next() * (hi - lo + 1));
  }

  /** True with probability p. */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /** Uniformly pick an element. Throws on an empty array. */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new RangeError("SeededRandom.pick: empty array");
    return items[Math.floor(this.next() * items.length)] as T;
  }

  /** Pick by weight. Entries with weight <= 0 are never chosen. */
  weighted<T>(entries: readonly WeightedEntry<T>[]): T {
    let total = 0;
    for (const e of entries) if (e.weight > 0) total += e.weight;
    if (total <= 0) throw new RangeError("SeededRandom.weighted: no positive weights");
    let roll = this.next() * total;
    for (const e of entries) {
      if (e.weight <= 0) continue;
      roll -= e.weight;
      if (roll < 0) return e.value;
    }
    // Floating point fallthrough: return last positive entry.
    for (let i = entries.length - 1; i >= 0; i--) {
      const e = entries[i] as WeightedEntry<T>;
      if (e.weight > 0) return e.value;
    }
    throw new RangeError("SeededRandom.weighted: unreachable");
  }

  /** Fisher–Yates shuffle, returns a new array. */
  shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const tmp = out[i] as T;
      out[i] = out[j] as T;
      out[j] = tmp;
    }
    return out;
  }

  /** Short hex id (8 chars per 32 bits). */
  id(prefix = "", words = 2): string {
    let s = "";
    for (let i = 0; i < words; i++) {
      s += Math.floor(this.next() * 4294967296).toString(16).padStart(8, "0");
    }
    return prefix ? `${prefix}_${s}` : s;
  }

  /**
   * Create an independent stream derived from this generator's initial seed.
   * Forking does not consume values from the parent, so streams stay stable
   * when other streams are used more or less.
   */
  fork(name: string): SeededRandom {
    return new SeededRandom(`${this.initialState}:${name}`);
  }
}

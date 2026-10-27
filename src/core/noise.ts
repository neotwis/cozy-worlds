import { SeededRandom } from "./random.js";

const GRAD_X = [1, -1, 1, -1, 1, -1, 0, 0];
const GRAD_Y = [1, 1, -1, -1, 0, 0, 1, -1];

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export interface FbmOptions {
  octaves?: number;
  persistence?: number;
  lacunarity?: number;
}

/** Seeded 2D gradient (Perlin) noise. Output roughly in [-1, 1]. */
export class Noise2D {
  private readonly perm = new Uint8Array(512);

  constructor(rng: SeededRandom) {
    const p: number[] = [];
    for (let i = 0; i < 256; i++) p.push(i);
    const shuffled = rng.shuffle(p);
    for (let i = 0; i < 512; i++) this.perm[i] = shuffled[i & 255] as number;
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 7;
    return (GRAD_X[h] as number) * x + (GRAD_Y[h] as number) * y;
  }

  noise(x: number, y: number): number {
    const fx = Math.floor(x);
    const fy = Math.floor(y);
    const X = fx & 255;
    const Y = fy & 255;
    const xf = x - fx;
    const yf = y - fy;
    const u = fade(xf);
    const v = fade(yf);
    const p = this.perm;
    const aa = p[(p[X] as number) + Y] as number;
    const ab = p[(p[X] as number) + Y + 1] as number;
    const ba = p[(p[X + 1] as number) + Y] as number;
    const bb = p[(p[X + 1] as number) + Y + 1] as number;
    const x1 = lerp(this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf), u);
    const x2 = lerp(this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1), u);
    const n = lerp(x1, x2, v) * 1.4142;
    return n < -1 ? -1 : n > 1 ? 1 : n;
  }

  /** Fractal Brownian motion, normalized to roughly [-1, 1]. */
  fbm(x: number, y: number, opts: FbmOptions = {}): number {
    const octaves = opts.octaves ?? 5;
    const persistence = opts.persistence ?? 0.5;
    const lacunarity = opts.lacunarity ?? 2;
    let amp = 1;
    let freq = 1;
    let sum = 0;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
      sum += amp * this.noise(x * freq, y * freq);
      norm += amp;
      amp *= persistence;
      freq *= lacunarity;
    }
    return norm === 0 ? 0 : sum / norm;
  }
}

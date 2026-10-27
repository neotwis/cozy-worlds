import { describe, it, expect } from "vitest";
import { CozyWorld, SeededRandom, CozyWorldError } from "../src/index";

describe("cozy-world", () => {
  it("same seed gives identical worlds", () => {
    const a = new CozyWorld({ seed: "x", size: 48 }).map;
    const b = new CozyWorld({ seed: "x", size: 48 }).map;
    expect(Array.from(a.heightmap)).toEqual(Array.from(b.heightmap));
    expect(a.features.length).toBe(b.features.length);
  });
  it("different seeds differ", () => {
    const a = new CozyWorld({ seed: 1, size: 32 }).map.heightmap;
    const b = new CozyWorld({ seed: 2, size: 32 }).map.heightmap;
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });
  it("rng is stable", () => {
    expect(new SeededRandom("a").next()).toBe(new SeededRandom("a").next());
  });
  it("content generators are deterministic", () => {
    const run = () => { const w = new CozyWorld({ seed: "c", size: 48 });
      return [w.generateLocation(), w.generateCreature(), w.generateLoot(), w.generateEvent(), w.generateDiscovery()]; };
    expect(run()).toEqual(run());
  });
  it("rejects oversized worlds", () => {
    expect(() => new CozyWorld({ size: 4096 })).toThrow(CozyWorldError);
  });
  it("advances time across days", () => {
    const w = new CozyWorld({ seed: "t", size: 16, time: { hour: 23, dayOfYear: 0 } });
    expect(w.advanceTime(2).time).toEqual({ hour: 1, dayOfYear: 1 });
  });
});

# cozy-world

Deterministic, seed-based generator for cozy game worlds. No runtime dependencies.

```ts
import { CozyWorld } from "cozy-world";
const world = new CozyWorld({ seed: "meadow-1", size: 128 });
world.map;                  // heightmap, biomes, water, regions, vegetation
world.generateLocation();   // named places with points of interest
world.generateCreature();   // season/weather/time-aware wildlife
world.generateLoot({ luck: 0.3 });
world.generateEvent();
world.advanceTime(6);       // day/night, seasons, weather
```

Same seed + options always produce the same world. Use `toHeightmapMesh(world.map)` for 3D engines (e.g. Three.js `BufferGeometry`) or `toImageData(world.map)` for a 2D canvas.

import type { DayPhase, Rarity, Season, WeatherType } from "../types/index.js";

export const RARITY_ORDER: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary"];
export const RARITY_WEIGHTS: Record<Rarity, number> = { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1 };

export const NAME_PREFIXES: Record<string, string[]> = {
  forest: ["Mossy", "Whispering", "Fern", "Acorn", "Bramble", "Hollow", "Elder"],
  lake: ["Mirror", "Lily", "Still", "Silver", "Reed", "Heron"],
  grassland: ["Clover", "Sunny", "Breezy", "Daisy", "Meadow", "Honey"],
  desert: ["Amber", "Dune", "Sunbaked", "Copper", "Mirage"],
  snowfield: ["Frost", "Snowdrop", "Pine", "Glimmer", "Hush"],
  swamp: ["Murky", "Firefly", "Willow", "Misty", "Toadstool"],
  beach: ["Shell", "Saltwind", "Coral", "Driftwood", "Tide"],
  mountain: ["Granite", "Eagle", "Cloud", "Echo", "Summit"],
  default: ["Quiet", "Golden", "Little", "Old", "Hidden"],
};

export const NAME_SUFFIXES: Record<string, string[]> = {
  forest: ["Grove", "Thicket", "Glade", "Woods", "Hollow"],
  lake: ["Pond", "Mere", "Shallows", "Lake", "Cove"],
  grassland: ["Meadow", "Field", "Green", "Downs", "Pasture"],
  desert: ["Flats", "Dunes", "Oasis", "Mesa", "Wash"],
  snowfield: ["Drift", "Tundra", "Rise", "Vale", "Hollow"],
  swamp: ["Bog", "Marsh", "Fen", "Mire", "Bayou"],
  beach: ["Shore", "Strand", "Bay", "Sands", "Point"],
  mountain: ["Peak", "Pass", "Ridge", "Crag", "Overlook"],
  default: ["Place", "Corner", "Nook", "Crossing", "Rest"],
};

export const LOCATION_KINDS: { kind: string; weight: number; poi: string[] }[] = [
  { kind: "clearing", weight: 5, poi: ["picnic blanket", "old stump", "flower patch"] },
  { kind: "cottage", weight: 3, poi: ["mailbox", "herb garden", "woodpile", "chimney"] },
  { kind: "bridge", weight: 2, poi: ["wooden railing", "carved initials", "fishing spot"] },
  { kind: "campsite", weight: 3, poi: ["fire pit", "tent", "lantern"] },
  { kind: "ruins", weight: 1, poi: ["mossy arch", "broken statue", "rune stone"] },
  { kind: "garden", weight: 2, poi: ["vegetable bed", "scarecrow", "watering can"] },
  { kind: "lookout", weight: 2, poi: ["bench", "telescope", "signpost"] },
  { kind: "market", weight: 1, poi: ["fruit stall", "tea cart", "notice board"] },
];

export const DESCRIPTION_OPENERS = [
  "A gentle spot where",
  "Tucked away from the path,",
  "Locals say that here",
  "Few travelers notice that",
  "On quiet mornings,",
];

export const DESCRIPTION_DETAILS: Record<string, string[]> = {
  forest: ["sunlight filters through the leaves", "the air smells of pine and rain", "owls call softly at dusk"],
  lake: ["the water barely ripples", "dragonflies skim the surface", "reeds sway in the breeze"],
  grassland: ["wildflowers sway in the wind", "bees hum between the clovers", "the sky feels endless"],
  desert: ["warm sand shifts underfoot", "the horizon shimmers", "cacti bloom after rare rains"],
  snowfield: ["snow muffles every sound", "frost glitters like sugar", "breath clouds in the cold air"],
  swamp: ["fireflies drift over the water", "frogs sing in chorus", "mist curls around willow roots"],
  beach: ["waves roll in lazily", "shells glint in the sand", "gulls circle overhead"],
  mountain: ["clouds drift below the ridge", "the wind carries echoes", "the view stretches for miles"],
  default: ["time seems to slow down", "everything feels peaceful"],
};

export interface CreatureTemplate {
  species: string;
  rarity: Rarity;
  temperament: "shy" | "curious" | "friendly" | "playful" | "sleepy";
  activeTime: DayPhase[];
  seasons?: Season[];
  weather?: WeatherType[];
  traits: string[];
}

export const CREATURES: Record<string, CreatureTemplate> = {
  duck: { species: "duck", rarity: "common", temperament: "friendly", activeTime: ["dawn", "day"], traits: ["waddles", "quacks"] },
  frog: { species: "frog", rarity: "common", temperament: "playful", activeTime: ["dusk", "night"], weather: ["rainy", "foggy", "cloudy"], traits: ["hops", "croaks"] },
  heron: { species: "heron", rarity: "uncommon", temperament: "shy", activeTime: ["dawn", "dusk"], traits: ["patient", "long-legged"] },
  otter: { species: "otter", rarity: "rare", temperament: "playful", activeTime: ["day", "dusk"], traits: ["juggles pebbles", "floats on back"] },
  crab: { species: "crab", rarity: "common", temperament: "curious", activeTime: ["day", "night"], traits: ["sideways walker"] },
  seagull: { species: "seagull", rarity: "common", temperament: "curious", activeTime: ["dawn", "day"], traits: ["snack thief"] },
  turtle: { species: "sea turtle", rarity: "rare", temperament: "sleepy", activeTime: ["night", "dawn"], seasons: ["summer"], traits: ["ancient", "slow"] },
  rabbit: { species: "rabbit", rarity: "common", temperament: "shy", activeTime: ["dawn", "dusk"], traits: ["fluffy tail", "quick"] },
  butterfly: { species: "butterfly", rarity: "common", temperament: "playful", activeTime: ["day"], seasons: ["spring", "summer"], weather: ["sunny", "cloudy"], traits: ["colorful"] },
  sheep: { species: "sheep", rarity: "common", temperament: "sleepy", activeTime: ["day"], traits: ["woolly"] },
  meadowlark: { species: "meadowlark", rarity: "uncommon", temperament: "friendly", activeTime: ["dawn", "day"], traits: ["sings sweetly"] },
  deer: { species: "deer", rarity: "uncommon", temperament: "shy", activeTime: ["dawn", "dusk"], traits: ["graceful", "soft-eyed"] },
  fox: { species: "red fox", rarity: "uncommon", temperament: "curious", activeTime: ["dusk", "night"], traits: ["bushy tail", "clever"] },
  owl: { species: "owl", rarity: "uncommon", temperament: "sleepy", activeTime: ["night"], traits: ["wise", "silent flight"] },
  squirrel: { species: "squirrel", rarity: "common", temperament: "playful", activeTime: ["day"], seasons: ["spring", "summer", "autumn"], traits: ["hoards acorns"] },
  hedgehog: { species: "hedgehog", rarity: "rare", temperament: "shy", activeTime: ["dusk", "night"], seasons: ["spring", "summer", "autumn"], traits: ["prickly", "snuffly"] },
  lizard: { species: "lizard", rarity: "common", temperament: "sleepy", activeTime: ["day"], weather: ["sunny"], traits: ["sunbather"] },
  fennec_fox: { species: "fennec fox", rarity: "rare", temperament: "curious", activeTime: ["dusk", "night"], traits: ["huge ears"] },
  beetle: { species: "jewel beetle", rarity: "common", temperament: "shy", activeTime: ["day", "night"], traits: ["shiny shell"] },
  hawk: { species: "hawk", rarity: "uncommon", temperament: "shy", activeTime: ["day"], traits: ["keen eyes"] },
  snow_hare: { species: "snow hare", rarity: "common", temperament: "shy", activeTime: ["dawn", "dusk"], traits: ["white coat"] },
  arctic_fox: { species: "arctic fox", rarity: "rare", temperament: "curious", activeTime: ["day", "dusk"], traits: ["fluffy", "snow-pouncer"] },
  snowy_owl: { species: "snowy owl", rarity: "epic", temperament: "sleepy", activeTime: ["dusk", "night"], traits: ["golden eyes"] },
  reindeer: { species: "reindeer", rarity: "uncommon", temperament: "friendly", activeTime: ["day"], traits: ["antlers", "jingly"] },
  toad: { species: "toad", rarity: "common", temperament: "sleepy", activeTime: ["dusk", "night"], traits: ["warty", "content"] },
  dragonfly: { species: "dragonfly", rarity: "common", temperament: "playful", activeTime: ["day"], seasons: ["spring", "summer"], traits: ["iridescent"] },
  firefly: { species: "firefly", rarity: "uncommon", temperament: "friendly", activeTime: ["dusk", "night"], seasons: ["summer"], traits: ["glows"] },
  mountain_goat: { species: "mountain goat", rarity: "uncommon", temperament: "curious", activeTime: ["day"], traits: ["sure-footed"] },
  eagle: { species: "golden eagle", rarity: "rare", temperament: "shy", activeTime: ["day"], weather: ["sunny", "cloudy"], traits: ["majestic"] },
  marmot: { species: "marmot", rarity: "common", temperament: "friendly", activeTime: ["day"], seasons: ["spring", "summer", "autumn"], traits: ["whistles"] },
};

export const CREATURE_NAMES = ["Biscuit", "Clover", "Pip", "Maple", "Juniper", "Pebble", "Fern", "Moss", "Nutmeg", "Willow", "Bramble", "Tansy", "Hazel", "Sorrel", "Puddle"];

export interface ItemTemplate {
  id: string;
  name: string;
  category: "forage" | "material" | "treasure" | "fish_bait" | "trinket";
  rarity: Rarity;
  biomes: string[] | "any";
  value: number;
}

export const ITEMS: ItemTemplate[] = [
  { id: "wildflower", name: "Wildflower Bouquet", category: "forage", rarity: "common", biomes: ["grassland", "forest"], value: 5 },
  { id: "berries", name: "Handful of Berries", category: "forage", rarity: "common", biomes: ["forest", "grassland"], value: 4 },
  { id: "mushroom", name: "Brown Mushroom", category: "forage", rarity: "common", biomes: ["forest", "swamp"], value: 6 },
  { id: "acorn", name: "Shiny Acorn", category: "forage", rarity: "common", biomes: ["forest"], value: 2 },
  { id: "honey", name: "Wild Honeycomb", category: "forage", rarity: "uncommon", biomes: ["grassland"], value: 18 },
  { id: "seashell", name: "Spiral Seashell", category: "trinket", rarity: "common", biomes: ["beach"], value: 5 },
  { id: "sea_glass", name: "Sea Glass", category: "trinket", rarity: "uncommon", biomes: ["beach"], value: 15 },
  { id: "cactus_fruit", name: "Cactus Fruit", category: "forage", rarity: "common", biomes: ["desert"], value: 8 },
  { id: "amber", name: "Amber Shard", category: "treasure", rarity: "rare", biomes: ["desert", "forest"], value: 60 },
  { id: "frost_flower", name: "Frost Flower", category: "forage", rarity: "uncommon", biomes: ["snowfield"], value: 22 },
  { id: "snow_berries", name: "Snow Berries", category: "forage", rarity: "common", biomes: ["snowfield"], value: 6 },
  { id: "bog_herb", name: "Bog Myrtle", category: "forage", rarity: "common", biomes: ["swamp"], value: 7 },
  { id: "firefly_jar", name: "Firefly Lantern", category: "trinket", rarity: "rare", biomes: ["swamp"], value: 45 },
  { id: "crystal", name: "Mountain Crystal", category: "treasure", rarity: "rare", biomes: ["mountain"], value: 75 },
  { id: "iron_ore", name: "Iron Ore", category: "material", rarity: "uncommon", biomes: ["mountain"], value: 14 },
  { id: "wood", name: "Bundle of Twigs", category: "material", rarity: "common", biomes: ["forest", "grassland", "swamp"], value: 2 },
  { id: "stone", name: "Smooth Stone", category: "material", rarity: "common", biomes: "any", value: 1 },
  { id: "clay", name: "River Clay", category: "material", rarity: "common", biomes: ["lake", "swamp"], value: 4 },
  { id: "worm", name: "Wriggly Worm", category: "fish_bait", rarity: "common", biomes: "any", value: 1 },
  { id: "music_box", name: "Tiny Music Box", category: "treasure", rarity: "epic", biomes: "any", value: 250 },
  { id: "star_fragment", name: "Fallen Star Fragment", category: "treasure", rarity: "legendary", biomes: "any", value: 1000 },
  { id: "golden_feather", name: "Golden Feather", category: "treasure", rarity: "epic", biomes: ["mountain", "forest", "grassland"], value: 300 },
];

export interface FishTemplate {
  species: string;
  rarity: Rarity;
  water: ("lake" | "river" | "ocean")[];
  activeTime: DayPhase[];
  seasons?: Season[];
  sizeCm: [number, number];
}

export const FISH: FishTemplate[] = [
  { species: "bluegill", rarity: "common", water: ["lake", "river"], activeTime: ["dawn", "day", "dusk"], sizeCm: [10, 25] },
  { species: "minnow", rarity: "common", water: ["river", "lake"], activeTime: ["day"], sizeCm: [3, 8] },
  { species: "rainbow trout", rarity: "uncommon", water: ["river"], activeTime: ["dawn", "dusk"], sizeCm: [25, 60] },
  { species: "carp", rarity: "common", water: ["lake"], activeTime: ["day", "dusk"], sizeCm: [30, 80] },
  { species: "catfish", rarity: "uncommon", water: ["lake", "river"], activeTime: ["night", "dusk"], sizeCm: [40, 120] },
  { species: "koi", rarity: "rare", water: ["lake"], activeTime: ["day"], seasons: ["spring", "summer"], sizeCm: [30, 70] },
  { species: "golden perch", rarity: "epic", water: ["lake", "river"], activeTime: ["dawn"], sizeCm: [30, 50] },
  { species: "mackerel", rarity: "common", water: ["ocean"], activeTime: ["day", "dawn"], sizeCm: [25, 40] },
  { species: "sea bream", rarity: "uncommon", water: ["ocean"], activeTime: ["day", "dusk"], sizeCm: [20, 50] },
  { species: "pufferfish", rarity: "rare", water: ["ocean"], activeTime: ["day"], seasons: ["summer"], sizeCm: [10, 30] },
  { species: "moonfish", rarity: "legendary", water: ["ocean", "lake"], activeTime: ["night"], sizeCm: [60, 150] },
  { species: "ice char", rarity: "rare", water: ["lake", "river"], activeTime: ["day"], seasons: ["winter"], sizeCm: [25, 55] },
];

export interface EventTemplate {
  id: string;
  title: string;
  description: string;
  weight: number;
  rarity: Rarity;
  biomes?: string[];
  weather?: WeatherType[];
  seasons?: Season[];
  phases?: DayPhase[];
  durationHours: [number, number];
  rewards?: string[];
}

export const EVENTS: EventTemplate[] = [
  { id: "rainbow", title: "Double Rainbow", description: "A double rainbow arcs over {place}.", weight: 3, rarity: "uncommon", weather: ["rainy", "cloudy"], phases: ["day"], durationHours: [1, 1] },
  { id: "meteor_shower", title: "Meteor Shower", description: "Shooting stars streak across the sky above {place}.", weight: 1, rarity: "rare", weather: ["sunny"], phases: ["night"], durationHours: [2, 4], rewards: ["star_fragment"] },
  { id: "traveling_merchant", title: "Traveling Merchant", description: "A merchant with a creaky cart sets up near {place}.", weight: 4, rarity: "common", phases: ["day"], durationHours: [3, 8] },
  { id: "firefly_dance", title: "Firefly Dance", description: "Thousands of fireflies glow in rhythm around {place}.", weight: 3, rarity: "uncommon", seasons: ["summer"], phases: ["dusk", "night"], biomes: ["swamp", "forest", "grassland", "lake"], durationHours: [1, 3] },
  { id: "mushroom_bloom", title: "Mushroom Bloom", description: "Mushrooms sprouted overnight all over {place}.", weight: 4, rarity: "common", weather: ["rainy", "foggy"], biomes: ["forest", "swamp"], durationHours: [6, 24], rewards: ["mushroom"] },
  { id: "first_snow", title: "First Snowfall", description: "Soft flakes settle on {place} for the first time this year.", weight: 3, rarity: "uncommon", weather: ["snowy"], seasons: ["winter", "autumn"], durationHours: [4, 12] },
  { id: "picnic", title: "Village Picnic", description: "Neighbors gather for a picnic at {place}.", weight: 4, rarity: "common", weather: ["sunny", "cloudy"], seasons: ["spring", "summer"], phases: ["day"], durationHours: [2, 5] },
  { id: "lost_kitten", title: "Lost Kitten", description: "A tiny kitten mews somewhere around {place}.", weight: 3, rarity: "common", durationHours: [1, 6] },
  { id: "fish_frenzy", title: "Fish Frenzy", description: "The water near {place} is bubbling with fish.", weight: 3, rarity: "uncommon", biomes: ["lake", "beach"], phases: ["dawn", "dusk"], durationHours: [1, 2], rewards: ["worm"] },
  { id: "storm_shelter", title: "Cozy Storm", description: "Thunder rolls over {place}; perfect weather for tea indoors.", weight: 3, rarity: "common", weather: ["stormy"], durationHours: [1, 4] },
  { id: "fog_lanterns", title: "Lanterns in the Fog", description: "Mysterious lanterns bob through the mist at {place}.", weight: 2, rarity: "rare", weather: ["foggy"], phases: ["dusk", "night"], durationHours: [1, 3] },
  { id: "aurora", title: "Aurora Lights", description: "Green ribbons of light dance above {place}.", weight: 1, rarity: "epic", biomes: ["snowfield", "mountain"], phases: ["night"], durationHours: [1, 3] },
  { id: "harvest_festival", title: "Harvest Festival", description: "Pumpkins and music fill {place}.", weight: 2, rarity: "uncommon", seasons: ["autumn"], durationHours: [6, 12] },
  { id: "desert_bloom", title: "Desert Bloom", description: "After rain, {place} is carpeted in flowers.", weight: 2, rarity: "rare", biomes: ["desert"], weather: ["cloudy", "rainy", "stormy"], durationHours: [12, 48] },
];

export const DISCOVERY_KINDS = [
  { kind: "hidden grotto", poi: ["glowing pool", "crystal stalactites"] },
  { kind: "fairy ring", poi: ["perfect mushroom circle", "tiny footprints"] },
  { kind: "abandoned observatory", poi: ["brass telescope", "star charts"] },
  { kind: "sunken shrine", poi: ["mossy altar", "offering bowl"] },
  { kind: "secret garden", poi: ["overgrown gate", "ancient rose bush"] },
  { kind: "giant's tree", poi: ["hollow trunk", "rope ladder"] },
];

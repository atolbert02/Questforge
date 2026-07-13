import { Achievement, Phase, Quest, TrackerConfig } from "@/lib/types";

/**
 * Pure mapping from tracker data to the game world. No rendering here.
 *
 * Tracker -> world:
 *   Phase       -> an island zone along a winding overworld path
 *   Quest       -> an interactable on that island (chest / NPC / shrine by type)
 *   Boss quest  -> a boss guarding the island's exit bridge
 *   Achievement -> a flag marker on the relevant island
 *
 * The grid is one shared coordinate space; each island is a ZONE_SIZE square
 * patch, connected by 1-tile-wide bridges. A zone is "unlocked" when the
 * previous zone's boss is defeated (or, if it has no boss, when all of its
 * quests are complete). Locking is a game-world visual: the tracker itself
 * never locks anything.
 */

export const ZONE_SIZE = 11;
const ZONE_GAP = 5;

export interface GridPos {
  x: number;
  y: number;
}

export interface WorldInteractable {
  kind: "quest" | "boss";
  quest: Quest;
  tile: GridPos;
  zone: number;
}

export interface WorldMarker {
  achievement: Achievement;
  tile: GridPos;
  zone: number;
}

export interface WorldZone {
  index: number;
  phase: Phase;
  origin: GridPos;
  tiles: GridPos[];
  bridgeTiles: GridPos[]; // bridge leading INTO this zone (empty for zone 0)
  gateTile: GridPos | null; // blocked while this zone is locked
  decoTiles: GridPos[]; // trees etc.
  variant: number;
}

export interface WorldModel {
  zones: WorldZone[];
  walkable: Set<string>;
  interactables: WorldInteractable[];
  markers: WorldMarker[];
  spawn: GridPos;
}

export const key = (x: number, y: number) => `${x},${y}`;

/** Zig-zag vertical offset so the island chain winds instead of running straight. */
const zig = (i: number) => (i % 2 === 0 ? 0 : ZONE_SIZE - 3);

/** Interior slots where quest interactables land, in placement order. */
const QUEST_SLOTS: GridPos[] = [
  { x: 3, y: 2 }, { x: 7, y: 2 }, { x: 2, y: 5 }, { x: 5, y: 3 },
  { x: 3, y: 8 }, { x: 7, y: 8 }, { x: 5, y: 7 }, { x: 1, y: 3 },
  { x: 9, y: 2 }, { x: 1, y: 7 }, { x: 9, y: 8 }, { x: 4, y: 5 },
];

const BOSS_SLOT: GridPos = { x: 8, y: 5 };
const DECO_SLOTS: GridPos[] = [
  { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }, { x: 10, y: 10 },
  { x: 5, y: 0 }, { x: 0, y: 5 } , { x: 10, y: 3 }, { x: 5, y: 10 },
];

export function buildWorld(config: TrackerConfig): WorldModel {
  const phases = [...config.phases].sort((a, b) => a.id - b.id);
  const zones: WorldZone[] = [];
  const walkable = new Set<string>();
  const interactables: WorldInteractable[] = [];
  const markers: WorldMarker[] = [];

  phases.forEach((phase, i) => {
    const origin: GridPos = { x: i * (ZONE_SIZE + ZONE_GAP), y: zig(i) };
    const tiles: GridPos[] = [];
    for (let dx = 0; dx < ZONE_SIZE; dx++) {
      for (let dy = 0; dy < ZONE_SIZE; dy++) {
        tiles.push({ x: origin.x + dx, y: origin.y + dy });
      }
    }

    // Bridge from the previous island's right-middle edge to this island's
    // left-middle edge: run right, then vertically, then right again.
    const bridgeTiles: GridPos[] = [];
    let gateTile: GridPos | null = null;
    if (i > 0) {
      const prevOrigin: GridPos = { x: (i - 1) * (ZONE_SIZE + ZONE_GAP), y: zig(i - 1) };
      const fromY = prevOrigin.y + Math.floor(ZONE_SIZE / 2);
      const toY = origin.y + Math.floor(ZONE_SIZE / 2);
      const startX = prevOrigin.x + ZONE_SIZE;
      const endX = origin.x - 1;
      const midX = startX + Math.floor((endX - startX) / 2);
      for (let x = startX; x <= midX; x++) bridgeTiles.push({ x, y: fromY });
      const yStep = toY > fromY ? 1 : -1;
      for (let y = fromY + yStep; y !== toY; y += yStep) bridgeTiles.push({ x: midX, y });
      for (let x = midX; x <= endX; x++) bridgeTiles.push({ x, y: toY });
      gateTile = { x: endX, y: toY };
    }

    const quests = config.quests.filter((q) => q.phase === phase.id && !q.boss);
    const boss = config.quests.find((q) => q.phase === phase.id && q.boss);

    quests.forEach((quest, qi) => {
      const slot = QUEST_SLOTS[qi % QUEST_SLOTS.length];
      // Nudge overflow quests so two never share a tile.
      const bump = Math.floor(qi / QUEST_SLOTS.length);
      interactables.push({
        kind: "quest",
        quest,
        zone: i,
        tile: { x: origin.x + slot.x, y: origin.y + Math.min(slot.y + bump, ZONE_SIZE - 2) },
      });
    });
    if (boss) {
      interactables.push({
        kind: "boss",
        quest: boss,
        zone: i,
        tile: { x: origin.x + BOSS_SLOT.x, y: origin.y + BOSS_SLOT.y },
      });
    }

    for (const t of tiles) walkable.add(key(t.x, t.y));
    for (const t of bridgeTiles) walkable.add(key(t.x, t.y));

    // decoTiles filled in a second pass below (needs every zone's bridges known).
    zones.push({ index: i, phase, origin, tiles, bridgeTiles, gateTile, decoTiles: [], variant: i });
  });

  // Keep decorations OFF bridges: a tree on a 1-wide bridge tile deletes it from
  // `walkable` and blocks the crossing entirely. Exclude every bridge/gate tile
  // plus its 4-neighbors (this also covers both bridge-approach tiles).
  const bridgeBlock = new Set<string>();
  for (const zone of zones) {
    const span = [...zone.bridgeTiles];
    if (zone.gateTile) span.push(zone.gateTile);
    for (const t of span) {
      bridgeBlock.add(key(t.x, t.y));
      bridgeBlock.add(key(t.x + 1, t.y));
      bridgeBlock.add(key(t.x - 1, t.y));
      bridgeBlock.add(key(t.x, t.y + 1));
      bridgeBlock.add(key(t.x, t.y - 1));
    }
  }
  for (const zone of zones) {
    const used = new Set(
      interactables.filter((it) => it.zone === zone.index).map((it) => key(it.tile.x, it.tile.y))
    );
    zone.decoTiles = DECO_SLOTS.map((s) => ({ x: zone.origin.x + s.x, y: zone.origin.y + s.y }))
      .filter((t) => !used.has(key(t.x, t.y)) && !bridgeBlock.has(key(t.x, t.y)))
      .slice(0, 4 + (zone.index % 3));
    for (const t of zone.decoTiles) walkable.delete(key(t.x, t.y));
  }

  // Achievements -> flags on the zone they relate to (default: first zone).
  const zoneCount = Math.max(zones.length, 1);
  config.achievements.forEach((achievement, ai) => {
    let zoneIdx = 0;
    const { type, value } = achievement.condition;
    if (type === "phase_clear") {
      zoneIdx = Math.max(0, phases.findIndex((p) => p.id === value));
    } else if (type === "quest") {
      const q = config.quests.find((qq) => qq.id === value);
      if (q) zoneIdx = Math.max(0, phases.findIndex((p) => p.id === q.phase));
    } else {
      zoneIdx = ai % zoneCount;
    }
    const zone = zones[zoneIdx];
    if (!zone) return;
    const perZone = markers.filter((m) => m.zone === zoneIdx).length;
    markers.push({
      achievement,
      zone: zoneIdx,
      tile: { x: zone.origin.x + 2 + perZone * 2, y: zone.origin.y + ZONE_SIZE - 1 },
    });
  });
  // Marker tiles stay walkable (flags sit at the island's edge row).

  return {
    zones,
    walkable,
    interactables,
    markers,
    spawn: zones.length ? { x: zones[0].origin.x + 1, y: zones[0].origin.y + 5 } : { x: 0, y: 0 },
  };
}

/**
 * Zone 0 is always open. Zone k unlocks when zone k-1 is "cleared":
 * its boss is defeated, or (no boss) all of its quests are complete.
 */
export function unlockedZones(config: TrackerConfig, world: WorldModel, completed: Set<string>): boolean[] {
  const open: boolean[] = [];
  for (let i = 0; i < world.zones.length; i++) {
    if (i === 0) {
      open.push(true);
      continue;
    }
    if (!open[i - 1]) {
      open.push(false);
      continue;
    }
    const prevPhase = world.zones[i - 1].phase;
    const prevQuests = config.quests.filter((q) => q.phase === prevPhase.id);
    const boss = prevQuests.find((q) => q.boss);
    const cleared = boss
      ? completed.has(boss.id)
      : prevQuests.length > 0 && prevQuests.every((q) => completed.has(q.id));
    open.push(cleared);
  }
  return open;
}

import {
  Application,
  Container,
  Graphics,
  Sprite,
  Texture,
  TextureSource,
} from "pixi.js";
import { TrackerConfig } from "@/lib/types";
import {
  HERO_TIER_COLORS,
  MANIFEST,
  SpriteKey,
  TILE_H,
  TILE_W,
  makeBridgeTile,
  makeHero,
  makeTileVariant,
} from "../assets/sprites";
import { GridPos, WorldModel, key, unlockedZones } from "../world/mapping";

/**
 * The isometric engine. Owns the Pixi app, world rendering, avatar, camera,
 * and input. It holds NO quest state of its own: React pushes tracker state
 * in via `updateState`, and player intent flows out via callbacks.
 */

const SCALE = 2; // world zoom; sprites stay 1x pixels, nearest-neighbor
const WALK_SPEED = 4.2; // tiles per second
const INTERACT_RADIUS = 1.35;
const LOCKED_TINT = 0x55557a;

export interface FocusTarget {
  kind: "quest" | "boss" | "marker";
  /** Quest id for quests/bosses, achievement id for markers. */
  id: string;
}

export interface EngineCallbacks {
  onFocus: (target: FocusTarget | null) => void;
  onInteract: (target: FocusTarget) => void;
  onZoneChange: (zoneIndex: number) => void;
}

const gridToIso = (x: number, y: number) => ({
  x: ((x - y) * TILE_W) / 2,
  y: ((x + y) * TILE_H) / 2,
});
const isoToGrid = (ix: number, iy: number) => ({
  x: ix / TILE_W + iy / TILE_H,
  y: iy / TILE_H - ix / TILE_W,
});

async function loadTexture(k: SpriteKey): Promise<Texture> {
  const src = MANIFEST[k];
  if (src.url) {
    const { Assets } = await import("pixi.js");
    return Assets.load(src.url);
  }
  return Texture.from(src.generate());
}

interface Particle {
  sprite: Graphics;
  vx: number;
  vy: number;
  life: number;
}

export class AdventureGame {
  private app!: Application;
  private worldC = new Container();
  private avatar!: Sprite;
  private heroTex: [Texture, Texture] = [Texture.EMPTY, Texture.EMPTY];
  private tex = new Map<SpriteKey, Texture>();

  private pos: GridPos; // avatar position, float, tile-center units
  private keys = new Set<string>();
  private path: GridPos[] = [];
  private pendingInteract: FocusTarget | null = null;
  private walkTimer = 0;
  private frame = 0;

  private focus: FocusTarget | null = null;
  private focusRing!: Graphics;
  private currentZone = -1;
  private paused = false;
  private reduceFx = false;
  private tierIdx = -1;
  private completed = new Set<string>();
  private unlocked: boolean[] = [];
  private blocked = new Set<string>(); // locked gate tiles

  private itemSprites = new Map<string, Sprite>(); // quest id -> sprite
  private glowSprites = new Map<string, Graphics>();
  private markerSprites = new Map<string, Sprite>(); // achievement id -> sprite
  private gateSprites = new Map<number, Sprite>(); // zone index -> gate
  private zoneSprites = new Map<number, Sprite[]>(); // for fog tinting
  private particles: Particle[] = [];
  private shakeT = 0;
  private destroyed = false;

  private constructor(
    private host: HTMLElement,
    private config: TrackerConfig,
    private world: WorldModel,
    private cb: EngineCallbacks
  ) {
    this.pos = { ...world.spawn };
  }

  static async create(
    host: HTMLElement,
    config: TrackerConfig,
    world: WorldModel,
    cb: EngineCallbacks,
    initial: { completed: Set<string>; levelIdx: number; reduceFx: boolean }
  ): Promise<AdventureGame> {
    const game = new AdventureGame(host, config, world, cb);
    game.reduceFx = initial.reduceFx;
    await game.init(initial);
    return game;
  }

  private async init(initial: { completed: Set<string>; levelIdx: number }) {
    TextureSource.defaultOptions.scaleMode = "nearest";
    this.app = new Application();
    await this.app.init({
      resizeTo: this.host,
      background: "#0f0f1b",
      antialias: false,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
    if (this.destroyed) {
      // React unmounted while awaiting init (e.g. StrictMode double-effect).
      this.app.destroy(true, { children: true });
      return;
    }
    this.host.appendChild(this.app.canvas);
    this.app.canvas.style.touchAction = "none";

    const keys: SpriteKey[] = [
      "chestClosed", "chestOpen", "npc", "npcDone", "shrine", "shrineLit",
      "boss", "bossDown", "gate", "flag", "flagLit", "tree",
    ];
    for (const k of keys) this.tex.set(k, await loadTexture(k));

    this.worldC.scale.set(SCALE);
    this.worldC.sortableChildren = true;
    this.app.stage.addChild(this.worldC);

    this.buildTerrain();
    this.buildProps();
    this.buildAvatar(initial.levelIdx);
    this.updateState(initial.completed, initial.levelIdx);
    this.bindInput();

    this.app.ticker.add(() => this.update(this.app.ticker.deltaMS));
  }

  // ---------------------------------------------------------------- terrain

  private addSprite(tex: Texture, tile: GridPos, anchorY: number, zBias = 0): Sprite {
    const s = new Sprite(tex);
    const iso = gridToIso(tile.x, tile.y);
    s.anchor.set(0.5, anchorY);
    s.position.set(iso.x, iso.y);
    s.zIndex = iso.y + zBias;
    this.worldC.addChild(s);
    return s;
  }

  private buildTerrain() {
    const bridgeTex = Texture.from(makeBridgeTile());
    for (const zone of this.world.zones) {
      const tileTex = Texture.from(makeTileVariant(zone.variant));
      const sprites: Sprite[] = [];
      for (const t of zone.tiles) {
        // Tiles use zIndex far below props so every prop draws above the floor.
        const s = this.addSprite(tileTex, t, 0.5 - TILE_H / 2 / tileTex.height, -10000);
        sprites.push(s);
      }
      for (const t of zone.bridgeTiles) {
        const s = this.addSprite(bridgeTex, t, 0.5 - TILE_H / 2 / bridgeTex.height, -10000);
        sprites.push(s);
      }
      this.zoneSprites.set(zone.index, sprites);

      if (zone.gateTile) {
        const gate = this.addSprite(this.tex.get("gate")!, zone.gateTile, 0.92);
        this.gateSprites.set(zone.index, gate);
      }
      const treeTex = this.tex.get("tree")!;
      for (const t of zone.decoTiles) {
        sprites.push(this.addSprite(treeTex, t, 0.9));
      }
    }
  }

  private buildProps() {
    for (const it of this.world.interactables) {
      // Pending-quest glow: a pulsing diamond under the prop.
      const glow = new Graphics();
      const iso = gridToIso(it.tile.x, it.tile.y);
      glow.moveTo(0, -TILE_H / 2).lineTo(TILE_W / 2, 0).lineTo(0, TILE_H / 2).lineTo(-TILE_W / 2, 0).fill({ color: 0xf7d51d, alpha: 0.4 });
      glow.position.set(iso.x, iso.y);
      glow.zIndex = iso.y - 5000;
      this.worldC.addChild(glow);
      this.glowSprites.set(it.quest.id, glow);

      const tex = this.tex.get(it.kind === "boss" ? "boss" : questSprite(it.quest.type, false))!;
      const s = this.addSprite(tex, it.tile, 0.85);
      this.itemSprites.set(it.quest.id, s);
    }
    for (const m of this.world.markers) {
      const s = this.addSprite(this.tex.get("flag")!, m.tile, 0.9);
      this.markerSprites.set(m.achievement.id, s);
    }
    this.focusRing = new Graphics();
    this.focusRing
      .moveTo(0, -TILE_H / 2).lineTo(TILE_W / 2, 0).lineTo(0, TILE_H / 2).lineTo(-TILE_W / 2, 0).closePath()
      .stroke({ color: 0xf4f4ec, width: 1 });
    this.focusRing.visible = false;
    this.focusRing.zIndex = 999999;
    this.worldC.addChild(this.focusRing);
  }

  private buildAvatar(levelIdx: number) {
    this.setTier(levelIdx);
    this.avatar = new Sprite(this.heroTex[0]);
    this.avatar.anchor.set(0.5, 0.9);
    this.worldC.addChild(this.avatar);
  }

  private setTier(levelIdx: number) {
    const tier = Math.min(Math.max(levelIdx, 0), HERO_TIER_COLORS.length - 1);
    if (tier === this.tierIdx) return;
    this.tierIdx = tier;
    const tunic = HERO_TIER_COLORS[tier];
    this.heroTex = [Texture.from(makeHero("A", tunic)), Texture.from(makeHero("B", tunic))];
    if (this.avatar) this.avatar.texture = this.heroTex[this.frame];
  }

  // ------------------------------------------------------------ state sync

  /** Push fresh tracker state into the world. Safe to call on every render. */
  updateState(completed: Set<string>, levelIdx: number) {
    if (this.destroyed || !this.app) return;
    this.completed = completed;
    this.setTier(levelIdx);
    this.unlocked = unlockedZones(this.config, this.world, completed);

    this.blocked.clear();
    for (const zone of this.world.zones) {
      const open = this.unlocked[zone.index];
      const gate = this.gateSprites.get(zone.index);
      if (gate) gate.visible = !open;
      if (!open && zone.gateTile) this.blocked.add(key(zone.gateTile.x, zone.gateTile.y));
      for (const s of this.zoneSprites.get(zone.index) ?? []) {
        s.tint = open ? 0xffffff : LOCKED_TINT;
      }
    }

    for (const it of this.world.interactables) {
      const done = completed.has(it.quest.id);
      const sprite = this.itemSprites.get(it.quest.id);
      const glow = this.glowSprites.get(it.quest.id);
      const open = this.unlocked[it.zone];
      if (sprite) {
        sprite.texture = this.tex.get(
          it.kind === "boss" ? (done ? "bossDown" : "boss") : questSprite(it.quest.type, done)
        )!;
        sprite.tint = open ? 0xffffff : LOCKED_TINT;
      }
      if (glow) glow.visible = open && !done;
    }

    const unlockedAch = this.evaluateUnlockedAchievements();
    for (const m of this.world.markers) {
      const s = this.markerSprites.get(m.achievement.id);
      if (s) s.texture = this.tex.get(unlockedAch.has(m.achievement.id) ? "flagLit" : "flag")!;
    }
  }

  private evaluateUnlockedAchievements(): Set<string> {
    // Mirrors lib/achievements but takes the live completed set.
    const completedSet = this.completed;
    const quests = this.config.quests;
    const bosses = quests.filter((q) => q.boss && completedSet.has(q.id)).length;
    const total = completedSet.size;
    const out = new Set<string>();
    for (const a of this.config.achievements) {
      const { type, value } = a.condition;
      if (type === "quest" && completedSet.has(value as string)) out.add(a.id);
      else if (type === "first_quest" && total >= 1) out.add(a.id);
      else if (type === "boss_count" && bosses >= (value as number)) out.add(a.id);
      else if (type === "quest_count" && total >= (value as number)) out.add(a.id);
      else if (type === "phase_clear") {
        const pq = quests.filter((q) => q.phase === value);
        if (pq.length > 0 && pq.every((q) => completedSet.has(q.id))) out.add(a.id);
      }
    }
    return out;
  }

  setReduceFx(v: boolean) {
    this.reduceFx = v;
  }

  setPaused(v: boolean) {
    this.paused = v;
    if (v) this.keys.clear();
  }

  /** Pixel-square burst at the avatar (level-up celebration). */
  levelUpBurst() {
    if (this.destroyed || !this.app || this.reduceFx) return;
    const iso = gridToIso(this.pos.x, this.pos.y);
    const colors = [0xf7d51d, 0xa8e72e, 0x7ec8e8, 0xf4f4ec];
    for (let i = 0; i < 26; i++) {
      const g = new Graphics();
      g.rect(0, 0, 2, 2).fill(colors[i % colors.length]);
      g.position.set(iso.x, iso.y - 10);
      g.zIndex = 999998;
      this.worldC.addChild(g);
      const a = (Math.PI * 2 * i) / 26 + Math.random() * 0.4;
      const sp = 30 + Math.random() * 55;
      this.particles.push({ sprite: g, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: 900 });
    }
  }

  /** Small camera shake (boss hits). No-op when effects are reduced. */
  shake() {
    if (!this.reduceFx) this.shakeT = 220;
  }

  // ----------------------------------------------------------------- input

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.paused) return;
    const k = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(k)) {
      this.keys.add(k);
      this.path = [];
      this.pendingInteract = null;
      e.preventDefault();
    } else if ((k === "e" || k === "enter" || k === " ") && this.focus) {
      this.cb.onInteract(this.focus);
      e.preventDefault();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };

  private bindInput() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);

    this.app.stage.eventMode = "static";
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on("pointertap", (e) => {
      if (this.paused) return;
      const wx = (e.global.x - this.worldC.position.x) / SCALE;
      const wy = (e.global.y - this.worldC.position.y) / SCALE;
      const g = isoToGrid(wx, wy);
      const tx = Math.round(g.x);
      const ty = Math.round(g.y);

      // Tapping on/next to an interactable walks over and opens it.
      const target = this.world.interactables.find(
        (it) => Math.abs(it.tile.x - tx) <= 1 && Math.abs(it.tile.y - ty) <= 1 && this.unlocked[it.zone]
      );
      const marker = target
        ? null
        : this.world.markers.find((m) => m.tile.x === tx && m.tile.y === ty && this.unlocked[m.zone]);

      const dest = target ? target.tile : marker ? marker.tile : { x: tx, y: ty };
      const path = this.findPath(dest);
      if (path) {
        const interact: FocusTarget | null = target
          ? { kind: target.kind, id: target.quest.id }
          : marker
            ? { kind: "marker", id: marker.achievement.id }
            : null;
        if (path.length === 0) {
          // Already standing at the destination — interact right away.
          if (interact) this.cb.onInteract(interact);
        } else {
          this.path = path;
          this.pendingInteract = interact;
        }
      }
    });
  }

  private isWalkable(x: number, y: number): boolean {
    const k = key(x, y);
    return this.world.walkable.has(k) && !this.blocked.has(k);
  }

  /** BFS to the tile (or its nearest walkable neighbor). Null if unreachable. */
  private findPath(dest: GridPos): GridPos[] | null {
    const start = { x: Math.round(this.pos.x), y: Math.round(this.pos.y) };
    const goals = new Set<string>();
    if (this.isWalkable(dest.x, dest.y)) goals.add(key(dest.x, dest.y));
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (this.isWalkable(dest.x + dx, dest.y + dy)) goals.add(key(dest.x + dx, dest.y + dy));
    }
    if (goals.size === 0) return null;

    const prev = new Map<string, string>();
    const seen = new Set([key(start.x, start.y)]);
    let frontier = [start];
    let found: GridPos | null = goals.has(key(start.x, start.y)) ? start : null;
    let guard = 0;
    while (frontier.length && !found && guard++ < 6000) {
      const next: GridPos[] = [];
      for (const cur of frontier) {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cur.x + dx;
          const ny = cur.y + dy;
          const nk = key(nx, ny);
          if (seen.has(nk) || !this.isWalkable(nx, ny)) continue;
          seen.add(nk);
          prev.set(nk, key(cur.x, cur.y));
          if (goals.has(nk)) {
            found = { x: nx, y: ny };
            break;
          }
          next.push({ x: nx, y: ny });
        }
        if (found) break;
      }
      frontier = next;
    }
    if (!found) return null;
    const path: GridPos[] = [];
    let k = key(found.x, found.y);
    const startK = key(start.x, start.y);
    while (k !== startK) {
      const [x, y] = k.split(",").map(Number);
      path.unshift({ x, y });
      k = prev.get(k)!;
      if (!k) break;
    }
    return path;
  }

  // ------------------------------------------------------------------ loop

  private update(deltaMS: number) {
    if (this.destroyed) return;
    const dt = Math.min(deltaMS, 50) / 1000;

    if (!this.paused) this.move(dt);
    this.updateFocus();
    this.updateCamera(deltaMS);
    this.animate(deltaMS);
  }

  private move(dt: number) {
    let vx = 0;
    let vy = 0; // screen-space intent
    if (this.keys.has("arrowup") || this.keys.has("w")) vy -= 1;
    if (this.keys.has("arrowdown") || this.keys.has("s")) vy += 1;
    if (this.keys.has("arrowleft") || this.keys.has("a")) vx -= 1;
    if (this.keys.has("arrowright") || this.keys.has("d")) vx += 1;

    let gx = 0;
    let gy = 0; // grid-space velocity
    if (vx || vy) {
      // Convert screen direction to grid axes (iso projection inverse).
      gx = vx / 2 + vy;
      gy = -vx / 2 + vy;
    } else if (this.path.length) {
      const wp = this.path[0];
      const dx = wp.x - this.pos.x;
      const dy = wp.y - this.pos.y;
      const d = Math.hypot(dx, dy);
      if (d < 0.08) {
        this.path.shift();
        if (!this.path.length && this.pendingInteract) {
          const t = this.pendingInteract;
          this.pendingInteract = null;
          this.cb.onInteract(t);
        }
      } else {
        gx = dx / d;
        gy = dy / d;
      }
    }

    if (gx || gy) {
      const len = Math.hypot(gx, gy);
      const step = WALK_SPEED * dt;
      const nx = this.pos.x + (gx / len) * step;
      const ny = this.pos.y + (gy / len) * step;
      // Axis-separated collision so the avatar slides along edges.
      if (this.isWalkable(Math.round(nx), Math.round(this.pos.y))) this.pos.x = nx;
      if (this.isWalkable(Math.round(this.pos.x), Math.round(ny))) this.pos.y = ny;
      this.walkTimer += dt;
      if (this.walkTimer > 0.14) {
        this.walkTimer = 0;
        this.frame = 1 - this.frame;
        this.avatar.texture = this.heroTex[this.frame];
      }
    }

    const iso = gridToIso(this.pos.x, this.pos.y);
    this.avatar.position.set(iso.x, iso.y);
    this.avatar.zIndex = iso.y;

    // Which zone is the avatar standing in?
    const zx = Math.round(this.pos.x);
    const zone = this.world.zones.find(
      (z) => zx >= z.origin.x && zx < z.origin.x + 11
    );
    const zi = zone ? zone.index : this.currentZone;
    if (zi !== this.currentZone) {
      this.currentZone = zi;
      this.cb.onZoneChange(zi);
    }
  }

  private updateFocus() {
    let best: FocusTarget | null = null;
    let bestD = INTERACT_RADIUS;
    let bestTile: GridPos | null = null;
    for (const it of this.world.interactables) {
      if (!this.unlocked[it.zone]) continue;
      const d = Math.hypot(it.tile.x - this.pos.x, it.tile.y - this.pos.y);
      if (d < bestD) {
        bestD = d;
        best = { kind: it.kind, id: it.quest.id };
        bestTile = it.tile;
      }
    }
    if (!best) {
      for (const m of this.world.markers) {
        if (!this.unlocked[m.zone]) continue;
        const d = Math.hypot(m.tile.x - this.pos.x, m.tile.y - this.pos.y);
        if (d < bestD) {
          bestD = d;
          best = { kind: "marker", id: m.achievement.id };
          bestTile = m.tile;
        }
      }
    }
    const changed = (best?.id ?? null) !== (this.focus?.id ?? null) || (best?.kind !== this.focus?.kind);
    this.focus = best;
    this.focusRing.visible = !!bestTile;
    if (bestTile) {
      const iso = gridToIso(bestTile.x, bestTile.y);
      this.focusRing.position.set(iso.x, iso.y);
    }
    if (changed) this.cb.onFocus(best);
  }

  private updateCamera(deltaMS: number) {
    const iso = gridToIso(this.pos.x, this.pos.y);
    const tx = this.app.screen.width / 2 - iso.x * SCALE;
    const ty = this.app.screen.height / 2 - iso.y * SCALE;
    const lerp = Math.min(1, (deltaMS / 1000) * 7);
    let x = this.worldC.position.x + (tx - this.worldC.position.x) * lerp;
    let y = this.worldC.position.y + (ty - this.worldC.position.y) * lerp;
    if (this.shakeT > 0) {
      this.shakeT -= deltaMS;
      x += (Math.random() - 0.5) * 8;
      y += (Math.random() - 0.5) * 8;
    }
    this.worldC.position.set(x, y);
  }

  private animate(deltaMS: number) {
    // Pending-quest glow pulse (static when effects are reduced).
    const t = performance.now() / 600;
    const pulse = this.reduceFx ? 0.35 : 0.25 + 0.2 * (1 + Math.sin(t));
    this.glowSprites.forEach((g) => {
      if (g.visible) g.alpha = pulse;
    });
    // Particles.
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= deltaMS;
      p.vy += 120 * (deltaMS / 1000);
      p.sprite.x += p.vx * (deltaMS / 1000);
      p.sprite.y += p.vy * (deltaMS / 1000);
      p.sprite.alpha = Math.max(0, p.life / 900);
      if (p.life <= 0) {
        p.sprite.destroy();
        this.particles.splice(i, 1);
      }
    }
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    try {
      this.app?.destroy(true, { children: true });
    } catch {}
  }
}

function questSprite(type: string, done: boolean): SpriteKey {
  // Quest type -> prop art: build/create open chests, learn/research talk to
  // NPCs, practice/document visit shrines.
  if (type === "build" || type === "create") return done ? "chestOpen" : "chestClosed";
  if (type === "learn" || type === "research") return done ? "npcDone" : "npc";
  return done ? "shrineLit" : "shrine";
}

# Adventure Mode

An optional isometric 2.5D pixel-art view of the QuestForge tracker. Your
plan's phases become islands on an overworld, quests become chests / villagers
/ shrines, boss tasks become boss encounters — all rendered from the **same
quest state** the normal tracker uses.

## Architecture

```
TrackerShell (owns progress state, toggleQuest, saveProgress)
   │  "⚔️ Adventure" button → next/dynamic import (ssr: false)
   ▼
AdventureMode.tsx      React shell: error boundary + fallback, HUD, dialogs,
   │                   settings, CRT overlay. Holds NO quest state.
   ├─ world/mapping.ts buildWorld(config): pure tracker → world model
   ├─ engine/game.ts   Pixi 8: iso rendering, avatar, camera, input, effects
   ├─ assets/sprites.ts palette + runtime-generated pixel sprites (MANIFEST)
   └─ ui/              pixel-font HUD, QuestDialog, BossDialog, SettingsPanel
```

**Single source of truth.** State flows one way in, one way out:

- *In*: `config` + `progress` come as props from TrackerShell. Every progress
  change re-runs `engine.updateState(completedSet, levelIdx)`, which re-skins
  chests/bosses/flags and recomputes zone locks.
- *Out*: completing a quest or defeating a boss calls `onToggleQuest(id)` —
  the **same `toggleQuest` function the tracker's checkboxes call**. XP,
  levels, achievements, and localStorage persistence all happen in tracker
  code. Nothing is duplicated; the tracker and the game can never disagree.

**Lazy loading.** TrackerShell imports this module with
`next/dynamic({ ssr: false })`, and `engine/game.ts` (which imports pixi.js)
is itself `import()`ed at runtime, so pixi and all game code live in separate
chunks that load only when the toggle is pressed. The base tracker bundle is
unchanged (verified: `/tracker` First Load JS identical before/after).

**Fail safe.** Engine init is wrapped in try/catch and the React tree in an
error boundary; both render a friendly "back to tracker" fallback. Quests are
always completable in the normal tracker.

## Tracker → world mapping (`world/mapping.ts`)

| Tracker entity | World entity |
| --- | --- |
| Phase | An island zone (tile variant cycles per phase) linked by bridges |
| Quest, type `build`/`create` | Chest (opens when complete) |
| Quest, type `learn`/`research` | Villager NPC (grays out when complete) |
| Quest, type `practice`/`document` | Shrine (lights up when complete) |
| Quest with `boss: true` | Boss guarding the island (gravestone when defeated) |
| Achievement | Flag marker (gold when unlocked) |
| XP / level / rank | HUD bar + avatar tunic tier, straight from `getLevel` |

Zone *k* unlocks when zone *k−1*'s boss is defeated (or, with no boss, when
all its quests are complete). Locked zones are fog-tinted and their entry
bridge is gated. **Locking is game flavor only** — the tracker never locks
anything, and completing a quest from the tracker unlocks zones live.

Boss fights are three deliberate "STRIKE" presses (with camera shake), not a
twitch fight. The third strike completes the underlying task with the XP the
tracker already assigns.

## Controls & accessibility

- Desktop: WASD/arrows to move, E/Space/Enter to interact, Esc to exit.
- Touch: tap ground to walk (BFS pathfinding), tap an object to walk over and
  open it.
- `prefers-reduced-motion` defaults CRT scanlines **off** and effects
  (glow pulse, shake, particles) to reduced. Both have manual overrides in
  the in-game ⚙ settings, persisted in `qf_adventure_settings_v1`.
- Sound follows the tracker's existing mute toggle (`qf_muted`); completion
  and level-up cues are the tracker's own Web Audio synth.

## Swapping in real art (e.g. Kenney CC0 packs)

All placeholder sprites are generated at runtime from pixel templates in
`assets/sprites.ts` — 16-color fixed palette, ≤3 colors per sprite, 1px
outline, zero binary assets. To use real art:

1. Drop PNGs into `public/adventure/` (e.g. Kenney's isometric pack tiles,
   scaled for a 32×16 diamond footprint).
2. In `assets/sprites.ts`, set the `url` on the matching `MANIFEST` entry:
   ```ts
   chestClosed: { generate: ..., url: "/adventure/chest_closed.png" },
   ```
   The loader prefers `url` over `generate`. Tile art (`makeTileVariant`,
   `makeBridgeTile`) can be swapped the same way inside `engine/game.ts`'s
   `buildTerrain`.
3. Keep nearest-neighbor scaling (set globally via
   `TextureSource.defaultOptions.scaleMode = "nearest"`).

## Removing the feature

1. Delete `src/adventure/`.
2. In `src/components/tracker/TrackerShell.tsx`, remove the
   `const AdventureMode = dynamic(...)` block, the `adventureOpen` state, the
   "⚔️ Adventure" button, and the `{adventureOpen && ...}` render block.
3. `npm uninstall pixi.js`.

That's it — no other file references this folder.

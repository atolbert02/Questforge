# QuestForge — Progress Log

> A living record of everything built, every issue hit, and how it was resolved.
> **Update this file after each feature, addition, or resolved issue** so we learn from past mistakes.

**Live URL:** https://questifyhq.com  *(was questforge-sigma.vercel.app — consolidated 2026-07-04)*
**Repo:** https://github.com/atolbert02/Questifyhq  *(renamed from questforge 2026-07-04; local git remote updated)*
**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind · Anthropic SDK · Vercel

---

## How to use this file
- Add a dated entry under **Timeline** for every meaningful change.
- Log every real bug under **Issues & Resolutions** with root cause + fix + lesson.
- Keep **Current State** accurate so anyone can see where things stand at a glance.

---

## Current State (as of 2026-07-04)

| Area | Status |
|---|---|
| Landing page | ✅ Live (Hero + How It Works) |
| Create page (upload / paste) | ✅ Live with progressive live render |
| Theme picker (13 game-inspired skins, picked at creation) | ✅ Live |
| Tracker UI (Dashboard, Quests, Skills, Roadmap, Achievements) | ✅ Live |
| Generation pipeline (fan-out, <60s) | ✅ Live — skeleton → parallel phases → achievements |
| Animations (quest pop, achievement flip) | ✅ Live |
| Adventure Mode (isometric Pixi world) | ✅ Live — per-theme background/tiles/overlay/font/sketch-filter |
| Themed effects + synth sound + mute | ✅ Live — per-theme particle burst/banner + Web Audio cues |
| HTML export (standalone tracker) | ✅ Built — now fully theme-aware (tokens, fonts, FX) |
| Deployment | ✅ Production on Vercel, auto-deploys on push |
| Auth / payments / DB | ⬜ Not started (MVP is localStorage-only) |

**Known open items**
- Preview environment's `ANTHROPIC_API_KEY` didn't re-add cleanly via CLI (Production is fine). Fix in Vercel dashboard if branch previews need generation.
- Custom domain not set up (`questforge-sigma.vercel.app` is auto-generated).

---

## Timeline

### 2026-07-12 — Theme overhaul, bridge fix, 100% completion celebration
- **Themes (`src/lib/themes.ts`):** Cozy Farm → **Coastal Cove** (coastal blue/cream, Comfortaa); Nightmare Maze recolored so the 4 requested colors are distinct (gold/teal/olive/rust/navy, warm text — no more yellow/grey-blue repeats); **Super Hero** shifted to a warm red/orange/teal comic palette so it no longer twins Monster Tamer; Block Miner bg lighter+warmer; Puffball font → **Chango** (thick), Monster Tamer font → **Titan One** (Pokémon-like). Added 2 new themes — **Bows & Whiskers** (kawaii pink/lavender) and **Elysian Skies** (Greek-myth cream/wine, Cormorant). Replaced Beat Drop with **Deep Reef** (light "filtered underwater" greens). Registry: `ThemeId` union, `THEMES`, `THEME_LIST`, and `PROFILE_BY_THEME` in `src/adventure/style.ts` (the only compile-time must-fixes). Verified all 15 themes in the picker.
- **Bridge fix (`src/adventure/world/mapping.ts`):** decorations (trees) could spawn on a 1-wide bridge tile — the deco exclusion set only checked quest/boss tiles, so `DECO_SLOT {0,5}` landed on the bridge-entry tile and `walkable.delete` blocked the crossing. Now a global two-pass excludes every bridge/gate tile **and its 4-neighbors** (covers both approach tiles) before placing decos. Arithmetic check over 6 zones: **0** kept decorations on any bridge/gate tile.
- **100% completion celebration:** when the final quest completes and every achievement is unlocked, a themed full-screen `CompletionScreen` (stats + Download CTA) fires once, plus staggered `playThemeEffect` bursts + level-up sound (`TrackerShell.tsx`); Adventure Mode mirrors it with a "🏆 WORLD COMPLETE!" banner + burst (`AdventureMode.tsx`). Guard refs ensure it fires only on the false→true transition, not on reloading an already-100% tracker. Verified live (Bows & Whiskers): screen shows correct 4 quests / 580 XP / 5 achievements, and does not re-fire on reload.

### 2026-07-12 — De-AI copy, theme recolor, per-theme Adventure Mode
- **Removed all user-visible "Claude"/"AI" mentions** (5 strings in Hero, HowItWorks, layout metadata, create page) → product-voice copy ("Questify"/benefit language). Also fixed stale "QuestForge" brand in the theme picker + tab title. Server-side `callClaude`/prompts left untouched.
- **Retuned all 13 theme palettes** in `src/lib/themes.ts` to user-specified colors (backgrounds, 4 main colors mapped by design judgment, plus harmonized surfaces/text/particles/gradients). Kart→Mario blue, Puffball→Kirby pastels, Block→light grey, Wizard→green-to-red, Super Hero→off-white, Nightmare→#141418 gold/teal, Zombie→moss/tan, Adventure→light parchment, Cozy→coral/teal/leaf, Monster→Pokémon, Drop Squad/Space/Beat→neon on dark. Verified every swatch in the picker; text readable on all.
- **Adventure Mode is now per-theme** (was one hardcoded pixel skin that ignored the theme). New `src/adventure/style.ts` maps each theme → a profile (pixel / smooth / sketch / neon) and derives background, ground-tile colors (from `themePhaseColors`), overlay (scanline / paper-grain+vignette / none), font, and chrome. Threaded through `game.ts` (background + hex-tinted tiles via new `makeTileHex`) and `AdventureMode.tsx` (theme font load, per-profile overlay, SVG `feDisplacementMap` sketch filter for Nightmare/Zombie). Verified live: Nightmare = dark gold sketch world, Kart = blue smooth world, no console errors. Pixel sprites kept; HUD chrome still arcade-styled (optional future theming).

### 2026-05-29 — Project scaffold
- Created full file structure per build plan Section 3 under `~/questforge`.
- Initialized Next.js 14 app, Tailwind, TypeScript configs.

### 2026-05-29 — GitHub connection
- Generated SSH key, connected to GitHub, pushed to `atolbert02/Questforge`.

### 2026-05-29 — Core library + API
- Wrote all `src/lib` files: types, prompts, parse-file, validate-config, tracker-storage, achievements, export-html.
- Built `/api/generate` route (single-call version, later replaced).
- Wrote full UI: landing, create, tracker shell + 5 tabs.

### 2026-05-29 — Kirby-style animations
- Quest completion: card pop, checkmark stamp, floating +XP number.
- Achievement unlock: 3D card flip + gold particle burst + idle glow.

### 2026-05-29 — Sub-60s generation (fan-out + progressive render)
- Replaced single giant Claude call with a **fan-out pipeline**: skeleton call → per-phase quest calls **in parallel** → achievements call.
- Added **progressive live render**: tracker appears after skeleton (~14s) and fills in phase-by-phase with shimmer placeholders.
- Tuned: phase calls use a 12k-char slice (not full 80k) and target 5–7 quests/phase.
- Removed dead pre-refactor code (old `route.ts`, old `prompts.ts`).
- **Verified:** skeleton 14s, phases 23s (parallel), achievements 16s — every function call well under Vercel's 60s limit.

### 2026-05-29 — Production deployment
- Synced current API key to Vercel, deployed to production, smoke-tested landing + live generation (both pass).

### 2026-07-04 — Vercel project consolidation onto questifyhq
- **Product rename fallout cleanup.** The product was renamed mid-build (bought the domain **questifyhq.com**), leaving mismatched names: local folder `questforge`, GitHub `atolbert02/questforge`, and **two** Vercel projects both auto-deploying the same repo — `questifyhq` (real product, owns questifyhq.com) and a redundant `questforge` (only `*.vercel.app`).
- Confirmed both Vercel projects are Git-connected to the same repo and auto-deploy on push, so the theme commit (`5b25389`) went live on **questifyhq.com** automatically — no manual deploy needed.
- **Actions:** re-linked the local `.vercel` to the `questifyhq` project; verified questifyhq has `ANTHROPIC_API_KEY` in Production + Preview and serves the themed picker; **deleted the redundant `questforge` Vercel project** (no custom domain attached, only throwaway `*.vercel.app` URLs).
- GitHub repo renamed `questforge` → **`atolbert02/Questifyhq`** (note the capital `Q` — lowercase `questifyhq` did not resolve over SSH). Local git remote updated to `git@github.com:atolbert02/Questifyhq.git` and verified (HEAD = `5b25389`).
- **Lesson:** rename the product's repo/project/domain together and update the git remote immediately; a half-done rename left a duplicate Vercel project silently double-deploying.

### 2026-07-04 — Game-inspired theme system (13 themes)
- Added `src/lib/themes.ts`: a central registry of 13 themes (Space Station, Kart Racer, Puffball Quest, Block Miner, Wizard School, Super Hero, Nightmare Maze, Zombie Survival, Adventure Quest, Cozy Farm, Monster Tamer, Drop Squad, Beat Drop). Each theme = full token palette + fonts (Google Fonts URL) + effect kind + icon set + optional background. Original art/names (descriptive, non-trademarked).
- **Token refactor:** replaced hard-coded hex/fonts across all 6 tracker components with theme tokens via `getTheme(config.themeId)`. Default resolves to **Space Station** so pre-existing localStorage trackers render exactly as before. Added `themeId?: ThemeId` to `TrackerConfig`.
- **Selection at creation:** new `ThemePicker` on the Create page (previews each theme in its own palette + display font). `themeId` threads through `generate-client.ts`; phase/skill colors are now **derived from the theme** (`themePhaseColors`) instead of the model's random hex.
- **Interactive effects + sound:** `effects/theme-effect.ts` fires a per-theme particle burst (+ banner for pow/victory/combo/etc.) at the click point on quest complete / level up / achievement unlock. `use-theme-sound.ts` synthesizes short cues with the **Web Audio API** (no audio files → original, instant, zero licensing). Mute toggle (🔊/🔇) in the header, persisted to `localStorage.qf_muted`.
- **Themed export:** `export-html.ts` now emits the full token set + theme fonts + an inline self-contained particle burst, so downloaded trackers stay on-theme.
- **Verified:** `tsc --noEmit` + `next build` clean (9/9 pages). Smoke-tested Space Station (unchanged), Wizard School (dark serif), Cozy Farm (light), Block Miner (pixel font) end-to-end incl. picker previews, quest-complete burst, and themed HTML export.
- **Lesson:** with heavy inline-hex styling + pervasive `${accent}44` alpha concatenation, a JS **token object** (`getTheme().tokens`) beats CSS variables — hex+alpha strings just work, and each component already receives `config`. Synthesizing SFX via Web Audio sidestepped the whole audio-asset sourcing/licensing problem.

**Follow-ups (not yet done):** source/author distinct sound recipes per theme if richer audio is wanted; consider theming the quest-type badge palette further; the pixel-font (Press Start 2P) tab row scrolls horizontally on narrow screens (acceptable, by design).

### 2026-07-11 — Adventure Mode (isometric 2.5D world view)
- New optional **"⚔️ Adventure" toggle** on the tracker opens an isometric pixel-art overworld generated from the user's real plan: phases → islands (bridged, gated until the previous phase's boss falls), quests → chests/villagers/shrines by type, boss tasks → 3-strike boss encounters, achievements → flag markers, XP/level/rank → HUD + avatar tunic tier.
- **Single source of truth:** the game holds no quest state — it receives `config`/`progress` as props and completions call TrackerShell's own `toggleQuest`. Verified both directions live (game completion → tracker dashboard 190 XP / 4-13 quests / level-up to Adventurer; and lock/fog recompute on every progress change).
- **Engine:** Pixi 8 behind `next/dynamic({ssr:false})` + a runtime `import()`, so pixi + game code live in lazy chunks — `/tracker` First Load JS 104→106 kB (dynamic stub only; verified via `app-build-manifest` that no pixi chunk is in the initial load). ~101 fps in dev.
- **Art with zero binary assets:** all sprites generated at runtime from pixel templates (fixed 16-color palette, ≤3 colors/sprite + ink outline, NES-style); `MANIFEST.url` lets real packs (e.g. Kenney CC0) drop in later. CRT scanlines/vignette as pure-CSS overlay.
- **Accessibility:** WASD/arrows + E/Space on desktop, tap-to-move (BFS pathfinding) on touch; `prefers-reduced-motion` defaults CRT off and effects reduced, with manual overrides in an in-game settings panel; engine failure falls back to the tracker via error boundary.
- Full docs in `src/adventure/README.md` (architecture, mapping table, art swap, clean removal: delete one folder + one toggle block).
- **Bugfix found while verifying:** tapping an interactable while already adjacent produced an empty BFS path and never fired the interaction — empty path now interacts immediately.
- **Lesson:** rendering a game as a *view* over existing React state (props in, the tracker's own mutation function out) made two-way sync free — no event bus, no duplicated store, no reconciliation.

---

## Issues & Resolutions

> Format: **Symptom → Root Cause → Fix → Lesson**

### 1. `.env` / API key committed to git; GitHub blocked the push
- **Symptom:** `git push` rejected — "repository rule violations" (secret scanning).
- **Root cause:** `.env` (and earlier `.env.local`) containing `ANTHROPIC_API_KEY` was committed. The key stayed in git history even after deleting the file.
- **Fix:** Added `.env*` to `.gitignore`, `git rm --cached` the files, then rewrote history (`git reset --soft` + recommit) and force-pushed. Rotated the exposed key at console.anthropic.com.
- **Lesson:** Add `.env*` to `.gitignore` **before the first commit**. If a secret is ever committed, rotating the key is mandatory — removing it from history is not enough.

### 2. Next.js wouldn't start — `next.config.ts` not supported
- **Symptom:** Dev server crashed: "Configuring Next.js via 'next.config.ts' is not supported."
- **Root cause:** Next.js 14 doesn't support a TypeScript config file.
- **Fix:** Renamed to `next.config.mjs` and removed TS type annotations.
- **Lesson:** Next.js 14 uses `.mjs`/`.js` for config; `.ts` config only landed in later versions.

### 3. `serverExternalPackages` unrecognized
- **Symptom:** Warning: "Unrecognized key(s) in object: 'serverExternalPackages'".
- **Root cause:** In Next.js 14 this option lives under `experimental.serverComponentsExternalPackages`.
- **Fix:** Moved the key under `experimental`.
- **Lesson:** Config keys move between Next.js versions — match the option to the installed version.

### 4. API returned 500 — "Could not resolve authentication method"
- **Symptom:** Generation failed; logs showed the Anthropic SDK had no API key even though `.env.local` existed.
- **Root cause:** Next.js wasn't loading `.env.local` into the route in this setup, so `process.env.ANTHROPIC_API_KEY` was `undefined`.
- **Fix:** Changed the `dev` script to explicitly export env vars: `export $(grep -v "^#" .env.local | xargs) && next dev`.
- **Lesson:** When env vars mysteriously don't load, verify at the point of use (`process.env.X`) with a log before blaming the code. A shell-export fallback is a reliable workaround.

### 5. Invalid model ID — 404 not_found_error
- **Symptom:** `model: claude-sonnet-4-5-20251022` → 404.
- **Root cause:** Wrong/nonexistent model identifier.
- **Fix:** Switched to a valid ID (`claude-sonnet-4-5`, now `claude-sonnet-4-6`).
- **Lesson:** Use exact current model IDs; a dated suffix that doesn't exist returns 404.

### 6. `dev` script broke on `.env.local` comment line
- **Symptom:** `sh: export: '#': not a valid identifier`.
- **Root cause:** The export-all trick choked on comment (`#`) lines in `.env.local`.
- **Fix:** Filtered comments: `grep -v "^#" .env.local`.
- **Lesson:** When sourcing env files by hand, strip comments and blank lines first.

### 7. Generation slower than Vercel's 60s free-tier limit
- **Symptom:** Large plans risked exceeding the 60s function timeout; users also lose interest past ~60s.
- **Root cause:** One Claude call generated the entire tracker (~3–5k output tokens ≈ 60–90s).
- **Fix:** Fan-out architecture — split into skeleton + parallel per-phase + achievements calls, each well under 60s. Added progressive render so the user watches it fill in live.
- **Lesson:** Output-token generation is the latency bottleneck, not input. Split large generations into small parallel calls; streaming alone does NOT beat a hard function timeout.

### 8. TypeScript: `Set` iteration error
- **Symptom:** `Type 'Set<string>' can only be iterated through when using '--downlevelIteration' or target 'es2015'+`.
- **Root cause:** Spreading a `Set` (`[...set]`) under the current TS target.
- **Fix:** Used `Array.from(set)` instead of spread.
- **Lesson:** Prefer `Array.from()` over spread for Sets/Maps unless the TS target guarantees ES2015+ downlevel iteration.

### 9. Vercel had a stale API key (24 days old)
- **Symptom:** Risk that the live site's generation would fail after the mid-session key rotation.
- **Root cause:** Vercel's `ANTHROPIC_API_KEY` predated the key rotation done locally.
- **Fix:** Removed and re-added the Production key with the current working value, then smoke-tested live generation.
- **Lesson:** After rotating a secret, update **every** place it lives (local, Vercel prod, Vercel preview). Verify with a real request post-deploy.

---

## Lessons Digest (top takeaways)
1. **Secrets:** `.gitignore` env files before first commit; rotate if ever exposed; sync everywhere on rotation.
2. **Version drift:** Next.js config options and file formats change between versions — match the installed version.
3. **Latency:** Split large LLM generations into small parallel calls; verify each call's time against hard limits.
4. **Debugging env:** Log at the point of use before assuming the code is wrong.
5. **Verify live:** Always smoke-test the deployed URL with a real request, not just the build status.

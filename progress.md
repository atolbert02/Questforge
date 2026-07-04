# QuestForge — Progress Log

> A living record of everything built, every issue hit, and how it was resolved.
> **Update this file after each feature, addition, or resolved issue** so we learn from past mistakes.

**Live URL:** https://questforge-sigma.vercel.app
**Repo:** https://github.com/atolbert02/Questforge
**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind · Anthropic SDK · Vercel

---

## How to use this file
- Add a dated entry under **Timeline** for every meaningful change.
- Log every real bug under **Issues & Resolutions** with root cause + fix + lesson.
- Keep **Current State** accurate so anyone can see where things stand at a glance.

---

## Current State (as of 2026-05-29)

| Area | Status |
|---|---|
| Landing page | ✅ Live (Hero + How It Works) |
| Create page (upload / paste) | ✅ Live with progressive live render |
| Tracker UI (Dashboard, Quests, Skills, Roadmap, Achievements) | ✅ Live |
| Generation pipeline (fan-out, <60s) | ✅ Live — skeleton → parallel phases → achievements |
| Animations (quest pop, achievement flip) | ✅ Live |
| HTML export (standalone tracker) | ✅ Built |
| Deployment | ✅ Production on Vercel, auto-deploys on push |
| Auth / payments / DB | ⬜ Not started (MVP is localStorage-only) |

**Known open items**
- Preview environment's `ANTHROPIC_API_KEY` didn't re-add cleanly via CLI (Production is fine). Fix in Vercel dashboard if branch previews need generation.
- Custom domain not set up (`questforge-sigma.vercel.app` is auto-generated).

---

## Timeline

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

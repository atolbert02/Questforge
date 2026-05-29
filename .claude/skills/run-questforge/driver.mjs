#!/usr/bin/env node
/**
 * QuestForge driver — start dev server, navigate pages, screenshot, interact.
 *
 * Usage:
 *   node .claude/skills/run-questforge/driver.mjs [command] [args...]
 *
 * Commands:
 *   start              Start dev server (background)
 *   stop               Kill dev server
 *   ss [url] [name]    Screenshot a URL (default: /, name: home)
 *   nav <url>          Navigate and report page title + h1
 *   api <json>         POST to /api/generate with JSON body (pipe result to stdout)
 *   smoke              Run the full smoke check (start → screenshot each route → stop)
 */

import { chromium } from "playwright";
import { spawn, execSync } from "child_process";
import { existsSync, writeFileSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const SS_DIR = path.join(__dirname, "screenshots");
const PID_FILE = "/tmp/questforge-dev.pid";
const PORT = 3000;
const BASE = `http://localhost:${PORT}`;

function log(msg) {
  process.stderr.write(`[driver] ${msg}\n`);
}

async function waitReady(ms = 30000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(BASE);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Dev server not ready after ${ms}ms`);
}

function startServer() {
  if (existsSync(PID_FILE)) {
    try {
      const pid = parseInt(readFileSync(PID_FILE, "utf8").trim());
      process.kill(pid, 0); // throws if not alive
      log(`Dev server already running (pid ${pid})`);
      return;
    } catch {}
  }
  log("Starting Next.js dev server…");
  const child = spawn("npm", ["run", "dev"], {
    cwd: ROOT,
    detached: true,
    stdio: "ignore",
  });
  child.unref();
  writeFileSync(PID_FILE, String(child.pid));
  log(`Dev server started (pid ${child.pid})`);
}

function stopServer() {
  if (!existsSync(PID_FILE)) { log("No PID file found."); return; }
  const pid = parseInt(readFileSync(PID_FILE, "utf8").trim());
  try { process.kill(pid, "SIGTERM"); log(`Killed pid ${pid}`); } catch (e) { log(`Kill failed: ${e.message}`); }
  execSync(`rm -f ${PID_FILE}`);
}

async function screenshot(url = "/", name = "home") {
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();
  page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
  const ssPath = path.join(SS_DIR, `${name}.png`);
  await page.screenshot({ path: ssPath, fullPage: true });
  log(`Screenshot saved: ${ssPath}`);
  const title = await page.title();
  const h1 = await page.$eval("h1", (el) => el.textContent).catch(() => null);
  log(`Title: ${title} | H1: ${h1}`);
  await browser.close();
  return ssPath;
}

async function nav(url) {
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
  const title = await page.title();
  const h1 = await page.$eval("h1", (el) => el.textContent).catch(() => "(no h1)");
  const errors = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  await page.waitForTimeout(1000);
  console.log(JSON.stringify({ url, title, h1, consoleErrors: errors }));
  await browser.close();
}

async function apiGenerate(body) {
  const res = await fetch(`${BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log(text);
}

async function smoke() {
  startServer();
  log("Waiting for dev server…");
  await waitReady();
  for (const [url, name] of [["/", "home"], ["/create", "create"], ["/tracker", "tracker"]]) {
    await screenshot(url, name).catch((e) => log(`Screenshot ${url} failed: ${e.message}`));
  }
  log("Smoke complete. Screenshots in .claude/skills/run-questforge/screenshots/");
}

const [,, cmd, ...rest] = process.argv;
switch (cmd) {
  case "start":   startServer(); await waitReady(); log("Ready."); break;
  case "stop":    stopServer(); break;
  case "ss":      await screenshot(rest[0] || "/", rest[1] || "home"); break;
  case "nav":     await nav(rest[0] || "/"); break;
  case "api":     await apiGenerate(JSON.parse(rest[0] || "{}")); break;
  case "smoke":   await smoke(); break;
  default:
    console.error("Usage: driver.mjs <start|stop|ss|nav|api|smoke> [args]");
    process.exit(1);
}

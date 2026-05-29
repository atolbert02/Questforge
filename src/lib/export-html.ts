import { TrackerConfig, TrackerProgress } from "./types";

export function exportTrackerHTML(config: TrackerConfig, progress: TrackerProgress): void {
  const html = buildHTML(config, progress);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${config.projectTitle.toLowerCase().replace(/\s+/g, "-")}-tracker.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildHTML(config: TrackerConfig, progress: TrackerProgress): string {
  const savedKey = `qf_export_${config.projectTitle.replace(/\s/g, "_")}`;
  const accent = config.theme.accent;
  const secondary = config.theme.secondary;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${config.projectTitle} — Quest Tracker</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=DM+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #05060e; color: #e2e8f0; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  h1, h2, h3, .display { font-family: 'Orbitron', sans-serif; }
  .mono { font-family: 'IBM Plex Mono', monospace; }
  .app { max-width: 900px; margin: 0 auto; padding: 24px 16px; }
  .header { border-bottom: 1px solid #1a2535; padding-bottom: 20px; margin-bottom: 24px; }
  .header h1 { font-size: 1.5rem; color: ${accent}; }
  .header .tagline { color: #64748b; margin-top: 4px; font-size: 0.9rem; }
  .xp-bar-wrap { margin-top: 12px; }
  .xp-bar-bg { background: #1a2535; border-radius: 4px; height: 8px; }
  .xp-bar-fill { background: ${accent}; height: 8px; border-radius: 4px; transition: width 0.4s; }
  .xp-label { font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; color: #64748b; margin-top: 4px; display: flex; justify-content: space-between; }
  .tabs { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
  .tab { background: #0d1117; border: 1px solid #1a2535; color: #64748b; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s; }
  .tab.active { background: ${accent}22; border-color: ${accent}; color: ${accent}; }
  .tab:hover:not(.active) { border-color: #374151; color: #e2e8f0; }
  .panel { display: none; }
  .panel.active { display: block; }
  .quest-card { background: #0d1117; border: 1px solid #1a2535; border-radius: 8px; padding: 16px; margin-bottom: 10px; display: flex; align-items: flex-start; gap: 12px; cursor: pointer; transition: border-color 0.2s; }
  .quest-card:hover { border-color: #374151; }
  .quest-card.boss { border-color: ${accent}66; animation: bossGlow 2s ease-in-out infinite; }
  .quest-card.done { opacity: 0.5; background: #4ade8011; border-color: #4ade8033; }
  .quest-check { width: 20px; height: 20px; border: 2px solid #374151; border-radius: 4px; flex-shrink: 0; margin-top: 2px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .quest-check.checked { background: #4ade80; border-color: #4ade80; }
  .quest-name { font-weight: 600; font-size: 0.95rem; }
  .quest-desc { color: #64748b; font-size: 0.85rem; margin-top: 4px; }
  .quest-meta { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
  .badge { font-family: 'IBM Plex Mono', monospace; font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; background: #1a2535; color: #64748b; }
  .badge.xp { color: #fbbf24; border: 1px solid #fbbf2433; background: #fbbf2411; }
  .badge.boss-badge { color: ${accent}; border: 1px solid ${accent}44; background: ${accent}11; }
  .phase-header { font-family: 'Orbitron', sans-serif; font-size: 0.75rem; letter-spacing: 2px; padding: 8px 0; margin: 20px 0 10px; color: #64748b; border-bottom: 1px solid #1a2535; }
  .skill-card { background: #0d1117; border: 1px solid #1a2535; border-radius: 8px; padding: 16px; margin-bottom: 10px; }
  .skill-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .skill-icon { font-size: 1.5rem; }
  .skill-label { font-weight: 600; }
  .skill-xp { font-family: 'IBM Plex Mono', monospace; font-size: 0.8rem; color: #64748b; margin-left: auto; }
  .skill-bar-bg { background: #1a2535; border-radius: 4px; height: 6px; }
  .skill-bar-fill { height: 6px; border-radius: 4px; transition: width 0.4s; }
  .ach-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
  .ach-card { background: #0d1117; border: 1px solid #1a2535; border-radius: 8px; padding: 16px; text-align: center; transition: border-color 0.2s; }
  .ach-card.unlocked { border-color: #fbbf2466; background: #fbbf2411; }
  .ach-card.locked { opacity: 0.4; filter: grayscale(1); }
  .ach-icon { font-size: 2rem; margin-bottom: 8px; }
  .ach-name { font-weight: 600; font-size: 0.9rem; }
  .ach-desc { color: #64748b; font-size: 0.8rem; margin-top: 4px; }
  .roadmap { position: relative; padding-left: 24px; }
  .roadmap::before { content: ''; position: absolute; left: 8px; top: 0; bottom: 0; width: 2px; background: #1a2535; }
  .phase-milestone { position: relative; margin-bottom: 32px; }
  .phase-dot { position: absolute; left: -20px; width: 16px; height: 16px; border-radius: 50%; border: 2px solid; background: #05060e; }
  .phase-title { font-family: 'Orbitron', sans-serif; font-size: 0.85rem; letter-spacing: 1px; margin-bottom: 4px; }
  .phase-dates { font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; color: #64748b; margin-bottom: 8px; }
  .phase-tagline { color: #94a3b8; font-size: 0.85rem; }
  .phase-progress { font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; color: #64748b; margin-top: 6px; }
  .dashboard-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-bottom: 24px; }
  .stat-card { background: #0d1117; border: 1px solid #1a2535; border-radius: 8px; padding: 16px; text-align: center; }
  .stat-value { font-family: 'Orbitron', sans-serif; font-size: 1.5rem; color: ${accent}; }
  .stat-label { font-family: 'IBM Plex Mono', monospace; font-size: 0.7rem; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
  .toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #4ade80; color: #05060e; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 0.9rem; z-index: 999; opacity: 0; transition: opacity 0.3s; pointer-events: none; }
  .toast.show { opacity: 1; }
  @keyframes bossGlow {
    0%, 100% { box-shadow: 0 0 8px ${accent}; }
    50% { box-shadow: 0 0 24px ${accent}, 0 0 48px ${accent}44; }
  }
  @media (max-width: 600px) { .tabs { gap: 4px; } .tab { padding: 6px 10px; font-size: 0.8rem; } }
</style>
</head>
<body>
<div class="app">
  <div class="header">
    <h1 id="project-title"></h1>
    <div class="tagline" id="project-tagline"></div>
    <div class="xp-bar-wrap">
      <div class="xp-bar-bg"><div class="xp-bar-fill" id="xp-bar" style="width:0%"></div></div>
      <div class="xp-label"><span id="level-title"></span><span id="xp-display"></span></div>
    </div>
  </div>
  <div class="tabs">
    <button class="tab active" onclick="showTab('dashboard')">Dashboard</button>
    <button class="tab" onclick="showTab('quests')">Quests</button>
    <button class="tab" onclick="showTab('skills')">Skills</button>
    <button class="tab" onclick="showTab('roadmap')">Roadmap</button>
    <button class="tab" onclick="showTab('achievements')">Achievements</button>
  </div>
  <div id="dashboard" class="panel active"></div>
  <div id="quests" class="panel"></div>
  <div id="skills" class="panel"></div>
  <div id="roadmap" class="panel"></div>
  <div id="achievements" class="panel"></div>
</div>
<div class="toast" id="toast"></div>
<script>
const CONFIG = ${JSON.stringify(config)};
const SAVED_KEY = "${savedKey}";

let progress = (() => {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? JSON.parse(raw) : ${JSON.stringify(progress)};
  } catch { return ${JSON.stringify(progress)}; }
})();

function saveProgress() {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(progress)); } catch {}
}

function getTotalXP() {
  const done = new Set(progress.completed);
  return CONFIG.quests.filter(q => done.has(q.id)).reduce((s, q) => s + q.xp, 0);
}

function getLevel(xp) {
  let idx = 0;
  for (let i = 0; i < CONFIG.levels.length; i++) {
    if (xp >= CONFIG.levels[i].min) idx = i;
  }
  return { idx, level: CONFIG.levels[idx], next: CONFIG.levels[idx + 1] };
}

function getSkillXP() {
  const done = new Set(progress.completed);
  const map = {};
  CONFIG.skills.forEach(s => map[s.id] = 0);
  CONFIG.quests.filter(q => done.has(q.id)).forEach(q => {
    Object.entries(q.skills).forEach(([id, xp]) => { if (map[id] !== undefined) map[id] += xp; });
  });
  return map;
}

function evaluateAchievements() {
  const done = new Set(progress.completed);
  const bossesDone = CONFIG.quests.filter(q => q.boss && done.has(q.id)).length;
  const total = progress.completed.length;
  const unlocked = new Set();
  CONFIG.achievements.forEach(a => {
    const { type, value } = a.condition;
    if (type === 'quest' && done.has(value)) unlocked.add(a.id);
    else if (type === 'first_quest' && total >= 1) unlocked.add(a.id);
    else if (type === 'boss_count' && bossesDone >= value) unlocked.add(a.id);
    else if (type === 'quest_count' && total >= value) unlocked.add(a.id);
    else if (type === 'phase_clear') {
      const pq = CONFIG.quests.filter(q => q.phase === value);
      if (pq.length > 0 && pq.every(q => done.has(q.id))) unlocked.add(a.id);
    }
  });
  return unlocked;
}

function updateHeader() {
  const xp = getTotalXP();
  const { level, next } = getLevel(xp);
  document.getElementById('project-title').textContent = CONFIG.projectTitle;
  document.getElementById('project-tagline').textContent = CONFIG.tagline;
  document.getElementById('level-title').textContent = level.title;
  const pct = next ? Math.round(((xp - level.min) / (next.min - level.min)) * 100) : 100;
  document.getElementById('xp-bar').style.width = pct + '%';
  document.getElementById('xp-display').textContent = next ? xp + ' / ' + next.min + ' XP' : xp + ' XP (MAX)';
}

function showTab(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(name).classList.add('active');
  event.target.classList.add('active');
  render(name);
}

function toggleQuest(id) {
  const idx = progress.completed.indexOf(id);
  if (idx >= 0) progress.completed.splice(idx, 1);
  else { progress.completed.push(id); showToast('Quest complete! +XP'); }
  saveProgress();
  updateHeader();
  renderQuests();
  renderDashboard();
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

function renderDashboard() {
  const done = new Set(progress.completed);
  const xp = getTotalXP();
  const { level } = getLevel(xp);
  const total = CONFIG.quests.length;
  const completed = progress.completed.length;
  const bossDone = CONFIG.quests.filter(q => q.boss && done.has(q.id)).length;
  const bossTotal = CONFIG.quests.filter(q => q.boss).length;
  const unlocked = evaluateAchievements();
  const recentQuests = CONFIG.quests.filter(q => done.has(q.id)).slice(-3).reverse();
  document.getElementById('dashboard').innerHTML = \`
    <div class="dashboard-stats">
      <div class="stat-card"><div class="stat-value">\${xp}</div><div class="stat-label">Total XP</div></div>
      <div class="stat-card"><div class="stat-value">\${completed}/\${total}</div><div class="stat-label">Quests Done</div></div>
      <div class="stat-card"><div class="stat-value">\${bossDone}/\${bossTotal}</div><div class="stat-label">Boss Battles</div></div>
      <div class="stat-card"><div class="stat-value">\${unlocked.size}</div><div class="stat-label">Achievements</div></div>
      <div class="stat-card"><div class="stat-value">\${progress.streak}</div><div class="stat-label">Day Streak</div></div>
    </div>
    <div class="phase-header">CURRENT LEVEL</div>
    <div class="quest-card" style="border-color: ${accent}44; background: ${accent}11; cursor:default;">
      <div><div class="quest-name">\${level.title}</div><div class="quest-desc">\${CONFIG.characterName} — \${CONFIG.duration}</div></div>
    </div>
    \${recentQuests.length ? '<div class="phase-header">RECENTLY COMPLETED</div>' + recentQuests.map(q => \`<div class="quest-card done"><div class="quest-check checked">✓</div><div><div class="quest-name">\${q.name}</div><div class="quest-meta"><span class="badge xp">+\${q.xp} XP</span></div></div></div>\`).join('') : ''}
  \`;
}

function renderQuests() {
  const done = new Set(progress.completed);
  let html = '';
  CONFIG.phases.forEach(phase => {
    const quests = CONFIG.quests.filter(q => q.phase === phase.id);
    const pDone = quests.filter(q => done.has(q.id)).length;
    html += \`<div class="phase-header" style="color:\${phase.color}">\${phase.label} (\${pDone}/\${quests.length})</div>\`;
    quests.forEach(q => {
      const isDone = done.has(q.id);
      html += \`<div class="quest-card \${q.boss ? 'boss' : ''} \${isDone ? 'done' : ''}" onclick="toggleQuest('\${q.id}')">
        <div class="quest-check \${isDone ? 'checked' : ''}">\${isDone ? '✓' : ''}</div>
        <div style="flex:1">
          <div class="quest-name">\${q.name}</div>
          <div class="quest-desc">\${q.desc}</div>
          <div class="quest-meta">
            <span class="badge xp">+\${q.xp} XP</span>
            \${q.boss ? '<span class="badge boss-badge">⚔️ BOSS</span>' : ''}
            <span class="badge">\${q.type}</span>
          </div>
        </div>
      </div>\`;
    });
  });
  document.getElementById('quests').innerHTML = html;
}

function renderSkills() {
  const skillXP = getSkillXP();
  const maxXP = Math.max(...Object.values(skillXP), 1);
  document.getElementById('skills').innerHTML = CONFIG.skills.map(s => {
    const xp = skillXP[s.id] || 0;
    const pct = Math.round((xp / maxXP) * 100);
    return \`<div class="skill-card">
      <div class="skill-header">
        <span class="skill-icon">\${s.icon}</span>
        <span class="skill-label">\${s.label}</span>
        <span class="skill-xp">\${xp} XP</span>
      </div>
      <div class="skill-bar-bg"><div class="skill-bar-fill" style="width:\${pct}%;background:\${s.color}"></div></div>
    </div>\`;
  }).join('');
}

function renderRoadmap() {
  const done = new Set(progress.completed);
  document.getElementById('roadmap').innerHTML = '<div class="roadmap">' + CONFIG.phases.map(phase => {
    const quests = CONFIG.quests.filter(q => q.phase === phase.id);
    const pDone = quests.filter(q => done.has(q.id)).length;
    const pct = quests.length ? Math.round((pDone / quests.length) * 100) : 0;
    return \`<div class="phase-milestone">
      <div class="phase-dot" style="border-color:\${phase.color};background:\${pDone===quests.length ? phase.color : '#05060e'}"></div>
      <div class="phase-title" style="color:\${phase.color}">\${phase.label}</div>
      <div class="phase-dates mono">\${phase.dates}</div>
      <div class="phase-tagline">\${phase.tagline}</div>
      <div class="phase-progress mono">\${pDone}/\${quests.length} quests complete (\${pct}%)</div>
    </div>\`;
  }).join('') + '</div>';
}

function renderAchievements() {
  const unlocked = evaluateAchievements();
  document.getElementById('achievements').innerHTML = '<div class="ach-grid">' + CONFIG.achievements.map(a => {
    const isUnlocked = unlocked.has(a.id);
    return \`<div class="ach-card \${isUnlocked ? 'unlocked' : 'locked'}">
      <div class="ach-icon">\${a.icon}</div>
      <div class="ach-name">\${a.name}</div>
      <div class="ach-desc">\${a.desc}</div>
    </div>\`;
  }).join('') + '</div>';
}

function render(tab) {
  if (tab === 'dashboard') renderDashboard();
  else if (tab === 'quests') renderQuests();
  else if (tab === 'skills') renderSkills();
  else if (tab === 'roadmap') renderRoadmap();
  else if (tab === 'achievements') renderAchievements();
}

updateHeader();
renderDashboard();
</script>
</body>
</html>`;
}

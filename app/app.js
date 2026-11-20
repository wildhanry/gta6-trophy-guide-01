// Platinum in Leonida — an offline GTA VI trophy guide and tracker.
// Everything renders from data/trophies.json on this page's own origin; the
// app fetches nothing else, stores progress in localStorage as a plain array
// of earned trophy names (the same shape the starter checklist exported, so
// old export files still import), and supports shareable filtered views via
// URL parameters: ?grade=silver, ?category=Strangers, ?kind=skill,
// ?watch=1, ?q=vault, ?shield=0, ?view=roadmap|cards|controls.

const STORAGE_KEY = 'gta6-trophy-checklist';

const els = {
  cards: document.getElementById('cards'),
  search: document.getElementById('search'),
  grade: document.getElementById('grade'),
  category: document.getElementById('category'),
  kind: document.getElementById('kind'),
  watchOnly: document.getElementById('watch-only'),
  hideEarned: document.getElementById('hide-earned'),
  shield: document.getElementById('shield'),
  showing: document.getElementById('showing'),
  progress: document.getElementById('progress'),
  progressFill: document.getElementById('progress-fill'),
  gradeBreakdown: document.getElementById('grade-breakdown'),
  watchNote: document.getElementById('watch-note'),
};

const KIND_WORDS = {
  story: 'Story & strands',
  skill: 'Skill & feats',
  'long-haul': 'Long haul & counts',
};

let earned = new Set();
try {
  earned = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'));
} catch {
  earned = new Set();
}
const revealed = new Set();

const data = await (await fetch('data/trophies.json')).json();
const trophies = data.trophies;

function persistProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned]));
}

function node(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text !== undefined) n.textContent = text;
  return n;
}

// --- Static sections: title, about, roadmap, category options --------------

document.getElementById('guide-title').textContent = (data.guideTitle ?? 'GTA VI Trophy Guide').split('—')[0].trim();
document.getElementById('intro').textContent = data.intro ?? '';
document.getElementById('honesty').textContent = data.honestyNote ?? '';
document.getElementById('sources').textContent = data.sourcesNote ?? '';

const roadmapList = document.getElementById('roadmap');
for (const stop of data.roadmap ?? []) {
  const item = node('li', 'roadmap-stop');
  item.append(node('h3', null, `Stop ${stop.phase} — ${stop.title}`));
  item.append(node('p', null, stop.text));
  if (stop.trophies) item.append(node('p', 'roadmap-trophies', `Clears: ${stop.trophies}`));
  roadmapList.append(item);
}

for (const name of [...new Set(trophies.map((t) => t.category))].sort()) {
  const opt = node('option', null, name);
  opt.value = name;
  els.category.append(opt);
}

// --- Filtering ---------------------------------------------------------------

function trophyMatches(t) {
  if (els.grade.value !== 'all' && t.grade !== els.grade.value) return false;
  if (els.category.value !== 'all' && t.category !== els.category.value) return false;
  if (els.kind.value !== 'all' && t.type !== els.kind.value) return false;
  if (els.watchOnly.checked && !t.missable) return false;
  if (els.hideEarned.checked && earned.has(t.name)) return false;
  const q = els.search.value.trim().toLowerCase();
  if (q) {
    const haystack = [t.name, t.description, t.category, t.guide, t.tip, ...(t.steps ?? [])]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

// --- Card rendering ------------------------------------------------------------

function buildCard(t) {
  const isEarned = earned.has(t.name);
  const shielded = Boolean(t.spoiler) && els.shield.checked && !isEarned && !revealed.has(t.name);
  const card = node('article', `card grade-${t.grade}${isEarned ? ' is-earned' : ''}`);

  const head = node('div', 'card-head');
  const box = node('input');
  box.type = 'checkbox';
  box.checked = isEarned;
  box.setAttribute('aria-label', `Mark ${shielded ? 'this hidden trophy' : t.name} as earned`);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.name);
    else earned.delete(t.name);
    persistProgress();
    renderCards();
  });
  head.append(box);
  head.append(node('h3', 'card-name', shielded ? 'Hidden trophy — spoiler shield on' : t.name));
  head.append(node('span', `pill pill-${t.grade}`, t.grade));
  card.append(head);

  const meta = node('p', 'card-meta', `${t.category} · ${KIND_WORDS[t.type] ?? t.type}`);
  if (t.missable) meta.append(' ', node('span', 'pill pill-watch', 'WATCH'));
  if (t.spoiler) meta.append(' ', node('span', 'pill pill-spoiler', 'SPOILER'));
  card.append(meta);

  if (shielded) {
    card.append(node('p', 'shield-note', 'This trophy is story-sensitive. Its name, official description and guide stay hidden until you earn it, switch the spoiler shield off, or reveal it here.'));
    const reveal = node('button', 'reveal-button', 'Reveal this trophy');
    reveal.type = 'button';
    reveal.addEventListener('click', () => {
      revealed.add(t.name);
      renderCards();
    });
    card.append(reveal);
    return card;
  }

  card.append(node('p', 'official-text', `Official: “${t.description}”`));
  card.append(node('p', 'guide-text', t.guide));
  const steps = node('ol', 'step-list');
  for (const s of t.steps ?? []) steps.append(node('li', null, s));
  card.append(steps);
  if (t.tip) card.append(node('p', 'tip-text', `Field tip: ${t.tip}`));
  if (t.source) card.append(node('p', 'source-text', t.source));
  return card;
}

function renderCards() {
  els.cards.replaceChildren();
  let shown = 0;
  for (const t of trophies) {
    if (!trophyMatches(t)) continue;
    shown += 1;
    els.cards.append(buildCard(t));
  }
  if (shown === 0) {
    els.cards.append(node('p', 'empty-note', 'No trophies match those filters. Loosen one filter and the guide comes back.'));
  }
  els.showing.textContent = `Showing ${shown} of ${trophies.length} trophies`;

  els.progress.textContent = `${earned.size} of ${trophies.length} earned`;
  const pct = trophies.length ? Math.round((earned.size / trophies.length) * 100) : 0;
  els.progressFill.style.width = `${pct}%`;

  const perGrade = {};
  for (const t of trophies) {
    perGrade[t.grade] = perGrade[t.grade] ?? { got: 0, total: 0 };
    perGrade[t.grade].total += 1;
    if (earned.has(t.name)) perGrade[t.grade].got += 1;
  }
  els.gradeBreakdown.textContent = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => `${g} ${perGrade[g]?.got ?? 0}/${perGrade[g]?.total ?? 0}`)
    .join(' · ');

  const watchLeft = trophies.filter((t) => t.missable && !earned.has(t.name)).length;
  els.watchNote.textContent = watchLeft
    ? `Watch list: ${watchLeft} to verify before you pass their moment`
    : 'Watch list clear — every verify-first trophy is earned';
}

// --- Controls ------------------------------------------------------------------

document.getElementById('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify([...earned], null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('import').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const names = Array.isArray(parsed) ? parsed : parsed.earned;
    if (Array.isArray(names)) {
      earned = new Set(names.filter((n) => trophies.some((t) => t.name === n)));
      persistProgress();
      renderCards();
    }
  } catch {
    els.showing.textContent = 'That import file could not be read as a progress file.';
  }
});

for (const ctl of [els.grade, els.category, els.kind, els.watchOnly, els.hideEarned, els.shield]) {
  ctl.addEventListener('change', renderCards);
}
els.search.addEventListener('input', renderCards);

// --- Filtered views from the URL (used for shareable links and screenshots) ---

const params = new URLSearchParams(location.search);
if (params.get('grade')) els.grade.value = params.get('grade');
if (params.get('category')) els.category.value = params.get('category');
if (params.get('kind')) els.kind.value = params.get('kind');
if (params.get('q')) els.search.value = params.get('q');
if (params.get('watch') === '1') els.watchOnly.checked = true;
if (params.get('shield') === '0') els.shield.checked = false;

renderCards();

const viewTargets = {
  roadmap: 'roadmap-sheet',
  controls: 'controls-sheet',
  cards: 'cards',
};
const viewTarget = viewTargets[params.get('view')];
if (viewTarget) {
  document.getElementById(viewTarget).scrollIntoView();
}

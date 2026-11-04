type SubResult = { title: string; url: string; excerpt: string };
type PageData = { url: string; excerpt: string; meta: Record<string, string>; filters: Record<string, string[]>; sub_results: SubResult[] };
type Pagefind = {
  search: (q: string, o?: { filters?: Record<string, string> }) => Promise<{ results: { id: string; score: number; data: () => Promise<PageData> }[] }>;
  options: (o: Record<string, unknown>) => Promise<void>;
};
type Hit = { page: string; heading: string; url: string; excerpt: string; group: string; score: number };

// Pagefind has no synonyms; these extra queries run alongside the user's
// query with a lower weight, so "sso" also finds the OIDC and LDAP pages.
const SYN: Record<string, string[]> = {
  sso: ['oidc', 'saml', 'ldap'], oidc: ['sso'], ldap: ['sso'], https: ['certificate', 'tls'], ssl: ['tls', 'certificate'],
  tls: ['certificate'], cert: ['certificate'], proxy: ['caddy'], caddy: ['proxy'], backup: ['backups'], restore: ['backups'],
  upgrade: ['update'], update: ['upgrade'], rbac: ['roles', 'permissions'], roles: ['permissions'], role: ['permissions'],
  permission: ['permissions'], '2fa': ['totp', 'two-factor'], mfa: ['totp', 'two-factor'], k8s: ['kubernetes'],
  uninstall: ['remove'], password: ['reset-password'], offline: ['disconnected'], s3: ['minio'], smb: ['cifs'],
  api: ['token'], cli: ['dmctl'], pi: ['arm64', 'raspberry'],
};
const RECENT_KEY = 'dm-search-recent';

const dlg = document.getElementById('dm-search') as HTMLDialogElement | null;
const input = document.getElementById('dm-sq') as HTMLInputElement | null;
const box = document.getElementById('dm-sres') as HTMLDivElement | null;

let pf: Pagefind | null = null;
let pfFailed = false;
let kind = '';
let hits: Hit[] = [];
let sel = 0;
let seq = 0;
let opener: Element | null = null;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const recent = (): string[] => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; } };
const remember = (q: string) => { try { localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...recent().filter((r) => r !== q)].slice(0, 5))); } catch { /* storage blocked */ } };

async function loadPagefind(): Promise<Pagefind | null> {
  if (pf || pfFailed) return pf;
  try {
    const url = '/pagefind/pagefind.js';
    pf = (await import(/* @vite-ignore */ url)) as Pagefind;
    await pf.options({ excerptLength: 22 });
  } catch {
    pfFailed = true;
  }
  return pf;
}

async function run(q: string): Promise<Hit[]> {
  const p = await loadPagefind();
  if (!p) return [];
  const filters = kind ? { kind } : undefined;
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const queries: [string, number][] = [[q, 1]];
  terms.forEach((t, i) => (SYN[t] || []).forEach((s) => { const alt = [...terms]; alt[i] = s; queries.push([alt.join(' '), 0.6]); }));
  const pages = new Map<string, { score: number; load: () => Promise<PageData> }>();
  const sets = await Promise.all(queries.slice(0, 6).map(([qq, w]) => p.search(qq, { filters }).then((r) => ({ r, w }))));
  for (const { r, w } of sets) for (const res of r.results.slice(0, 12)) {
    const prev = pages.get(res.id);
    const score = res.score * w;
    if (!prev || prev.score < score) pages.set(res.id, { score: prev ? Math.max(prev.score, score) : score, load: res.data });
  }
  const top = [...pages.values()].sort((a, b) => b.score - a.score).slice(0, 14);
  const loaded = await Promise.all(top.map((t) => t.load().then((d) => ({ d, score: t.score * (d.filters.kind?.[0] === 'Releases' ? 0.7 : 1) }))));
  const datas = loaded.sort((a, b) => b.score - a.score).slice(0, 10);
  const titleHits = (t: string) => terms.filter((w) => t.toLowerCase().includes(w)).length;
  const clean = (u: string) => u.replace(/#_top$/, '');
  const out: Hit[] = [];
  for (const { d, score } of datas) {
    const page = d.meta.title || d.url;
    const group = d.meta.section || d.filters.kind?.[0] || 'Website';
    const all = d.sub_results?.length ? d.sub_results : [{ title: page, url: d.url, excerpt: d.excerpt }];
    const subs = all.map((s, i) => ({ s, i, h: s.title === page ? 0 : titleHits(s.title) })).sort((a, b) => b.h - a.h || a.i - b.i).slice(0, 3);
    subs.forEach(({ s }) => out.push({ page, heading: s.title === page ? '' : s.title, url: clean(s.url), excerpt: s.excerpt, group, score }));
  }
  return out.slice(0, 30);
}

function renderEmpty() {
  if (!box) return;
  const r = recent();
  const tries = ['backup s3', 'oidc keycloak', 'agent offline', 'uninstall'];
  box.innerHTML = `<div class="sempty">${r.length ? `<div class="sgrp" style="padding-left:0">Recent searches</div>${r.map((x) => `<div><button type="button" data-q="${esc(x)}">${esc(x)}</button></div>`).join('')}<br>` : ''}Try ${tries.map((t) => `<button type="button" data-q="${t}">${t}</button>`).join(', ')}.</div>`;
  hits = [];
}

function render() {
  if (!box || !input) return;
  if (pfFailed) { box.innerHTML = '<div class="sempty">The search index is built with the site (<code>npm run build</code>); it is not available in dev mode.</div>'; return; }
  if (!hits.length) {
    box.innerHTML = `<div class="sempty">Nothing found for “${esc(input.value)}”. Check the spelling, try fewer words, or ask in <a href="https://github.com/Dockmesh/dockmesh/discussions">GitHub Discussions</a>.</div>`;
    return;
  }
  let last = '';
  box.innerHTML = hits.map((h, i) => {
    const g = h.group !== last ? `<div class="sgrp" role="presentation">${esc(h.group)}</div>` : '';
    last = h.group;
    return `${g}<a class="sitem" id="dm-si-${i}" href="${esc(h.url)}" role="option" aria-selected="${i === sel}" data-i="${i}"><div class="t">${esc(h.page)}${h.heading ? ` <small>› ${esc(h.heading)}</small>` : ''}</div><div class="x">${h.excerpt}</div></a>`;
  }).join('');
  input.setAttribute('aria-activedescendant', `dm-si-${sel}`);
  document.getElementById(`dm-si-${sel}`)?.scrollIntoView({ block: 'nearest' });
}

async function update() {
  if (!input) return;
  const q = input.value.trim();
  const my = ++seq;
  if (!q) { renderEmpty(); return; }
  const r = await run(q);
  if (my !== seq) return;
  hits = r; sel = 0; render();
}

function moveSel(d: number) {
  if (!hits.length) return;
  sel = (sel + d + hits.length) % hits.length;
  box?.querySelectorAll('.sitem').forEach((el, i) => el.setAttribute('aria-selected', String(i === sel)));
  input?.setAttribute('aria-activedescendant', `dm-si-${sel}`);
  document.getElementById(`dm-si-${sel}`)?.scrollIntoView({ block: 'nearest' });
}

export function openSearch() {
  if (!dlg || !input || dlg.open) return;
  opener = document.activeElement;
  dlg.showModal();
  input.select();
  void loadPagefind();
  void update();
}

if (dlg && input && box) {
  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-dm-search]')) { openSearch(); return; }
    if (t === dlg) { dlg.close(); return; }
    const chip = t.closest<HTMLButtonElement>('[data-kind]');
    if (chip && dlg.contains(chip)) {
      kind = chip.dataset.kind || '';
      dlg.querySelectorAll('[data-kind]').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      void update(); input.focus(); return;
    }
    const qb = t.closest<HTMLButtonElement>('[data-q]');
    if (qb) { input.value = qb.dataset.q || ''; void update(); input.focus(); return; }
    if (t.closest('.sitem')) { remember(input.value.trim()); dlg.close(); }
  });
  input.addEventListener('input', () => void update());
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveSel(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveSel(-1); }
    else if (e.key === 'Enter' && hits[sel]) { e.preventDefault(); remember(input.value.trim()); location.href = hits[sel].url; dlg.close(); }
  });
  dlg.addEventListener('close', () => { if (opener instanceof HTMLElement) opener.focus(); });
  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement as HTMLElement | null)?.tagName || '') || (document.activeElement as HTMLElement | null)?.isContentEditable;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); dlg.open ? dlg.close() : openSearch(); }
    else if (e.key === '/' && !typing && !dlg.open) { e.preventDefault(); openSearch(); }
  });
}

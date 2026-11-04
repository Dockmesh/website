import { DEMO as D } from '../data/demo';
import { ICONS } from './appIcons';

export interface Frame {
  html: string;
  nav: string;
  cursor?: { sel: string; click?: boolean };
}
export interface Scene {
  label: string;
  path: string;
  dur: number;
  summary: string;
  frame: (t: number) => Frame;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const ic = (name: string, size = 16, sw = 2, cls = '') =>
  `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const between = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

// Same rule as the app's size labels for archives and transfers.
function humanBytes(n: number): string {
  if (n < 1000) return `${n} B`;
  let div = 1000, exp = 0;
  for (let v = Math.floor(n / 1000); v >= 1000; v = Math.floor(v / 1000)) { div *= 1000; exp++; }
  return `${(n / div).toFixed(1)} ${'kMGTPE'[exp]}B`;
}

function clock(sec: number, base: [number, number, number]): string {
  let s = base[2] + sec, m = base[1] + Math.floor(s / 60), h = base[0];
  s %= 60; m %= 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} PM`;
}

const chip = (tone: string, label: string) => `<span class="a-chip ${tone}"><i></i>${esc(label)}</span>`;
const checkbox = (on = false) => `<input type="checkbox" tabindex="-1" aria-hidden="true"${on ? ' checked' : ''}>`;

export function sidebar(logo: string): string {
  const items = D.shell.nav.map((g) =>
    `${g.title ? `<div class="a-sec">${esc(g.title)}</div>` : ''}${g.items.map((it) =>
      `<div class="a-item" data-nav="${it.key}">${ic(it.icon, 16, 1.8)}<span class="lbl">${esc(it.label)}</span>${'badge' in it && it.badge ? `<span class="bd">${it.badge}</span>` : ''}</div>`).join('')}`).join('');
  return `<div class="a-side">
    <div class="a-brand"><span class="a-logo"><span class="mark">${logo}</span><b>dock<span>mesh</span></b></span><span class="a-collapse">${ic('chevron-left', 14)}</span></div>
    <div class="a-search">${ic('search', 14)}<span>${esc(D.shell.search)}</span><span class="a-kbd" style="flex:none">${esc(D.shell.kbd)}</span></div>
    <div class="a-scroll">${items}</div>
    <div class="a-user"><div class="a-user-btn"><span class="a-avatar">${D.shell.user.initial}</span><span class="a-who"><span class="n">${D.shell.user.name}</span><span class="r">${D.shell.user.role}</span></span></div><span class="a-health"><i></i><b></b></span></div>
  </div>`;
}

function topbar(crumbs: string[], running: number): string {
  const trail = crumbs.map((c, i) => (i === crumbs.length - 1 ? `<b>${esc(c)}</b>` : `<span>${esc(c)}</span><span aria-hidden="true">/</span>`)).join('');
  const pill = running > 0
    ? `<span class="a-tb ops">${ic('loader-circle', 14, 2, 'a-spin')}<span>${D.shell.running(running)}</span></span>`
    : `<span class="a-tb ops">${ic('history', 14)}</span>`;
  return `<header class="a-top"><nav class="a-crumbs">${trail}</nav><div class="a-pills">${pill}</div>
    <span class="a-tb"><i class="a-dot acc"></i><span class="name">${D.shell.lens}</span>${ic('chevron-down', 13)}</span>
    <span class="a-tb icon">${ic('bell', 15)}<span class="a-count">${D.shell.bell}</span></span>
    <span class="a-tb icon">${ic('sun', 15, 2, 'a-sun')}${ic('moon', 15, 2, 'a-moon')}</span></header>`;
}

const live = (s: number) => `<span class="a-live"><i></i><span>${D.shell.live} · ${D.shell.updated(s)}</span><span class="rf">${ic('refresh-cw', 13, 1.8)}</span></span>`;
const statBar = (items: { label: string; value: string | number; note?: string; warn?: boolean }[]) =>
  `<div class="a-sb">${items.map((s) => `<div><small>${esc(s.label)}</small><b class="v">${esc(String(s.value))}</b><span class="n${s.warn ? ' warn' : ''}">${esc(s.note || ' ')}</span></div>`).join('')}</div>`;
const tabsBar = (tabs: [string, string | number | null, boolean][]) =>
  `<div class="a-tabs">${tabs.map(([l, c, on]) => `<span class="${on ? 'on' : ''}">${esc(l)}${c != null ? `<span class="c">${c}</span>` : ''}</span>`).join('')}</div>`;

interface Op { status: 'queued' | 'running' | 'done'; label: string; pct: number; progress?: number }
function opProgress(op: Op): string {
  if (op.status === 'done') return `<span class="a-opp row">${chip('ok', D.ops.done)}</span>`;
  const txt = op.status === 'queued' ? D.ops.queued : op.label;
  const pr = op.progress != null ? `<span class="a-num">· ${Math.round(op.progress * 100)} %</span>` : '';
  return `<span class="a-opp"><span class="txt">${esc(txt)}${pr}</span><span class="a-bar"><i style="width:${Math.max(4, Math.round(op.pct * 100))}%"></i></span></span>`;
}

function toasts(list: { title: string; body?: string; kind: 'info' | 'success' }[], top = false): string {
  if (!list.length) return '';
  return `<div class="a-toasts${top ? ' top' : ''}">${list.map((t) => `<div class="a-toast ${t.kind}"><div class="txt"><div class="t">${esc(t.title)}</div>${t.body ? `<div class="d">${esc(t.body)}</div>` : ''}</div><span class="x">${ic('x', 13, 1.8)}</span></div>`).join('')}</div>`;
}

const modalHead = (title: string) => `<div class="a-dlg-h"><h2>${esc(title)}</h2><span class="a-dlg-x">${ic('x', 15, 1.8)}</span></div>`;

interface Step { label: string; status: 'pending' | 'running' | 'succeeded' | 'skipped'; meta?: string; detail?: string }
function stepList(steps: Step[]): string {
  const icon = (s: Step['status']) => s === 'succeeded' ? ic('check', 13, 2.4) : s === 'skipped' ? ic('minus', 13, 2.2) : s === 'running' ? ic('loader-circle', 13, 2.2, 'a-spin') : ic('circle', 9, 2);
  return `<ol class="a-steps">${steps.map((s) => `<li class="${s.status}"><span class="ic">${icon(s.status)}</span><div><div class="row"><span class="lbl">${esc(s.label)}</span><span class="meta">${s.meta ?? ''}</span></div>${s.status === 'running' ? '<div class="a-bar indet"><i></i></div>' : ''}${s.detail ? `<div class="detail">${esc(s.detail)}</div>` : ''}</div></li>`).join('')}</ol>`;
}

function opDialog(o: { title: string; running: boolean; by: string; when: string; elapsed: string; steps: Step[]; log: { t: string; x: string }[]; openLabel: string }): string {
  const head = `${o.by ? esc(o.by) : ''} · ${esc(D.ops.started(`${D.date}, ${o.when}`))} · ${o.elapsed}`;
  return `<div class="a-overlay"><div class="a-dlg wide a-opd">${modalHead(o.title)}<div class="a-dlg-b">
    <div class="head">${chip(o.running ? 'acc' : 'ok', o.running ? D.ops.status.running : D.ops.status.succeeded)}<span class="a-sub">${head}</span></div>
    <section><h3 class="a-h2">${D.ops.steps}</h3>${stepList(o.steps)}</section>
    <section><h3 class="a-h2">${D.ops.log} <span class="a-sub">${D.ops.logLines(o.log.length)}${o.running ? ` · ${D.ops.closeKeepsRunning}` : ''}</span></h3>
    <div class="a-log">${o.log.map((l) => `<div class="ln"><span class="t">${l.t}</span><span class="x">${esc(l.x)}</span></div>`).join('')}</div></section>
  </div><div class="a-dlg-f"><span class="a-btn ghost">${esc(o.openLabel)}</span><span class="a-sp"></span>${o.running ? `<span class="a-btn ghost">${D.ops.cancel}</span>` : ''}<span class="a-btn" data-c="close">${D.ops.close}</span></div></div></div>`;
}

const page = (crumbs: string[], running: number, body: string, extra = '') =>
  `${topbar(crumbs, running)}<div class="a-page">${body}</div>${extra}`;

/* ---------------------------------------------------------------- Update */

const U = D.update;
const U_SELECT = 1500, U_BUTTON = 3300, U_FIRST = 3600, U_EACH = 3200, U_HOLD_END = 15600;
const U_PULL = 1900, U_KEEP = 2300;

function updateFrame(t: number): Frame {
  const clicked = t >= U_BUTTON;
  const selected = t >= U_SELECT && !clicked;
  const ops = U.rows.map((_, i): Op | null => {
    if (!clicked) return null;
    const p = t - (U_FIRST + i * U_EACH);
    if (p < 0) return { status: 'queued', label: '', pct: 0 };
    if (p >= U_EACH) return { status: 'done', label: '', pct: 1 };
    if (p < U_PULL) { const f = p / U_PULL; return { status: 'running', label: U.steps[0], pct: f / 3, progress: f }; }
    if (p < U_KEEP) return { status: 'running', label: U.steps[1], pct: 1 / 3 };
    return { status: 'running', label: U.steps[2], pct: 2 / 3 };
  });
  const finishedAt = U.rows.map((_, i) => U_FIRST + (i + 1) * U_EACH);
  const done = ops.map((o) => o?.status === 'done');
  const apps = U.rows.map((_, i) => i).filter((i) => !done[i]);
  const order = [...apps, ...U.rows.map((_, i) => i).filter((i) => done[i])];
  const doneCount = done.filter(Boolean).length;
  const active = ops.filter((o) => o && o.status !== 'done').length;
  const lastLoad = doneCount ? finishedAt[doneCount - 1] : 0;
  const secs = (doneCount ? 0 : 2) + Math.floor((t - lastLoad) / 1000);

  const toastList: Parameters<typeof toasts>[0] = [];
  if (clicked && t < U_BUTTON + 5000) toastList.push({ title: U.queued(3), body: U.queuedBody, kind: 'info' });
  U.rows.forEach((r, i) => {
    if (t >= finishedAt[i] && t < finishedAt[i] + 4000) toastList.push({ title: D.ops.finished(`${U.kind} ${r.name}`), kind: 'success' });
  });

  const rowHtml = order.map((i) => {
    const r = U.rows[i], op = ops[i];
    const cell = op
      ? `<span class="a-act">${opProgress(op)}${op.status === 'running' || op.status === 'queued' ? `<span class="a-btn sm ghost">${D.ops.cancel}</span>` : ''}</span>`
      : `<span class="a-act"><span class="a-btn sm ghost">${U.notes}</span><span class="a-btn sm">${U.update}</span></span>`;
    const box = !op || op.status === 'done' ? checkbox(selected) : '';
    return `<div class="a-tr${selected ? ' sel' : ''}" style="grid-template-columns:22px minmax(180px,1.3fr) minmax(200px,1.6fr) minmax(150px,1fr) 110px 190px"><span>${box}</span>
      <span class="a-nm"><span class="t">${r.name}</span><small>${U.standalone}</small></span><span class="a-mono">${r.image}</span>
      <span class="a-mono a-dim">${r.from} → <b class="a-new">${r.to}</b></span><span class="a-num a-dim">${U.checked}</span>${cell}</div>`;
  }).join('');

  const recent = order.filter((i) => done[i]).sort((a, b) => finishedAt[b] - finishedAt[a]);
  const recentHtml = recent.length ? `<div><h2 class="a-h2">${U.recent}</h2><div class="a-tbl">${recent.map((i) => `<div class="a-tr" style="grid-template-columns:minmax(180px,1.3fr) minmax(200px,1.4fr) 140px"><span class="a-nm"><span class="t">${U.rows[i].name}</span><small>${U.standalone} · ${U.by(U.actor)}</small></span><span class="a-mono a-dim">${U.newImage(U.rows[i].to)}</span><span class="a-num a-dim">${D.shell.ago.now}</span></div>`).join('')}</div></div>` : '';

  const body = `<section class="a-pg">
    <div class="a-ph"><h1>${U.title}</h1><span class="a-sub">${U.sub(apps.length)}</span><span class="a-sp"></span>${live(secs)}<span class="a-btn primary${selected ? '' : ' off'}" data-c="go"${selected ? '' : ' role="button" aria-disabled="true"'}>${U.button}${selected ? ' (3)' : ''}</span></div>
    ${statBar([
      { label: U.stats.images, value: apps.length, note: apps.length ? U.stats.imagesNote : '', warn: apps.length > 0 },
      { label: U.stats.system, value: U.stats.systemValue, note: U.stats.systemNote },
      { label: U.stats.lastCheck, value: U.stats.lastCheckValue, note: U.stats.lastCheckNote },
      { label: U.stats.week, value: doneCount },
    ])}
    <div><h2 class="a-h2">${U.apps}</h2><div class="a-tbl"><div class="a-tr th" style="grid-template-columns:22px minmax(180px,1.3fr) minmax(200px,1.6fr) minmax(150px,1fr) 110px 190px"><span><span data-c="all" style="display:inline-flex">${checkbox(selected)}</span></span><span>${U.columns.container}</span><span>${U.columns.image}</span><span>${U.columns.digest}</span><span>${U.columns.checked}</span><span></span></div>${rowHtml}</div>
    <p class="a-sub a-note">${U.footer}${ic('info', 13, 1.8)}</p></div>${recentHtml}</section>`;

  let cursor: Frame['cursor'];
  if (t >= 400 && t < U_BUTTON + 400) cursor = t < 2300 ? { sel: '[data-c="all"]', click: t >= U_SELECT && t < U_SELECT + 450 } : { sel: '[data-c="go"]', click: t >= U_BUTTON && t < U_BUTTON + 450 };
  return { html: page(U.crumbs, active, body, toasts(toastList)), nav: 'updates', cursor };
}

/* ---------------------------------------------------------------- Backup */

const B = D.backup;
const B_MENU = 1400, B_RUN = 3000, B_OPEN = 4600, B_CLOSE = 12100, B_END = 14400;
const B_ARCHIVE_FROM = 600, B_ARCHIVE_LEN = 6200, B_VERIFY_END = 7400, B_DONE = 7700;

function backupFrame(t: number): Frame {
  const p = t - B_RUN;
  const started = t >= B_RUN;
  const finished = started && p >= B_DONE;
  const R = B.run, S = R.seconds;
  const archF = between(p, B_ARCHIVE_FROM, B_ARCHIVE_FROM + B_ARCHIVE_LEN);
  const secs = (n: number) => `${Math.round(n)} s`;

  const steps: Step[] = B.steps.map((label): Step => ({ label, status: 'pending' }));
  if (started) {
    steps[0] = p < B_ARCHIVE_FROM ? { label: B.steps[0], status: 'running', meta: secs(0) } : { label: B.steps[0], status: 'succeeded', meta: secs(S.prepare) };
    if (p >= B_ARCHIVE_FROM) steps[1] = { label: B.steps[1], status: 'skipped', detail: B.noneConfigured };
    if (p >= B_ARCHIVE_FROM) {
      steps[2] = p < B_ARCHIVE_FROM + B_ARCHIVE_LEN
        ? { label: B.steps[2], status: 'running', meta: secs(archF * S.archive), detail: B.archived(humanBytes(Math.floor(archF * R.archiveBytes))) }
        : { label: B.steps[2], status: 'succeeded', meta: secs(S.archive), detail: B.written(humanBytes(R.archiveBytes)) };
    }
    if (p >= B_ARCHIVE_FROM + B_ARCHIVE_LEN) {
      steps[3] = p < B_VERIFY_END ? { label: B.steps[3], status: 'running', meta: secs(between(p, 6800, B_VERIFY_END) * S.verify) } : { label: B.steps[3], status: 'succeeded', meta: secs(S.verify), detail: B.checksum };
    }
    if (p >= B_VERIFY_END) {
      steps[4] = { label: B.steps[4], status: 'skipped', detail: B.noneConfigured };
      steps[5] = p < B_DONE ? { label: B.steps[5], status: 'running', meta: secs(0) } : { label: B.steps[5], status: 'succeeded', meta: secs(S.retention) };
    }
  }
  const doneSteps = steps.filter((s) => s.status === 'succeeded' || s.status === 'skipped').length;
  const running = steps.find((s) => s.status === 'running');
  const op: Op | null = !started ? null : finished ? { status: 'done', label: '', pct: 1 } : { status: 'running', label: running?.label ?? B.steps[0], pct: doneSteps / B.steps.length };

  const log: { t: string; x: string }[] = [];
  const base: [number, number, number] = [1, 2, 17];
  if (started) log.push({ t: clock(0, base), x: B.log.start });
  if (started && p >= B_ARCHIVE_FROM) log.push({ t: clock(0, base), x: B.log.stream(R.path) });
  if (started && p >= B_ARCHIVE_FROM + B_ARCHIVE_LEN) log.push({ t: clock(S.archive, base), x: B.log.wrote(R.archiveBytes, R.sha) });
  if (started && p >= B_VERIFY_END) log.push({ t: clock(S.archive + S.verify, base), x: B.log.read(R.archiveBytes) });

  const menuOpen = t >= B_MENU && t < B_RUN;
  const runs = started ? B.tabCounts.runs + 1 : B.tabCounts.runs;
  const dialogOpen = t >= B_OPEN && t < B_CLOSE;
  const total = finished ? S.total : Math.round(between(p, 0, B_DONE) * S.total);

  const jobRows = B.jobs.map((j) => {
    const mine = j.id === 'nextcloud';
    const last = mine && op
      ? `<span class="a-nm"><span class="op-cell" data-c="opp" style="display:inline-flex;align-items:center;gap:6px;min-width:0;max-width:100%">${opProgress(op)}${op.status === 'done' ? '' : `<span class="a-btn sm ghost">${D.ops.cancel}</span>`}</span></span>`
      : `<span class="a-nm"><span class="t" style="font-weight:500">${j.last}</span><small>${j.ago}</small></span>`;
    const menu = mine && menuOpen
      ? `<div class="a-pop"><div>${B.menu.open}<span class="k">${B.menu.openKbd}</span></div><div class="hl" data-c="runnow">${B.menu.runNow}</div><div>${B.menu.edit}</div><div>${B.menu.restore}</div><hr><div>${B.menu.del}</div></div>`
      : '';
    return `<div class="a-tr click${mine && menuOpen ? ' hl' : ''}" style="grid-template-columns:14px minmax(160px,1.2fr) minmax(160px,1.3fr) 110px minmax(110px,.9fr) minmax(130px,1fr) minmax(170px,1.2fr) 50px 40px">
      <span><span class="a-dot ok"></span></span><span class="a-nm"><span class="t">${j.name}</span></span>
      <span class="a-nm"><span class="t" style="font-weight:500">${j.what}</span><small>${j.kind}</small></span>
      <span class="a-dim">${j.host}</span><span class="a-muted">${j.target}</span><span class="a-muted">${j.schedule}</span>${last}
      <span><span class="a-sw"></span></span><span class="menu"><span class="a-menu-btn${mine && menuOpen ? ' open' : ''}"${mine ? ' data-c="menu"' : ''}>${ic('ellipsis', 16, 2)}</span>${menu}</span></div>`;
  }).join('');

  const body = `<section class="a-pg">
    <div class="a-ph"><h1>${B.title}</h1><span class="a-sub">${B.sub(3, runs)}</span><span class="a-sp"></span><span class="a-btn">${ic('play', 13)} ${B.runAll}</span><span class="a-btn primary">${ic('plus', 14, 2)} ${B.newJob}</span></div>
    ${tabsBar([[B.tabs.jobs, B.tabCounts.jobs, true], [B.tabs.runs, runs, false], [B.tabs.targets, B.tabCounts.targets, false]])}
    ${statBar([
      { label: B.stats.jobs, value: B.stats.jobsValue, note: B.stats.jobsNote },
      { label: B.stats.runs, value: runs, note: B.stats.runsNote },
      { label: B.stats.next, value: B.stats.nextValue, note: B.stats.nextNote },
      { label: B.stats.targets, value: B.stats.targetsValue },
    ])}
    <div class="a-tbl"><div class="a-tr th" style="grid-template-columns:14px minmax(160px,1.2fr) minmax(160px,1.3fr) 110px minmax(110px,.9fr) minmax(130px,1fr) minmax(170px,1.2fr) 50px 40px"><span></span>${B.columns.map((c) => `<span>${c}</span>`).join('')}<span></span></div>${jobRows}</div></section>`;

  const dialog = dialogOpen
    ? opDialog({ title: `${B.kind} · ${B.target}`, running: !finished, by: '', when: B.started, elapsed: secs(total), steps, log, openLabel: B.openRun })
    : '';

  let cursor: Frame['cursor'];
  if (t >= 400 && t < B_RUN + 300) cursor = t < 2200 ? { sel: '[data-c="menu"]', click: t >= B_MENU && t < B_MENU + 450 } : { sel: '[data-c="runnow"]', click: t >= B_RUN && t < B_RUN + 450 };
  else if (t >= 3500 && t < B_OPEN + 450) cursor = { sel: '[data-c="opp"]', click: t >= B_OPEN };
  else if (t >= 11000 && t < B_CLOSE + 450) cursor = { sel: '[data-c="close"]', click: t >= B_CLOSE };
  return { html: page(B.crumbs, started && !finished ? 1 : 0, body, dialog), nav: 'backups', cursor };
}

/* --------------------------------------------------------------- Publish */

const P = D.publish, W = P.wizard;
const P_NEW = 1300, P_TYPE = 1700, P_TYPE_STEP = 90;
const P_NEXT1 = 3700, P_KIND = 5100, P_ADDR = 5500, P_NEXT2 = 7500, P_CREATE = 9200, P_CERT_DONE = 14200, P_CLOSE = 16200, P_END = 18600;
const P_GAP = 300;

function publishFrame(t: number): Frame {
  const host = P.created.host, addr = P.created.upstream;
  const typed = Math.min(host.length, Math.max(0, Math.floor((t - P_TYPE) / P_TYPE_STEP)));
  const addrTyped = Math.min(addr.length, Math.max(0, Math.floor((t - P_ADDR) / 70)));
  const created = t >= P_CREATE;
  const opStart = P_CREATE + P_GAP;
  const dialogOpen = t >= opStart && t < P_CLOSE;
  const issued = t >= P_CERT_DONE;
  const wizardOpen = t >= P_NEW + 300 && !created;
  const step = t < P_NEXT1 ? 0 : t < P_NEXT2 ? 1 : 2;
  const kindAddr = t >= P_KIND;

  const sites = [...P.sites.map((s) => ({ ...s, op: null as Op | null })), ...(created ? [{ host, upstream: addr, tls: P.created.tls, note: issued ? P.issued.note : '', op: (issued ? null : { status: 'running', label: P.steps[2], pct: 2 / 3 }) as Op | null }] : [])]
    .sort((a, b) => a.host.localeCompare(b.host));
  const running = created && t >= opStart && !issued ? 1 : 0;
  const siteCount = sites.length;
  const certCount = P.tabCounts.certificates + (created ? 1 : 0);

  const cols = '22px 14px minmax(200px,1.4fr) minmax(170px,1.2fr) 160px minmax(150px,1fr) 80px 56px 36px';
  const rows = sites.map((s) => `<div class="a-tr click" style="grid-template-columns:${cols}"><span>${checkbox()}</span><span><span class="a-dot ok"></span></span>
    <span class="a-nm"><span class="t">${s.host}</span><small>&nbsp;</small></span><span class="a-mono" style="font-size:12.5px">${s.upstream}</span>
    <span class="a-nm">${s.op ? opProgress(s.op) : `<span style="font-weight:500">${s.tls}</span><small>${s.note}</small>`}</span>
    <span class="a-dim">${P.defaults}</span><span class="a-num" style="text-align:right">—</span><span><span class="a-sw"></span></span><span class="menu"><span class="a-menu-btn">${ic('ellipsis', 16, 2)}</span></span></div>`).join('');

  const body = `<section class="a-pg">
    <div class="a-ph"><h1>${P.title}</h1><span class="a-sub">${P.caddy} · <span class="a-ok">${P.running}</span> · ${P.sitesLive(siteCount)}</span><span class="a-sp"></span>${live((2 + Math.floor(t / 1000)) % 15)}<span class="a-btn">${P.importCaddyfile}</span><span class="a-btn primary" data-c="new">${ic('plus', 14, 2)} ${P.newSite}</span><span class="a-menu-btn">${ic('ellipsis', 16, 2)}</span></div>
    ${tabsBar([[P.tabs.sites, siteCount, true], [P.tabs.certificates, certCount, false], [P.tabs.activity, null, false], [P.tabs.caddy, null, false]])}
    <div class="a-toolbar"><span class="a-filter">${P.filter}</span></div>
    <div class="a-tbl"><div class="a-tr th" style="grid-template-columns:${cols}"><span>${checkbox()}</span><span></span>${P.columns.slice(0, 4).map((c) => `<span>${c}</span>`).join('')}<span style="text-align:right">${P.columns[4]}</span><span>${P.columns[5]}</span><span></span></div>${rows}</div>
    <p class="a-sub" style="margin:8px 0 0">${P.footer}</p></section>`;

  const opt = (label: string, hint: string, on: boolean, kind: 'radio') => `<div class="a-opt${on ? ' on' : ''}"><input type="${kind}" tabindex="-1" aria-hidden="true"${on ? ' checked' : ''}><span><b>${esc(label)}</b> <span class="a-dim">${esc(hint)}</span></span></div>`;
  let wbody = '';
  if (step === 0) {
    const val = host.slice(0, typed);
    wbody = `<div class="a-field"><label>${W.steps[0]}</label><div class="a-input a-mono focus${typed ? '' : ' ph'}">${typed ? esc(val) : esc(W.namePlaceholder)}${typed < host.length && t >= P_NEW + 300 ? '<span class="a-caret"></span>' : ''}</div><span class="a-hint">${W.nameHint}</span></div>`;
  } else if (step === 1) {
    wbody = `<div class="a-opts"><span class="a-lbl">${W.whereBefore} <b class="a-mono">${host}</b> ${W.whereAfter}</span>${opt(W.kinds[0].label, W.kinds[0].hint, !kindAddr, 'radio')}${opt(W.kinds[1].label, W.kinds[1].hint, kindAddr, 'radio')}</div>
      ${kindAddr
        ? `<div class="a-field"><label>${W.goesTo}</label><div class="a-input a-mono${addrTyped ? '' : ' ph'}">${addrTyped ? esc(addr.slice(0, addrTyped)) : esc(W.goesToPlaceholder)}${addrTyped < addr.length && t >= P_ADDR ? '<span class="a-caret"></span>' : ''}</div><span class="a-hint">${W.goesToHint}</span></div>`
        : `<div class="grid"><div class="a-field"><label>${W.container}</label><div class="a-input sel">${W.pickContainer}${ic('chevron-down', 14)}</div></div><div class="a-field"><label>${W.port}</label><div class="a-input sel"><span></span>${ic('chevron-down', 14)}</div></div></div>`}`;
  } else {
    wbody = `<div class="a-opts"><span class="a-lbl">${W.certificate}</span>${W.certs.map((c, i) => opt(c.label, c.hint, i === 0, 'radio')).join('')}</div>
      <p class="a-result"><b class="a-mono">${host}</b> → <span class="a-mono">${addr}</span> ${W.result(P.created.tls)}</p>`;
  }
  const footer = step === 0
    ? `<span class="a-btn">${W.cancel}</span><span class="a-btn primary" data-c="next">${W.next}</span>`
    : step === 1
      ? `<span class="a-btn">${W.back}</span><span class="a-btn primary" data-c="next">${W.next}</span>`
      : `<span class="a-btn">${W.back}</span><span class="a-btn">${W.advanced}</span><span class="a-btn primary" data-c="create">${W.create}</span>`;
  const stepper = `<ol class="a-stepper">${W.steps.map((s, i) => `<li class="${i < step ? 'done' : i === step ? 'on' : ''}"><span class="n">${i + 1}</span><span>${s}</span></li>`).join('')}</ol>`;
  const wizard = wizardOpen ? `<div class="a-overlay"><div class="a-dlg">${modalHead(W.title)}<div class="a-dlg-b">${stepper}<div class="a-ns">${wbody}</div></div><div class="a-dlg-f">${footer}</div></div></div>` : '';

  const q = t - opStart;
  const steps: Step[] = [
    { label: P.steps[0], status: q >= 200 ? 'succeeded' : 'running', meta: '0 s' },
    { label: P.steps[1], status: q >= 700 ? 'succeeded' : q >= 200 ? 'running' : 'pending', meta: q >= 200 ? '0 s' : '' },
    issued
      ? { label: P.steps[2], status: 'succeeded', meta: `${Math.floor((P_CERT_DONE - opStart - 700) / 1000)} s`, detail: P.issued.detail }
      : { label: P.steps[2], status: q >= 700 ? 'running' : 'pending', meta: q >= 700 ? `${Math.floor((q - 700) / 1000)} s` : '' },
  ];
  const log = P.log.filter((_, i) => q >= 800 + i * 300).map((x) => ({ t: clock(0, [1, 2, 51]), x }));
  if (issued) log.push({ t: clock(Math.floor((P_CERT_DONE - opStart) / 1000), [1, 2, 51]), x: P.issued.log });
  const dialog = dialogOpen ? opDialog({ title: `${P.kind} · ${host}`, running: !issued, by: D.ops.by(P.actor), when: P.started, elapsed: `${Math.floor(Math.max(0, Math.min(q, P_CERT_DONE - opStart)) / 1000)} s`, steps, log, openLabel: P.openProxy }) : '';

  let cursor: Frame['cursor'];
  if (t >= 400 && t < P_NEW + 400) cursor = { sel: '[data-c="new"]', click: t >= P_NEW };
  else if (t >= 3000 && t < P_NEXT1 + 450) cursor = { sel: '[data-c="next"]', click: t >= P_NEXT1 };
  else if (t >= 4300 && t < P_KIND + 450) cursor = { sel: '.a-opt:nth-child(3)', click: t >= P_KIND };
  else if (t >= 6900 && t < P_NEXT2 + 450) cursor = { sel: '[data-c="next"]', click: t >= P_NEXT2 };
  else if (t >= 8300 && t < P_CREATE + 450) cursor = { sel: '[data-c="create"]', click: t >= P_CREATE };
  else if (t >= 15200 && t < P_CLOSE + 450) cursor = { sel: '[data-c="close"]', click: t >= P_CLOSE };
  return { html: page(P.crumbs, running, body, wizard + dialog), nav: 'proxy', cursor };
}

export const SCENES: Scene[] = [
  { label: U.label, path: U.path, dur: U_HOLD_END, frame: updateFrame, summary: 'Updates page: three container images are selected and updated one after another; each row shows its running step and ends as done.' },
  { label: B.label, path: B.path, dur: B_END, frame: backupFrame, summary: 'Backups page: the Nextcloud nightly job is started from its menu and its progress dialog shows each step and the log until the archive is verified.' },
  { label: P.label, path: P.path, dur: P_END, frame: publishFrame, summary: 'Reverse proxy page: a new site tools.home.lab is created in three steps and the progress dialog shows the site saved, the Caddy configuration applied and the certificate issued, and the new row ends with its certificate.' },
];

import { SCENES } from './demo-view';

const CANVAS_W = 1440;
const TICK_MS = 100;

export function initDemo(host: string) {
  const wrap = document.getElementById('demowrap');
  const panel = document.getElementById('demo-panel');
  const vp = document.getElementById('demovp');
  const canvas = document.getElementById('appc');
  const stage = document.getElementById('dstage');
  const cursor = document.getElementById('cursor');
  if (!wrap || !panel || !vp || !canvas || !stage || !cursor) return;

  const tabs = [...wrap.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const stills = [...panel.querySelectorAll<HTMLElement>('[data-still]')];
  const navItems = [...canvas.querySelectorAll<HTMLElement>('[data-nav]')];
  const pauseBtn = wrap.querySelector<HTMLButtonElement>('[data-demopause]')!;
  const urlEl = document.getElementById('demourl')!;
  const desc = document.getElementById('demo-desc')!;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const st = { i: 0, el: 0, last: 0, html: '', sel: '', click: false, scale: 1, user: false, hover: false, offscreen: false, docHidden: false };

  function fit() {
    st.scale = vp!.clientWidth / CANVAS_W;
    canvas!.style.setProperty('--s', String(st.scale));
  }

  function place(sel: string) {
    const el = stage!.querySelector(sel);
    if (!el) return;
    const a = canvas!.getBoundingClientRect(), b = el.getBoundingClientRect();
    const x = (b.left - a.left) / st.scale + Math.min(b.width / 2, 40);
    const y = (b.top - a.top) / st.scale + b.height / 2;
    cursor!.style.transform = `translate(${x}px,${y}px)`;
  }

  function render() {
    const sc = SCENES[st.i];
    const f = sc.frame(Math.floor(st.el / TICK_MS) * TICK_MS);
    const changed = f.html !== st.html;
    if (changed) {
      stage!.innerHTML = f.html;
      st.html = f.html;
      const phase = `-${performance.now() % 14000}ms`;
      stage!.querySelectorAll<HTMLElement>('.a-spin, .a-bar.indet i').forEach((n) => { n.style.animationDelay = phase; });
    }
    navItems.forEach((n) => n.classList.toggle('on', n.dataset.nav === f.nav));
    const c = f.cursor;
    if (!c) {
      cursor!.classList.remove('show');
      st.sel = '';
      st.click = false;
      return;
    }
    if (!st.sel) {
      cursor!.style.transition = 'none';
      place(c.sel);
      void cursor!.getBoundingClientRect();
      cursor!.style.transition = '';
    } else if (changed || c.sel !== st.sel) {
      place(c.sel);
    }
    cursor!.classList.add('show');
    st.sel = c.sel;
    if (c.click && !st.click) {
      cursor!.classList.remove('click');
      void cursor!.getBoundingClientRect();
      cursor!.classList.add('click');
    }
    st.click = !!c.click;
  }

  function show(i: number, focus = false) {
    const sc = SCENES[i];
    st.i = i; st.el = 0; st.html = ''; st.sel = ''; st.click = false;
    tabs.forEach((t, k) => {
      t.setAttribute('aria-selected', String(k === i));
      t.tabIndex = k === i ? 0 : -1;
      t.querySelector('i')!.style.width = reduce.matches && k === i ? '100%' : '0%';
    });
    stills.forEach((s) => { s.hidden = Number(s.dataset.still) !== i; });
    if (focus) tabs[i].focus();
    panel!.setAttribute('aria-labelledby', tabs[i].id);
    desc.textContent = sc.summary;
    urlEl.textContent = host + sc.path;
    cursor!.classList.remove('show');
    if (!reduce.matches) render();
  }

  const paused = () => st.user || st.hover || st.offscreen || st.docHidden || reduce.matches;
  function tick(t: number) {
    const dt = st.last ? Math.min(t - st.last, 100) : 0;
    st.last = t;
    const run = !paused();
    canvas!.classList.toggle('paused', !run);
    if (run) {
      st.el += dt;
      const sc = SCENES[st.i];
      if (st.el >= sc.dur) show((st.i + 1) % SCENES.length);
      else {
        render();
        tabs[st.i].querySelector('i')!.style.width = `${(st.el / sc.dur) * 100}%`;
      }
    }
    requestAnimationFrame(tick);
  }

  function setUserPause(p: boolean) {
    st.user = p;
    pauseBtn.setAttribute('aria-pressed', String(p));
    pauseBtn.setAttribute('aria-label', p ? 'Play the demo' : 'Pause the demo');
  }

  tabs.forEach((t, k) => {
    t.addEventListener('click', () => show(k));
    t.addEventListener('keydown', (e) => {
      const n = e.key === 'ArrowRight' ? k + 1 : e.key === 'ArrowLeft' ? k - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? SCENES.length - 1 : null;
      if (n === null) return;
      e.preventDefault();
      show((n + SCENES.length) % SCENES.length, true);
    });
  });
  pauseBtn.addEventListener('click', () => setUserPause(!st.user));
  wrap.addEventListener('mouseenter', () => { st.hover = true; });
  wrap.addEventListener('mouseleave', () => { st.hover = false; });
  new IntersectionObserver(([e]) => { st.offscreen = !e.isIntersecting; }).observe(wrap);
  document.addEventListener('visibilitychange', () => { st.docHidden = document.hidden; });
  reduce.addEventListener('change', () => show(st.i));
  new ResizeObserver(fit).observe(vp);

  fit();
  show(0);
  canvas.classList.add('ready');
  requestAnimationFrame(tick);
}

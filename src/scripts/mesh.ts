import markRaw from '../assets/dockmesh-mark.svg?raw';

interface Opts { nodes?: [number, number][]; count?: number; center?: [number, number]; alpha?: number; seed?: number; every?: number; hub?: number; hubBg?: string }

const hubs: Record<string, HTMLImageElement> = {};
function hub(theme: string) {
  if (!hubs[theme]) {
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markRaw.replace(/currentColor/g, theme === 'light' ? '#0e7490' : '#22d3ee'));
    hubs[theme] = img;
  }
  return hubs[theme];
}

/** Remote hosts as dots with dashed lines to the server; pulses travel host → server. */
export function mesh(canvas: HTMLCanvasElement | null, opts: Opts = {}) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.min(2, devicePixelRatio || 1);
  let s = opts.seed ?? 7;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const center = opts.center ?? [0.5, 0.5];
  const nodes = (opts.nodes ?? Array.from({ length: opts.count ?? 16 }, () => [rnd(), rnd()] as [number, number])).map(([x, y]) => ({ x, y }));
  const pulses: { n: { x: number; y: number }; t: number }[] = [];
  const alpha = opts.alpha ?? 1;
  let last = 0, visible = true, raf = 0;

  const size = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width * dpr; canvas.height = r.height * dpr; };
  size();

  function frame(ts: number) {
    const css = getComputedStyle(document.documentElement);
    const acc = css.getPropertyValue('--accent').trim(), line = css.getPropertyValue('--border2').trim(), dot = css.getPropertyValue('--subtle').trim();
    const w = canvas!.width, h = canvas!.height, cx = center[0] * w, cy = center[1] * h;
    ctx!.clearRect(0, 0, w, h);
    ctx!.globalAlpha = alpha;
    for (const n of nodes) {
      const x = n.x * w, y = n.y * h;
      ctx!.strokeStyle = line; ctx!.lineWidth = dpr; ctx!.setLineDash([3 * dpr, 4 * dpr]);
      ctx!.beginPath(); ctx!.moveTo(x, y); ctx!.lineTo(cx, cy); ctx!.stroke(); ctx!.setLineDash([]);
      ctx!.fillStyle = dot; ctx!.fillRect(x - 3 * dpr, y - 3 * dpr, 6 * dpr, 6 * dpr);
    }
    const img = hub(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
    const hw = (opts.hub ?? 46) * dpr, hh = (hw * 275) / 675;
    if (img.complete && img.naturalWidth) {
      ctx!.globalAlpha = 1;
      ctx!.fillStyle = css.getPropertyValue(opts.hubBg ?? '--surface').trim();
      ctx!.fillRect(cx - hw / 2 - 6 * dpr, cy - hh / 2 - 6 * dpr, hw + 12 * dpr, hh + 12 * dpr);
      ctx!.drawImage(img, cx - hw / 2, cy - hh / 2, hw, hh);
      ctx!.globalAlpha = alpha;
    } else img.onload = () => !reduce || frame(0);
    if (!reduce) {
      if (ts - last > (opts.every ?? 420)) { last = ts; pulses.push({ n: nodes[Math.floor(Math.random() * nodes.length)], t: 0 }); }
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i]; p.t += 0.012;
        if (p.t >= 1) { pulses.splice(i, 1); continue; }
        const x = p.n.x * w + (cx - p.n.x * w) * p.t, y = p.n.y * h + (cy - p.n.y * h) * p.t;
        ctx!.fillStyle = acc; ctx!.globalAlpha = alpha * Math.sin(p.t * Math.PI);
        ctx!.beginPath(); ctx!.arc(x, y, 2.6 * dpr, 0, 7); ctx!.fill(); ctx!.globalAlpha = alpha;
      }
      if (visible) raf = requestAnimationFrame(frame);
    }
  }

  if (getComputedStyle(canvas).display === 'none') return;
  addEventListener('resize', () => { size(); if (reduce) frame(0); }, { passive: true });
  document.addEventListener('dm-theme', () => { if (reduce) frame(0); });
  new IntersectionObserver(([e]) => {
    const was = visible; visible = e.isIntersecting;
    if (visible && !was && !reduce) raf = requestAnimationFrame(frame);
    if (!visible) cancelAnimationFrame(raf);
  }).observe(canvas);
  raf = requestAnimationFrame(frame);
}

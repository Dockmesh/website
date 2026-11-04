function setThemeLabel() {
  const dark = document.documentElement.dataset.theme !== 'light';
  document.querySelectorAll('[data-dm-theme]').forEach((b) => b.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme'));
}
setThemeLabel();

async function copy(text: string, btn: HTMLElement) {
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = 'Copied';
  } catch {
    btn.textContent = 'Press Ctrl+C';
  }
  setTimeout(() => (btn.textContent = 'Copy'), 1600);
}

document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  const theme = t.closest('[data-dm-theme]');
  if (theme) {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('starlight-theme', next); } catch { /* storage blocked */ }
    setThemeLabel();
    document.dispatchEvent(new CustomEvent('dm-theme', { detail: next }));
    return;
  }
  const menu = t.closest('[data-dm-menu]');
  if (menu) {
    const nav = document.getElementById('dm-mobnav');
    const open = !nav?.classList.contains('open');
    nav?.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    return;
  }
  const zoom = t.closest<HTMLElement>('[data-zoom]');
  if (zoom) {
    openLightbox(zoom);
    return;
  }
  const btn = t.closest<HTMLElement>('[data-copy]');
  if (btn) {
    const code = btn.closest('.dm-code')?.querySelector('pre code, pre');
    const text = btn.dataset.copy || code?.textContent || '';
    void copy(text.replace(/\n$/, ''), btn);
  }
});

let lightbox: HTMLDialogElement | undefined;
function openLightbox(trigger: HTMLElement) {
  const imgs = Array.from(trigger.closest('.frame')?.querySelectorAll<HTMLImageElement>('img') ?? []);
  const img = imgs.find((i) => i.offsetParent !== null) ?? imgs[0];
  if (!img) return;
  const largest = img.srcset.split(',').map((c) => c.trim().split(/\s+/)).sort((a, b) => parseInt(b[1] ?? '0') - parseInt(a[1] ?? '0'))[0]?.[0];
  if (!lightbox) {
    lightbox = document.createElement('dialog');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('aria-label', 'Screenshot');
    lightbox.innerHTML = '<button type="button" class="lb-close" aria-label="Close">×</button><img class="lb-img" alt="">';
    lightbox.addEventListener('click', () => lightbox?.close());
    lightbox.addEventListener('close', () => (lightbox as HTMLDialogElement & { opener?: HTMLElement }).opener?.focus());
    document.body.append(lightbox);
  }
  const big = lightbox.querySelector<HTMLImageElement>('.lb-img')!;
  big.src = largest || img.currentSrc || img.src;
  big.alt = img.alt;
  (lightbox as HTMLDialogElement & { opener?: HTMLElement }).opener = trigger;
  lightbox.showModal();
}

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const nav = document.getElementById('dm-mobnav');
  if (nav?.classList.contains('open')) {
    nav.classList.remove('open');
    const b = document.querySelector<HTMLElement>('[data-dm-menu]');
    b?.setAttribute('aria-expanded', 'false');
    b?.focus();
  }
});

import { readFile } from 'node:fs/promises';

// The changelog lives in the app repo; the site reads it at build time.
// DOCKMESH_CHANGELOG may point at a local file instead (offline builds).
const SOURCE = 'https://raw.githubusercontent.com/Dockmesh/dockmesh/main/CHANGELOG.md';

export type Severity = 'security' | 'recommended' | 'normal';
export interface Release {
  version: string;
  date: string;
  severity: Severity;
  summary: string;
  minUpgrade?: string;
  sections: { title: string; items: string[] }[];
}

async function load(): Promise<string> {
  const local = process.env.DOCKMESH_CHANGELOG;
  if (local) {
    try {
      return await readFile(local, 'utf8');
    } catch (err) {
      throw new Error(`Changelog: cannot read DOCKMESH_CHANGELOG=${local}: ${(err as Error).message}`);
    }
  }
  let res: Response;
  try {
    res = await fetch(SOURCE, { signal: AbortSignal.timeout(20_000) });
  } catch (err) {
    throw new Error(`Changelog: cannot fetch ${SOURCE} (${(err as Error).message}). Set DOCKMESH_CHANGELOG to a local CHANGELOG.md to build offline.`);
  }
  if (!res.ok) throw new Error(`Changelog: ${SOURCE} answered HTTP ${res.status}. The build needs the app's CHANGELOG.md.`);
  return res.text();
}

export function parseChangelog(src: string): Release[] {
  const text = src.replace(/\r\n/g, '\n');
  const out: Release[] = [];
  const re = /^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})(?: \[(security|recommended|normal)\])?\n([\s\S]*?)(?=^## \[|(?![\s\S]))/gm;
  for (const m of text.matchAll(re)) {
    const [, version, date, sev, body] = m;
    const [head, ...parts] = body.split(/^### /m);
    let minUpgrade: string | undefined;
    const summary = head
      .replace(/^Minimum upgrade from:\s*(\S+)\s*$/m, (_, v) => { minUpgrade = v; return ''; })
      .replace(/\s+/g, ' ')
      .trim();
    const sections = parts.map((p) => {
      const [title, ...lines] = p.split('\n');
      const items: string[] = [];
      for (const line of lines) {
        if (line.startsWith('- ')) items.push(line.slice(2).trim());
        else if (/^\s{2,}\S/.test(line) && items.length) items[items.length - 1] += ' ' + line.trim();
      }
      return { title: title.trim(), items };
    }).filter((s) => s.items.length);
    out.push({ version, date, severity: (sev as Severity) || 'normal', summary: summary || 'Maintenance release.', minUpgrade, sections });
  }
  return out;
}

let cached: Promise<Release[]> | undefined;
export function getReleases(): Promise<Release[]> {
  cached ??= load().then((src) => {
    const rels = parseChangelog(src);
    if (!rels.length) throw new Error(`Changelog: no release sections found in ${process.env.DOCKMESH_CHANGELOG || SOURCE}; has the format changed?`);
    return rels;
  });
  return cached;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Inline markdown of a changelog bullet: code, bold, links. */
export function inlineMd(s: string): string {
  const codes: string[] = [];
  let h = s.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  h = esc(h)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\b(GHSA(?:-[23456789cfghjmpqrvwx]{4}){3})\b/g, '<a href="https://github.com/Dockmesh/dockmesh/security/advisories/$1">$1</a>');
  return h.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[+i])}</code>`);
}

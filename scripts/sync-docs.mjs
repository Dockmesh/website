#!/usr/bin/env node
// Copies the user docs (docs/site) from the app repo into the Starlight
// content folder, rewrites the relative .md links to site URLs and stamps each
// page with lastUpdated, the date of the last app-repo commit that touched it.
//
//   node scripts/sync-docs.mjs ../app          # a local checkout
//   node scripts/sync-docs.mjs main            # a branch, tag or commit of Dockmesh/dockmesh
//   node scripts/sync-docs.mjs v0.5.0 --repo https://github.com/Dockmesh/dockmesh.git

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, relative, posix, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src/content/docs/docs');
const NAV_OUT = join(ROOT, 'src/data/docs-nav.json');
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif']);

function die(msg) {
  console.error(`sync-docs: ${msg}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const repoFlag = args.indexOf('--repo');
const repo = repoFlag >= 0 ? args.splice(repoFlag, 2)[1] : 'https://github.com/Dockmesh/dockmesh.git';
const source = args[0];
if (!source) die('usage: sync-docs <path-to-app-checkout | git-ref> [--repo <url>]');

let appDir;
let label;
let tmp;
if (existsSync(source) && statSync(source).isDirectory()) {
  appDir = resolve(source);
  label = relative(ROOT, appDir) || appDir;
} else {
  tmp = mkdtempSync(join(tmpdir(), 'dm-docs-'));
  const git = (...a) => execFileSync('git', a, { cwd: tmp, stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim();
  try {
    git('init', '-q');
    // full history (trees only): the last-updated dates come from it
    git('fetch', '-q', '--filter=blob:none', repo, source);
    git('checkout', '-q', 'FETCH_HEAD');
  } catch {
    die(`could not fetch "${source}" from ${repo}`);
  }
  appDir = tmp;
  label = `${source} (${git('rev-parse', '--short', 'HEAD')})`;
}

const siteDir = join(appDir, 'docs/site');
const navFile = join(siteDir, 'nav.json');
if (!existsSync(navFile)) die(`${navFile} not found — is this the app repo?`);
const nav = JSON.parse(readFileSync(navFile, 'utf8'));
const pages = nav.sections.flatMap((s) => s.items.map((it) => it.path));

// Date of the last commit in the app repo that touched the page, as UTC.
function lastChanged(p) {
  const out = execFileSync('git', ['-C', appDir, 'log', '-1', '--format=%cI', '--', posix.join('docs/site', p)], { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
  if (!out) die(`no git history for docs/site/${p} in ${appDir}; use a full checkout`);
  return new Date(out).toISOString().replace(/\.\d+Z$/, 'Z');
}

const slugOf = (p) => p.replace(/\.md$/, '');
const urlOf = (p) => `/docs/${slugOf(p)}/`;

function rewriteLinks(md, file) {
  const base = posix.dirname(file);
  return md.replace(/(!?)\[([^\]]*)\]\(([^)\s]+)(\s+"[^"]*")?\)/g, (all, bang, text, href, title = '') => {
    if (/^([a-z]+:|#|\/)/i.test(href)) return all;
    const [path, hash] = href.split('#');
    const target = posix.normalize(posix.join(base, path));
    if (bang) return `${bang}[${text}](${href}${title})`;
    if (!path.endsWith('.md')) return all;
    if (!pages.includes(target)) console.warn(`sync-docs: ${file} links to ${href}, which is not in nav.json`);
    return `[${text}](${urlOf(target)}${hash ? '#' + hash : ''}${title})`;
  });
}

function withLastUpdated(md, date) {
  const fm = md.match(/^---\n([\s\S]*?)\n---\n/);
  const body = fm[1].replace(/^lastUpdated:.*\n?/m, '').replace(/\n$/, '');
  return `---\n${body}\nlastUpdated: ${date}\n---\n` + md.slice(fm[0].length);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

let copied = 0;
for (const p of pages) {
  const src = join(siteDir, p);
  if (!existsSync(src)) die(`nav.json lists ${p}, but the file does not exist`);
  let md = readFileSync(src, 'utf8').replace(/\r\n/g, '\n');
  if (!/^---\n(?:[\s\S]*?\n)?title:/.test(md)) die(`${p} has no title in its frontmatter`);
  md = rewriteLinks(md, p);
  md = withLastUpdated(md, lastChanged(p));
  const dest = join(OUT, p);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, md);
  copied++;
}

let images = 0;
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (IMAGE_EXT.has(extname(name).toLowerCase())) {
      const dest = join(OUT, relative(siteDir, full));
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(full, dest);
      images++;
    }
  }
})(siteDir);

mkdirSync(dirname(NAV_OUT), { recursive: true });
writeFileSync(NAV_OUT, JSON.stringify(nav, null, 2) + '\n');
if (tmp) rmSync(tmp, { recursive: true, force: true });
console.log(`sync-docs: ${copied} pages and ${images} images from ${label}`);

#!/usr/bin/env node
// Steps of .github/workflows/release-sync.yml that are worth testing without a release:
//
//   node scripts/release-sync.mjs plan <tag> [--prerelease]   prints mode=skip|changelog|full and version=X.Y.Z
//   node scripts/release-sync.mjs changelog <tag> [--from <CHANGELOG.md>]
//                                                             merges the tag's CHANGELOG.md into src/data/changelog.md
//   node scripts/release-sync.mjs check <X.Y.Z>               checks dist/ has the pages the release needs

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkBuild, mergeChangelog, parseTag, plan } from './lib/release.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHANGELOG = join(ROOT, 'src/data/changelog.md');
const RELEASE = join(ROOT, 'src/data/release.json');
const DIST = join(ROOT, 'dist');

function die(msg) {
  console.error(`release-sync: ${msg}`);
  process.exit(1);
}

const [cmd, arg, ...rest] = process.argv.slice(2);
const flag = (name) => {
  const i = rest.indexOf(name);
  return i < 0 ? undefined : rest[i + 1];
};

try {
  if (cmd === 'plan') {
    const current = existsSync(RELEASE) ? JSON.parse(readFileSync(RELEASE, 'utf8')).version : undefined;
    const p = plan(arg, { prerelease: rest.includes('--prerelease'), current });
    console.log(`mode=${p.mode}\nversion=${p.version}`);
  } else if (cmd === 'changelog') {
    const t = parseTag(arg);
    if (!t || t.prerelease) die(`tag "${arg}" is not vX.Y.Z`);
    const { version } = t;
    let src;
    const from = flag('--from');
    if (from) {
      src = readFileSync(from, 'utf8');
    } else {
      const url = `https://raw.githubusercontent.com/Dockmesh/dockmesh/${encodeURIComponent(arg)}/CHANGELOG.md`;
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) die(`${url} answered HTTP ${res.status}`);
      src = await res.text();
    }
    const previous = existsSync(CHANGELOG) ? readFileSync(CHANGELOG, 'utf8') : '';
    writeFileSync(CHANGELOG, mergeChangelog(src, version, previous));
    console.log(`src/data/changelog.md synced from ${from ?? arg}`);
  } else if (cmd === 'check') {
    if (!/^\d+\.\d+\.\d+$/.test(arg ?? '')) die('usage: check <X.Y.Z>');
    const nav = JSON.parse(readFileSync(join(ROOT, 'src/data/docs-nav.json'), 'utf8'));
    const docPages = nav.sections.flatMap((s) => s.items.map((it) => `docs/${it.path.replace(/\.md$/, '')}/index.html`));
    const problems = checkBuild(arg, {
      has: (p) => existsSync(join(DIST, p)),
      read: (p) => readFileSync(join(DIST, p), 'utf8'),
      docPages,
    });
    if (problems.length) die(`the build is missing what ${arg} needs:\n  ${problems.join('\n  ')}`);
    console.log(`dist/ has the changelog page of ${arg} and ${docPages.length} docs pages`);
  } else {
    die('usage: release-sync.mjs plan|changelog|check …');
  }
} catch (err) {
  die(err.message);
}

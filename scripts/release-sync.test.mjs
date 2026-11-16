import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkBuild, mergeChangelog, plan } from './lib/release.mjs';

const fixture = (name) => readFileSync(new URL(`fixtures/${name}`, import.meta.url), 'utf8');
const versions = (md) => [...md.matchAll(/^## \[(\d+\.\d+\.\d+)\]/gm)].map((m) => m[1]);

test('plan', () => {
  const cases = [
    { name: 'release from main', tag: 'v0.6.0', current: '0.5.4', want: 'full' },
    { name: 'patch of the current minor', tag: 'v0.5.4', current: '0.5.3', want: 'full' },
    { name: 're-run of the current release', tag: 'v0.5.4', current: '0.5.4', want: 'full' },
    { name: 'patch of an older minor', tag: 'v0.5.5', current: '0.6.0', want: 'changelog' },
    { name: 'first sync', tag: 'v0.5.4', current: undefined, want: 'full' },
    { name: 'pre-release tag', tag: 'v0.6.0-rc.1', current: '0.5.4', want: 'skip' },
    { name: 'release marked pre-release', tag: 'v0.6.0', prerelease: true, current: '0.5.4', want: 'skip' },
  ];
  for (const c of cases) {
    assert.equal(plan(c.tag, { prerelease: c.prerelease, current: c.current }).mode, c.want, c.name);
  }
  for (const bad of ['', '0.5.4', 'v0.5', 'main', 'v0.5.4 ']) {
    assert.throws(() => plan(bad), /is not vX\.Y\.Z/, JSON.stringify(bad));
  }
});

test('mergeChangelog', () => {
  const cases = [
    {
      name: 'release from main',
      tag: 'tag-v0.6.0.md', version: '0.6.0', previous: 'site-0.5.3.md',
      want: ['0.6.0', '0.5.4', '0.5.3'],
    },
    {
      // main had no 0.5.4 yet; the tag has it
      name: 'patch from release/0.5.x before the forward-port',
      tag: 'tag-v0.5.4.md', version: '0.5.4', previous: 'site-0.5.3.md',
      want: ['0.5.4', '0.5.3'],
    },
    {
      name: 'patch of an older minor keeps the newer release first',
      tag: 'tag-v0.5.5.md', version: '0.5.5', previous: 'tag-v0.6.0.md',
      want: ['0.6.0', '0.5.5', '0.5.4', '0.5.3'],
    },
    {
      name: 'first sync',
      tag: 'tag-v0.5.4.md', version: '0.5.4', previous: undefined,
      want: ['0.5.4', '0.5.3'],
    },
  ];
  for (const c of cases) {
    const out = mergeChangelog(fixture(c.tag), c.version, c.previous && fixture(c.previous));
    assert.deepEqual(versions(out), c.want, c.name);
    assert.doesNotMatch(out, /\[Unreleased\]/, c.name);
    assert.equal(mergeChangelog(fixture(c.tag), c.version, out), out, `${c.name}: second run changes nothing`);
  }
});

test('mergeChangelog takes a version from the tag over the previous copy', () => {
  const previous = fixture('tag-v0.5.4.md').replace('Fix in 0.5.4.', 'Old wording.');
  const out = mergeChangelog(fixture('tag-v0.6.0.md'), '0.6.0', previous);
  assert.match(out, /Fix in 0\.5\.4\./);
  assert.doesNotMatch(out, /Old wording/);
});

test('mergeChangelog fails without a section for the tag', () => {
  assert.throws(() => mergeChangelog(fixture('tag-v0.6.0.md'), '0.6.1', fixture('site-0.5.3.md')), /no "## \[0\.6\.1\]" section/);
});

test('checkBuild', () => {
  const site = {
    'changelog/index.html': '<a href="/changelog/0.5.4/">0.5.4</a>',
    'changelog/0.5.4/index.html': '<h1>Dockmesh 0.5.4</h1>',
    'docs/getting-started/installation/index.html': '<h1>Installation</h1>',
  };
  const dist = (files) => ({ has: (p) => p in files, read: (p) => files[p] });
  const docPages = ['docs/getting-started/installation/index.html'];
  const cases = [
    { name: 'complete', files: site, version: '0.5.4', want: 0 },
    { name: 'version missing from the changelog', files: site, version: '0.5.5', want: 2 },
  ];
  for (const c of cases) assert.equal(checkBuild(c.version, { ...dist(c.files), docPages }).length, c.want, c.name);
  const { 'docs/getting-started/installation/index.html': _, ...noDocs } = site;
  assert.deepEqual(checkBuild('0.5.4', { ...dist(noDocs), docPages }), ['docs/getting-started/installation/index.html was not built']);
});

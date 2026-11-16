// Pure helpers of the release sync; scripts/release-sync.mjs wires them to files and the network.

const NOTE = '<!-- Synced from the Dockmesh release tags by scripts/release-sync.mjs. Edit CHANGELOG.md in Dockmesh/dockmesh, not this copy. -->';
const HEADER = /^## \[(\d+\.\d+\.\d+)\][^\n]*$/gm;

export const parseTag = (tag) => {
  const m = /^v(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z.-]+)?$/.exec(tag ?? '');
  if (!m) return null;
  return { version: `${m[1]}.${m[2]}.${m[3]}`, prerelease: Boolean(m[4]) };
};

export function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
}

/**
 * What a sync of `tag` does: `skip` for pre-releases, `changelog` for a stable tag older than the
 * version the site already shows (an old minor's patch must not roll the docs back), else `full`.
 */
export function plan(tag, { prerelease = false, current } = {}) {
  const t = parseTag(tag);
  if (!t) throw new Error(`tag "${tag}" is not vX.Y.Z`);
  if (t.prerelease || prerelease) return { mode: 'skip', version: t.version };
  if (current && compareVersions(t.version, current) < 0) return { mode: 'changelog', version: t.version };
  return { mode: 'full', version: t.version };
}

/** Splits a CHANGELOG.md into the text before the first release and one raw section per version. */
export function splitChangelog(src) {
  const text = src.replace(/\r\n/g, '\n');
  const heads = [...text.matchAll(HEADER)];
  const firstAny = text.search(/^## /m);
  const preamble = (firstAny < 0 ? text : text.slice(0, firstAny)).replace(NOTE, '').trim();
  const sections = new Map();
  heads.forEach((h, i) => {
    const end = text.slice(h.index + h[0].length).search(/^## /m);
    const body = end < 0 ? text.slice(h.index) : text.slice(h.index, h.index + h[0].length + end);
    sections.set(h[1], body.trimEnd());
  });
  return { preamble, sections };
}

/**
 * The site's changelog after syncing `version`: every section of the tag's CHANGELOG, plus the
 * sections only the previous synced copy has (a patch released from a release branch before it was
 * forward-ported to main), newest version first.
 */
export function mergeChangelog(tagSrc, version, previousSrc = '') {
  const tagged = splitChangelog(tagSrc);
  if (!tagged.sections.has(version)) throw new Error(`CHANGELOG.md of v${version} has no "## [${version}]" section`);
  const merged = new Map(splitChangelog(previousSrc).sections);
  for (const [v, s] of tagged.sections) merged.set(v, s);
  const versions = [...merged.keys()].sort((a, b) => compareVersions(b, a));
  return `${[NOTE, tagged.preamble, ...versions.map((v) => merged.get(v))].join('\n\n')}\n`;
}

/** Problems with a built site for `version`; `has(path)` and `read(path)` look into dist/. */
export function checkBuild(version, { has, read, docPages = [] }) {
  const problems = [];
  const page = `changelog/${version}/index.html`;
  if (!has(page)) problems.push(`${page} was not built`);
  else if (!read(page).includes(`Dockmesh ${version}`)) problems.push(`${page} does not show "Dockmesh ${version}"`);
  if (!has('changelog/index.html')) problems.push('changelog/index.html was not built');
  else if (!read('changelog/index.html').includes(`/changelog/${version}/`)) problems.push(`changelog/index.html does not link /changelog/${version}/`);
  for (const p of docPages) if (!has(p)) problems.push(`${p} was not built`);
  return problems;
}

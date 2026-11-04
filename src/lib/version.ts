import { getReleases } from './changelog';

// The release the docs are labelled with: the newest one in the app's CHANGELOG,
// unless DOCS_VERSION is set (e.g. DOCS_VERSION=0.5.0 to label docs of an unreleased version).
export async function docsVersion(): Promise<string> {
  const set = process.env.DOCS_VERSION?.trim();
  if (set) return set.startsWith('v') ? set : `v${set}`;
  const [latest] = await getReleases();
  return `v${latest.version}`;
}

import { getReleases } from './changelog';

// Written by the release-sync workflow; a glob, so a checkout without it falls back to the changelog.
const recorded = Object.values(
  import.meta.glob<{ version?: string }>('../data/release.json', { eager: true, import: 'default' }),
)[0];

// The release the docs are labelled with: DOCS_VERSION if set (e.g. DOCS_VERSION=0.5.0 to label docs of an
// unreleased version), else the release the docs were last synced from, else the newest one in the app's CHANGELOG.
export async function docsVersion(): Promise<string> {
  const set = process.env.DOCS_VERSION?.trim();
  if (set) return set.startsWith('v') ? set : `v${set}`;
  if (recorded?.version) return `v${recorded.version}`;
  const [latest] = await getReleases();
  return `v${latest.version}`;
}

// Every screenshot on the site comes from this table. Each entry names a pair
// of files in src/assets/shots/ (<file>-dark.webp and <file>-light.webp); to
// replace a screenshot, overwrite those two files. Change `file` only to point
// an entry at differently named files.
import type { ImageMetadata } from 'astro';

export interface Shot { light: ImageMetadata; dark: ImageMetadata; alt: string; url: string }

const FILES = import.meta.glob<{ default: ImageMetadata }>('../assets/shots/*.webp', { eager: true });

function pick(file: string, theme: 'dark' | 'light'): ImageMetadata {
  const m = FILES[`../assets/shots/${file}-${theme}.webp`];
  if (!m) throw new Error(`Missing screenshot src/assets/shots/${file}-${theme}.webp`);
  return m.default;
}

const shot = (file: string, alt: string, url: string): Shot => ({ light: pick(file, 'light'), dark: pick(file, 'dark'), alt, url });

const HOST = 'dockmesh.home.lab';

export const SHOTS = {
  overview: shot('overview', 'Overview with host tiles, items that need attention, the stacks list and recent changes', HOST),
  hosts: shot('hosts', 'Hosts list with the server and two agents, with CPU, memory and disk use per host', `${HOST}/hosts`),
  compose: shot('compose', 'Compose tab of a stack with the editor', `${HOST}/stacks/immich`),
  backups: shot('backups', 'Backup jobs with what they back up, target, schedule and last run', `${HOST}/backups`),
  proxy: shot('proxy', 'Options tab of a reverse proxy site: routing, HTTPS and performance settings that start at Caddy defaults', `${HOST}/proxy/cloud.home.lab`),
  updates: shot('updates', 'Updates page with three newer app images, each with its old and new digest, and the list of recently updated containers', `${HOST}/updates`),

  // Shown instead of the hero animation when the visitor prefers reduced motion.
  heroUpdates: shot('hero-updates', 'Updates page while three image updates run: dashboards pulls its image, shared-db and static-site are queued, and the top bar shows 3 running', `${HOST}/updates`),
  heroBackup: shot('hero-backup', 'Progress dialog of the Nextcloud nightly backup with its steps, the archive step running, and the log', `${HOST}/backups`),
  heroPublish: shot('hero-publish', 'Progress dialog of the new site tools.home.lab with the site saved, the Caddy configuration applied and the certificate being requested', `${HOST}/proxy`),
} satisfies Record<string, Shot>;

export type ShotKey = keyof typeof SHOTS;

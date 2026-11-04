import type { ShotKey } from './screenshots';

export interface Feature { kicker: string; title: string; text: string; bullets: string[]; shot: ShotKey; doc: string }

export const HOME_FEATURES: Feature[] = [
  {
    kicker: 'Which host runs what again?',
    title: 'Every host, stack and container in one list.',
    text: 'Remote hosts run a small agent. Lists, logs, terminals and deploys work across all of them as if they were local, and the host filter in the top bar narrows the lists to one machine.',
    bullets: ['Live status per host, stack and container', 'Deploy and roll back stacks from the browser', 'Move a stateless stack to another host, or drain a host'],
    shot: 'hosts',
    doc: '/docs/features/multi-host/',
  },
  {
    kicker: 'Will a UI lock in my setup?',
    title: 'Your compose files stay plain files on disk.',
    text: 'Each stack is a compose.yaml in a folder. Edit it in the browser, over SSH or from Git — Dockmesh reads the file and never hides it in a database.',
    bullets: ['Running Compose projects are adopted without a restart', 'Git sources with webhooks and auto-deploy', 'Remove Dockmesh and your containers keep running'],
    shot: 'compose',
    doc: '/docs/concepts/stacks/',
  },
  {
    kicker: "Is last night's backup actually restorable?",
    title: 'Every archive is read back, not just written.',
    text: 'Volumes, stacks and the Dockmesh system itself go to five kinds of targets on a schedule, encrypted with age. After each upload the archive is read back and its checksum compared; before a restore it is checked again.',
    bullets: ['Local disk, SMB, SFTP, WebDAV and S3', 'Hooks before and after a run, for consistent dumps', 'Restore onto the original host or another one'],
    shot: 'backups',
    doc: '/docs/operations/backups/',
  },
  {
    kicker: 'Another Caddyfile to maintain?',
    title: 'HTTPS for an app in three short steps.',
    text: "Name the site, pick a container and its port, choose a certificate — the managed Caddy proxy serves it with HTTPS. Access control, streaming and headers are options of the site, and an existing Caddyfile can be imported.",
    bullets: ["Let's Encrypt, your internal CA, or plain HTTP", 'Basic auth, IP allow lists, forward auth', 'Import the Caddyfile you already have'],
    shot: 'proxy',
    doc: '/docs/features/reverse-proxy/',
  },
];

export const HOME_MORE: [string, string][] = [
  ['Roles & scopes', 'Give access to one stack, a host or a tag'],
  ['Single sign-on', 'OIDC, SAML, LDAP and OAuth2'],
  ['Two-factor', 'TOTP for local accounts'],
  ['Audit log', 'Every change recorded, hash-chained'],
  ['Alerts', 'Email, ntfy, Discord, Slack, webhooks and more'],
  ['Vulnerability scans', 'Images checked with Grype'],
  ['Image updates', 'Update and roll back containers on the server host'],
  ['Templates', 'Compose with parameters'],
  ['API & dmctl', 'Script everything'],
];

export const FEATURES_PAGE: Feature[] = [
  {
    kicker: 'Fleet',
    title: 'One view across every Docker host.',
    text: 'The server manages its own host directly and any number of remote hosts through agents that connect out over mutual TLS. Topology shows which container talks to which network and what is published through the proxy.',
    bullets: ['Host filter in the top bar', 'Migrate a stateless stack to another host, drain a host', 'Agent upgrades from the UI'],
    shot: 'hosts',
    doc: '/docs/features/multi-host/',
  },
  {
    kicker: 'Compose',
    title: 'Compose files on disk, edited where you like.',
    text: 'Stacks live as directories with a compose.yaml and an optional .env, encrypted at rest by default. Dockmesh validates, deploys and keeps a history; Git sources pull changes on a webhook.',
    bullets: ['Adopt running Compose projects as stacks', 'Deploy history and rollback', 'Templates with parameters'],
    shot: 'compose',
    doc: '/docs/features/stacks/',
  },
  {
    kicker: 'Backups',
    title: 'Backups you can restore, checked every time.',
    text: 'Schedule encrypted backups of volumes, stacks and the Dockmesh system. Archives are read back after upload and verified before a restore; retention works per job.',
    bullets: ['Local, SMB, SFTP, WebDAV, S3', 'Pre- and post-backup hooks', 'Disaster recovery from a system backup'],
    shot: 'backups',
    doc: '/docs/operations/backups/',
  },
  {
    kicker: 'Reverse proxy',
    title: 'A Caddy proxy you configure with options.',
    text: 'Sites point at a container or at another host and port. Options per site cover streaming, timeouts, access control and headers; Dockmesh runs Caddy in its own container, manages its version and can roll it back.',
    bullets: ["Let's Encrypt or internal CA", 'Basic auth, IP lists, forward auth', 'Caddyfile import'],
    shot: 'proxy',
    doc: '/docs/features/reverse-proxy/',
  },
  {
    kicker: 'Image updates',
    title: 'See which images are out of date.',
    text: 'Dockmesh compares the local digest of each image with the registry and shows when it last checked. Update one container or a selection; the previous image is kept so you can roll back.',
    bullets: ['Digest checks against the registry', 'Updates run one after another, with live steps', 'Containers on the server host'],
    shot: 'updates',
    doc: '/docs/features/image-updates/',
  },
];

export const SECURITY_ITEMS: [string, string, string][] = [
  ['Roles and scopes', 'Built-in and custom roles, assigned to everything, a host, a tag or one stack', '/docs/concepts/permissions/'],
  ['Single sign-on', 'OIDC, SAML 2.0, LDAP and OAuth2 with group mapping', '/docs/features/sso/'],
  ['Two-factor authentication', 'TOTP for local accounts, with recovery codes', '/docs/features/authentication/'],
  ['Audit log', 'Every change recorded in a SHA-256 chain', '/docs/features/audit-log/'],
  ['API tokens', 'Scoped tokens for scripts and CI', '/docs/features/api-tokens/'],
  ['Hardening guide', 'TLS in front, firewall, backups of the key', '/docs/operations/hardening/'],
];

export const OTHER_ITEMS: [string, string, string][] = [
  ['Alerts', 'Metric and event rules', '/docs/features/alerts/'],
  ['Notifications', 'Email, ntfy, Gotify, Discord, Slack, Teams, webhooks', '/docs/features/notifications/'],
  ['Monitoring', 'CPU, memory, network and disk history', '/docs/features/monitoring/'],
  ['Vulnerability scanning', 'Grype scans per image', '/docs/features/vulnerability-scanning/'],
  ['Scaling', 'Replicas per service; threshold rules through the API', '/docs/features/scaling/'],
  ['Registries', 'Private registry credentials', '/docs/features/registries/'],
  ['Environment', 'Global and per-stack variables', '/docs/features/environment-variables/'],
  ['Templates', 'MySQL, PostgreSQL, Redis, Nginx, Uptime Kuma, Vaultwarden', '/docs/features/templates/'],
  ['Volumes & networks', 'Browse, inspect, clean up', '/docs/features/volumes/'],
];

export const FAQ: [string, string][] = [
  ['Is it really free, with no paid edition?', 'Yes. Every feature — roles, single sign-on, the audit log, backups — is in the AGPL-licensed code. There is no paid tier, no node limit and no license key.'],
  ['What happens to my containers if Dockmesh stops?', 'They keep running; they are ordinary Docker containers. Stacks are compose files on disk. By default Dockmesh stores each stack\'s <code>.env</code> encrypted as <code>.env.age</code>; decrypt it with your age key before you run <code>docker compose</code> by hand. The <a href="/docs/operations/uninstall/">uninstall guide</a> walks through it.'],
  ['Does it send telemetry?', 'Dockmesh collects no usage data. Every two hours the server asks GitHub for the latest release; that request carries the Dockmesh version in its user agent and nothing else, and you can turn the check off. Other connections are the ones its features need — container registries for update checks and pulls, Let\'s Encrypt, Grype\'s vulnerability database — and the ones you configure, such as backup targets, notifications and sign-in providers.'],
  ['Does it run on a Raspberry Pi?', 'Yes, on 64-bit Linux. Server and agent are built for amd64 and arm64, and the installers pick the right binary for the host.'],
  ['Does it support Kubernetes or Swarm?', 'No. Dockmesh drives plain Docker engines and compose files. If you need a cluster scheduler, Portainer or Rancher are the better fit.'],
  ['How is the project funded and maintained?', 'It is maintained in spare time by its author. There is no company behind it and nothing to sell.'],
  ['Where do I get help?', 'In GitHub Discussions for questions and ideas, and GitHub Issues for bugs. Security problems go to GitHub\'s private vulnerability reporting.'],
];

type Cell = { kind: 'yes'; note?: string } | { kind: 'no' } | { kind: 'paid' };
const Y = (note = 'Yes'): Cell => ({ kind: 'yes', note });
const N: Cell = { kind: 'no' };
const P: Cell = { kind: 'paid' };

export interface CompareRow { feature: string; dm: string; ce: Cell; be: Cell; dg: Cell; landing: boolean }
export const COMPARE: CompareRow[] = [
  { feature: 'Compose-native', dm: 'Included', ce: Y(), be: Y(), dg: Y(), landing: false },
  { feature: 'Multi-host management', dm: 'Included', ce: Y(), be: Y(), dg: N, landing: true },
  { feature: 'Custom roles', dm: 'Included', ce: N, be: P, dg: N, landing: true },
  { feature: 'Single sign-on', dm: 'OIDC, SAML, LDAP, OAuth2', ce: N, be: P, dg: N, landing: true },
  { feature: 'Two-factor auth', dm: 'Included', ce: N, be: Y(), dg: Y(), landing: false },
  { feature: 'Service scaling', dm: 'Manual, rules via API', ce: N, be: N, dg: N, landing: false },
  { feature: 'Stack migration', dm: 'Stateless stacks', ce: N, be: N, dg: N, landing: false },
  { feature: 'Host drain', dm: 'Included', ce: N, be: N, dg: N, landing: false },
  { feature: 'SMB / SFTP / WebDAV / S3 backups', dm: 'Included', ce: N, be: N, dg: N, landing: true },
  { feature: 'Audit log', dm: 'Hash chain', ce: N, be: P, dg: N, landing: true },
  { feature: 'Vulnerability scanning', dm: 'Grype', ce: N, be: P, dg: N, landing: false },
  { feature: 'Reverse proxy', dm: 'Caddy', ce: N, be: N, dg: N, landing: false },
  { feature: 'Stack templates', dm: 'Included', ce: Y(), be: Y(), dg: N, landing: false },
  { feature: 'Single binary', dm: '~40 MB', ce: N, be: N, dg: N, landing: true },
];

export const RIVALS = [
  {
    name: 'Portainer',
    tagline: 'The commercial option with the widest scope.',
    goodAt: ['Covers Docker, Swarm, Kubernetes and ACI in one UI; Dockmesh does Docker and Compose only.', 'Commercial support with response times. Dockmesh has GitHub and nothing else.', 'A much longer track record and a large installed base.'],
    gap: ['Custom roles, SSO, audit log and CVE scans are in the Business Edition.', 'Stacks live in its database rather than as files on disk.'],
    verdict: 'If you manage Kubernetes too or need a vendor contract, pick Portainer. For plain Docker with Business-Edition features, Dockmesh costs nothing.',
  },
  {
    name: 'Dockge',
    tagline: 'The leaner compose manager.',
    goodAt: ['Very simple and quick to understand.', 'Also compose-first with files on disk.', 'Also free and open source.'],
    gap: ['One host: no agents, no fleet.', 'No roles, SSO or audit log; no backups, scaling or migration.'],
    verdict: 'For one host and a handful of stacks, Dockge is less tool for the same job — that is a plus. Once a second host or a second person arrives, Dockmesh fits better.',
  },
  {
    name: 'Plain docker compose',
    tagline: 'The command line you already use.',
    goodAt: ['No extra software, service or attack surface.', 'Fully scriptable, already in every CI.'],
    gap: ['No shared view across hosts and no access control: whoever has SSH can do everything.', 'No history of who deployed what and when.'],
    verdict: 'Dockmesh does not replace docker compose, it reads the same files. It pays off once you can no longer say for sure what runs on which host.',
  },
];

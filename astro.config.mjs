// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import tailwindcss from '@tailwindcss/vite';
import { rehypeCodeHeader } from './src/lib/rehype-code-header.mjs';

const nav = JSON.parse(readFileSync(new URL('./src/data/docs-nav.json', import.meta.url), 'utf8'));
const sidebar = nav.sections.map((s) => ({
  label: s.title,
  items: s.items.map((it) => ({ label: it.title, slug: 'docs/' + it.path.replace(/\.md$/, '') })),
}));

export default defineConfig({
  site: 'https://dockmesh.dev',
  trailingSlash: 'ignore',
  // Old docs URLs (before the docs moved to the app repo) and the old FAQ page.
  redirects: {
    '/docs': '/docs/getting-started/introduction/',
    '/docs/introduction': '/docs/getting-started/introduction/',
    '/docs/installation': '/docs/getting-started/installation/',
    '/docs/quickstart': '/docs/getting-started/first-steps/',
    '/docs/configuration': '/docs/reference/environment-variables/',
    '/docs/features/backups': '/docs/operations/backups/',
    '/docs/features/migration': '/docs/features/migration-and-drain/',
    '/docs/features/drain': '/docs/features/migration-and-drain/',
    '/docs/features/vulnerability-scan': '/docs/features/vulnerability-scanning/',
    '/docs/features/env-vars': '/docs/features/environment-variables/',
    '/docs/getting-started/upgrading': '/docs/operations/upgrade/',
    '/docs/security': '/docs/operations/hardening/',
    '/docs/security/rbac': '/docs/concepts/permissions/',
    '/docs/security/sso': '/docs/features/sso/',
    '/docs/security/mfa': '/docs/features/authentication/',
    '/docs/security/mtls': '/docs/concepts/hosts-and-agents/',
    '/docs/operations/troubleshooting': '/docs/troubleshooting/troubleshooting/',
    '/docs/reference/env-vars-reference': '/docs/reference/environment-variables/',
    '/docs/reference/cli-reference': '/docs/reference/dockmesh-cli/',
    '/docs/api/overview': '/docs/reference/api/',
    '/docs/concepts/agent-protocol': '/docs/concepts/hosts-and-agents/',
    '/faq': '/about/',
  },
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light-default', dark: 'github-dark-default' },
      defaultColor: false,
    },
    processor: unified({ rehypePlugins: [rehypeCodeHeader] }),
  },
  integrations: [
    starlight({
      title: 'Dockmesh',
      description: 'Manage Docker Compose stacks on all your hosts from one web UI. Free and open source.',
      favicon: '/favicon.svg',
      expressiveCode: false,
      disable404Route: true,
      sidebar,
      customCss: ['./src/styles/docs.css'],
      components: {
        Head: './src/components/docs/Head.astro',
        Header: './src/components/docs/Header.astro',
        Footer: './src/components/docs/Footer.astro',
        Sidebar: './src/components/docs/Sidebar.astro',
        TwoColumnContent: './src/components/docs/TwoColumnContent.astro',
        PageTitle: './src/components/docs/PageTitle.astro',
        ThemeSelect: './src/components/docs/Empty.astro',
        Search: './src/components/docs/Empty.astro',
        SocialIcons: './src/components/docs/Empty.astro',
        MobileMenuFooter: './src/components/docs/MobileMenuFooter.astro',
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});

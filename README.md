# dockmesh.dev

Source of [dockmesh.dev](https://dockmesh.dev), the website of [Dockmesh](https://github.com/Dockmesh/dockmesh):
the product pages, the documentation and the changelog. It's a static site built with Astro, Starlight (docs)
and Tailwind CSS v4, served by Cloudflare Workers. Search is Pagefind; fonts are self-hosted, so the site makes no
requests to other hosts.

## Develop

Node version: see `.node-version`.

```bash
npm ci
npm run dev        # http://localhost:4321 (search only works in a build)
npm run build      # static site in dist/, including the search index
npm run preview    # serve dist/
```

## Where the content comes from

- **Docs** are written in the app repo under [`docs/site/`](https://github.com/Dockmesh/dockmesh/tree/main/docs/site)
  and copied here with `npm run sync-docs -- <git-ref | path-to-app-checkout>`, e.g. `npm run sync-docs -- v0.5.1`.
  The script replaces `src/content/docs/docs/`, rewrites relative `.md` links and writes the sidebar to
  `src/data/docs-nav.json`. Don't edit the copied pages here.
- **Changelog** pages are built from the app's
  [`CHANGELOG.md`](https://github.com/Dockmesh/dockmesh/blob/main/CHANGELOG.md), fetched at build time. The build
  fails if it can't be read; set `DOCKMESH_CHANGELOG=/path/to/CHANGELOG.md` to build offline.
- **Screenshots** are in `src/assets/shots/` (a `-dark` and `-light` WebP each) and listed in
  `src/data/screenshots.ts`.
- **Page copy** is in `src/data/content.ts`; the hero demo's texts and sample data in `src/data/demo.ts`.

## Deploy

Cloudflare Workers Builds builds and deploys the site on every push to `main` (`wrangler.jsonc`, assets from
`dist/`).

## get.dockmesh.dev

`workers/get/` is a separate worker behind `get.dockmesh.dev`. It serves `install.sh` and `uninstall.sh` from the
latest Dockmesh release (`?version=vX.Y.Z` pins one) and is deployed by `.github/workflows/deploy-get-worker.yml`
when files under `workers/get/` change on `main`.

## Contributing

Docs fixes go to the app repo, not here — see [CONTRIBUTING.md](CONTRIBUTING.md). Issues and pull requests about the
website itself (layout, broken links, typos in page copy) are welcome here.

## License

[AGPL-3.0-only](LICENSE).

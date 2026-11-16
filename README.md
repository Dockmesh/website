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
- **Current version** is `src/data/release.json`, written by the release sync below; without it the newest
  changelog entry is used.
- **Changelog** pages are built from `src/data/changelog.md`, the app's
  [`CHANGELOG.md`](https://github.com/Dockmesh/dockmesh/blob/main/CHANGELOG.md) as of the last synced release tag,
  written by the release sync below. Don't edit it here. `DOCKMESH_CHANGELOG=/path/to/CHANGELOG.md` builds from
  another file.
- **Screenshots** are in `src/assets/shots/` (a `-dark` and `-light` WebP each) and listed in
  `src/data/screenshots.ts`.
- **Page copy** is in `src/data/content.ts`; the hero demo's texts and sample data in `src/data/demo.ts`.

## Deploy

Cloudflare Workers Builds builds and deploys the site on every push to `main` (`wrangler.jsonc`, assets from
`dist/`).

## Release sync

When a stable Dockmesh release becomes GitHub's latest release, the app's release workflow triggers
`.github/workflows/release-sync.yml` here. Everything it syncs comes from the release tag, never from the app's
`main`, so a release tagged on a `release/X.Y.x` branch shows up before it is forward-ported:

1. Docs are copied from the tag and `src/data/release.json` records it as the current version.
2. The tag's `CHANGELOG.md` is merged into `src/data/changelog.md`: every release in the tag's file, plus the ones
   only the previous copy has (a patch not yet forward-ported), newest first.
3. The site is built and `scripts/release-sync.mjs check` makes sure the changelog page of the release, the
   changelog index and every docs page exist.
4. A `docs: sync for vX.Y.Z` PR is opened and squash-merged.
5. The run waits for the Cloudflare build of that merge commit and then for `dockmesh.dev/changelog/X.Y.Z/` to load.

The run fails, and nothing is merged, when the tag's `CHANGELOG.md` has no section for the release or the build
misses a page. It also fails, after the merge, when the Cloudflare build fails or doesn't report within 20 minutes,
or the changelog page isn't live 10 minutes later; then retry the build in the Cloudflare dashboard and run the sync
again, which only checks the deploy when main is already synced.

Pre-releases are skipped. A stable tag older than `release.json` (a patch of an older minor, run by hand) only adds
its changelog entry; docs and the current version stay. To run the sync by hand:

```bash
gh workflow run release-sync.yml -R Dockmesh/website -f tag=vX.Y.Z
```

`npm test` runs the sync's unit tests against the fixtures in `scripts/fixtures/`.

## get.dockmesh.dev

`workers/get/` is a separate worker behind `get.dockmesh.dev`. It serves `install.sh` and `uninstall.sh` from the
latest Dockmesh release (`?version=vX.Y.Z` pins one) and is deployed by `.github/workflows/deploy-get-worker.yml`
when files under `workers/get/` change on `main`.

## Contributing

Docs fixes go to the app repo, not here — see [CONTRIBUTING.md](CONTRIBUTING.md). Issues and pull requests about the
website itself (layout, broken links, typos in page copy) are welcome here.

## License

[AGPL-3.0-only](LICENSE).

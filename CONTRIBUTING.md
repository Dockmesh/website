# Contributing

**Docs fixes:** the pages under `/docs/` are copied from the app repo, so a change made here is overwritten by
the next sync. Edit the page in [`docs/site/`](https://github.com/Dockmesh/dockmesh/tree/main/docs/site) of
[Dockmesh/dockmesh](https://github.com/Dockmesh/dockmesh) and open the pull request there. Every docs page also
has an "Edit this page on GitHub" link that opens the right file.

**Changelog:** comes from the app's `CHANGELOG.md`; fix it in the app repo.

**Everything else on the website** (page copy, layout, styles, broken links, the get worker): open an issue or a
pull request here. Run `npm ci && npm run build` before you push; the build fails on a broken changelog or
missing screenshot.

Security issues: please don't open an issue — see the
[security policy](https://github.com/Dockmesh/dockmesh/security/policy).

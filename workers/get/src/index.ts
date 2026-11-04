// get.dockmesh.dev — serves the Dockmesh shell scripts.
//
// Design
//   - Serves the scripts attached to the latest GitHub release of
//     dockmesh/dockmesh, so installer changes only go live with a tagged
//     release. `?version=vX.Y.Z` pins a specific release instead; if that
//     release has no such asset (v0.3.3 and older), the script is taken from
//     the same tag in the repository.
//   - Caches each upstream for 5 minutes at the Cloudflare edge so a
//     sudden `curl | bash` spike (e.g. HN front-page) doesn't hammer
//     GitHub.
//   - Serves with Content-Type text/x-shellscript so browsers visiting
//     the URL show plain text (not download-as-file) — reviewers can
//     eyeball the script before running it.
//
// Routes
//   /              → install.sh   (the curl | bash entrypoint)
//   /install.sh    → install.sh   (explicit alias)
//   /uninstall     → uninstall.sh (interactive remove wizard)
//   /uninstall.sh  → uninstall.sh (explicit alias)
//   anything else  → 404
const RELEASES = "https://github.com/Dockmesh/dockmesh/releases";
const RAW = "https://raw.githubusercontent.com/Dockmesh/dockmesh";

// Route → release asset name.
const ROUTES: Record<string, string> = {
  "/": "install.sh",
  "/install.sh": "install.sh",
  "/uninstall": "uninstall.sh",
  "/uninstall.sh": "uninstall.sh",
};

// Strict semver tag, optional pre-release suffix (v1.2.3, v1.2.3-rc.1).
const TAG_RE = /^v\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/;

const CACHE_TTL_SECONDS = 300;

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    const script = ROUTES[url.pathname];
    if (!script) {
      return new Response("not found\n", { status: 404 });
    }

    const version = url.searchParams.get("version");
    if (version !== null && !TAG_RE.test(version)) {
      return new Response("invalid version\n", { status: 400 });
    }
    const upstream =
      version === null
        ? `${RELEASES}/latest/download/${script}`
        : `${RELEASES}/download/${version}/${script}`;

    // Reject method + query abuse; only GET/HEAD make sense here.
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("method not allowed\n", {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    }

    // `?fresh=1` bypasses both the Cloudflare edge cache AND GitHub's
    // CDN. Used during release iterations when we need to
    // verify the latest script lands on test hosts within seconds
    // rather than waiting for the 5-minute TTL. Public URL stays quiet
    // for normal users — no docs pointer, just a dev escape hatch.
    const bypassCache = url.searchParams.get("fresh") === "1";

    const fetchUpstream = (target: string) =>
      // GitHub answers with a redirect to its asset CDN.
      fetch(target, {
        redirect: "follow",
        cf: bypassCache
          ? { cacheTtl: 0, cacheEverything: false }
          : { cacheTtl: CACHE_TTL_SECONDS, cacheEverything: true },
        // GitHub's CDN honors Cache-Control on the request — set
        // no-cache so the upstream also skips its own cache layer.
        headers: bypassCache ? { "Cache-Control": "no-cache" } : undefined,
      });

    let upstreamResp = await fetchUpstream(upstream);

    // Releases up to v0.3.3 carry no script assets; a pinned version then
    // falls back to the script as it is in the tag. The unpinned URL never
    // falls back, so it can't serve unreleased scripts.
    if (version !== null && upstreamResp.status === 404) {
      upstreamResp = await fetchUpstream(`${RAW}/${version}/scripts/${script}`);
    }

    if (!upstreamResp.ok) {
      return new Response(
        `# upstream fetch failed: ${upstreamResp.status}\n# try again later\n`,
        {
          status: 502,
          headers: { "Content-Type": "text/x-shellscript; charset=utf-8" },
        },
      );
    }

    const body = await upstreamResp.text();

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "text/x-shellscript; charset=utf-8",
        "Cache-Control": bypassCache
          ? "no-store, no-cache, must-revalidate, max-age=0"
          : `public, max-age=${CACHE_TTL_SECONDS}`,
        // Defense-in-depth: users often pipe this to bash. Tell the
        // browser not to guess a different MIME and not to cache auth
        // state from third parties.
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    });
  },
};

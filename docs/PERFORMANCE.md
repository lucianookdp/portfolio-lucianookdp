# Performance checks

The pull-request workflow runs the TypeScript/Astro check, production build and
`scripts/check-performance-budget.mjs`. It needs no secrets, uses only
`contents: read`, keeps the committed GitHub statistics, and does not deploy.
The check becomes mandatory for merging only if a repository ruleset requires
the `Performance budget / check` status.

## Run locally

```sh
npm ci
npm run check
npm run build
node scripts/check-performance-budget.mjs
```

The checker returns exit code 1 for a exceeded budget, incomplete build or missing
local module. It only reads build files. To inspect the original build without
enforcing limits, or compare it with the new build:

```sh
node scripts/check-performance-budget.mjs --dir ../baseline-dist --report-only
node scripts/check-performance-budget.mjs --baseline ../baseline-dist
node scripts/check-performance-budget.mjs --json > performance-report.json
```

`--report-only` permits budget violations, but still rejects malformed or missing
builds. `--json` outputs exact byte values and module lists for machine comparison.
Store baseline builds outside `dist` before rebuilding. Do not commit generated
builds or reports.

## What is counted

| Metric | Raw limit | Gzip limit |
| --- | ---: | ---: |
| All emitted JavaScript, including lazy chunks | 1,200 KiB | 360 KiB |
| Initial static JavaScript, homepages | 360 KiB | 120 KiB |
| Initial static JavaScript, 404 page | 380 KiB | 125 KiB |
| All emitted CSS | 90 KiB | 20 KiB |
| Each HTML page | 190 KiB | 45 KiB |

The initial graph includes HTML script entries, modulepreload links, recursively
resolved static imports/re-exports, Astro `client:load`/`client:only` component and
renderer modules, and executable inline scripts. Modules are counted once per
page. JSON-LD is included in HTML only. Gzip uses Node's level 9 separately for
each file (and each inline script), independent of server configuration. Initial
inline JavaScript is also present in the HTML metric; these metrics must not be
added together as if they were network transfer size.

The separate 404 ceiling preserves its existing OGL shader: the measured optimized
404 graph is 365.0 KiB raw / 120.2 KiB gzip, versus 476.0 / 156.0 before this work.
The homepages remain under their stricter ceiling (326.0 / 110.4 after optimization).

All-JavaScript measures the entire build, including emitted chunks a visitor
might never load. Initial-JavaScript is a static approximation: dynamic imports
are excluded even if code calls them immediately; `client:idle` and `client:visible`
islands are also excluded even if they activate soon after navigation. A smaller
initial graph alone does not prove faster loading. Verify scheduling changes with
a real browser network/performance trace, especially for the Three.js hero.

The dependency scanner intentionally has no parser dependency and targets the
ESM syntax emitted by Vite/Rollup: compact imports, side-effect imports and named
or star re-exports. It is a conservative regular expression, not a JavaScript
parser; import-like strings/comments may overcount or cause a missing-file error.
Computed loading, unusual escaped module specifiers, import maps and external
resource sizes are outside its scope. Review the printed graph after bundler
upgrades; do not silence errors or raise limits just to make CI pass. External
URLs are reported but never fetched by this check.

Fonts and image weights, host compression/cache headers, CPU/GPU cost, WebGL
initialization, layout shifts and interaction latency need separate browser
checks. Raw/gzip budgets are repeatable regression guards, not Lighthouse or
Core Web Vitals results. A build can pass these limits and still be slow.

## Review changes without losing the design

- Compare the same commit/build mode on desktop and a throttled mobile viewport.
- Check initial rendering, scrolling, theme/language switches, navigation,
  command palette, contact/copy action and reduced-motion behavior.
- Capture cold-cache traces before and after; inspect actual transfer sizes,
  long tasks and when deferred imports run.
- Verify the deployed domain separately. The existing deployment workflow targets
  GitHub Pages, while the public domain was observed returning Hostinger CDN
  headers; do not assume a successful Pages deployment updated that domain.

The limits are intentionally separate from the baseline report. Adjust them only
after recording actual before/after build values and reviewing a justified change.

# HTML Move Path Repair Plan

## Status

- Role: `agents.planner`
- State: awaiting user approval before implementation
- Goal source: `tasks/goal.md`
- User-owned move to preserve: all root HTML files now live in `scripts/html/`; do not move or restore them to the repository root.

## Findings

- `server/dev-server.js` currently resolves `/` to the removed root `index.html` and resolves `/*.html` directly under the repository root, so all existing public page URLs now return `404`.
- The moved HTML files still use `./styles/...`, `./scripts/...`, and `./image/...`-compatible relative assumptions from their old root location. If served by their physical `/scripts/html/*.html` paths, those references resolve below `/scripts/html/` and break.
- HTML navigation currently uses relative `./*.html` links. It works only when the browser URL remains at the public root level; root-relative links are safer and make the canonical URL explicit.
- `scripts/admin.js` and `scripts/site.js` generate relative page and image URLs; `scripts/posts.js` stores relative cover paths. These should be root-relative so behavior does not depend on the HTML files' physical directory.
- API requests already use `/api/...` or an empty same-origin API base and should remain unchanged.
- `scripts/smoke-test.js` covers only `/`, `/blog.html`, `/mail.html`, and two API routes; it does not prove all moved pages or required static assets resolve.
- `README.md` still describes HTML files as repository-root files and needs to distinguish physical file locations from stable public URLs.
- `package.json` contains no moved-HTML path reference; no package script, dependency, or configuration change is currently required.

## URL Contract

The implementation must preserve these public URLs:

- `/` and `/index.html` -> `scripts/html/index.html`
- `/about.html` -> `scripts/html/about.html`
- `/blog.html` -> `scripts/html/blog.html`
- `/contact.html` -> `scripts/html/contact.html`
- `/mail.html` -> `scripts/html/mail.html`
- `/admin-login.html` -> `scripts/html/admin-login.html`
- `/admin.html` -> `scripts/html/admin.html`
- `/Surfing_founder.html` -> `scripts/html/Surfing_founder.html`
- `/bar.html` -> `scripts/html/bar.html`
- `/product.html` -> `scripts/html/product.html`
- `/football.html` -> `scripts/html/football.html`

No public URL change is planned. `/scripts/html/*.html` is the physical layout, not the canonical navigation contract.

Static assets and APIs must retain their current root URLs:

- `/styles/...`
- `/scripts/...`
- `/image/...`
- `/api/...`

## Modification Boundary

Allowed implementation files:

- `server/dev-server.js`
- `scripts/html/*.html`
- `scripts/admin.js`
- `scripts/site.js`
- `scripts/posts.js`
- `scripts/smoke-test.js`
- `README.md`

Files inspected but not expected to change unless implementation reveals a direct broken reference:

- `scripts/seed-post-metrics.js`
- `scripts/verify-supabase.js`
- `package.json`

Explicitly out of scope:

- Moving HTML files again or recreating root-level HTML copies
- Dependency or `package.json` configuration changes
- API behavior, database schema, environment files, secrets, styling, content, or unrelated refactors
- Changing external links such as GitHub, LinkedIn, X, Xiaohongshu, and WeChat

## Coder Task Lines

- [ ] Coder 1 — Update `server/dev-server.js` with a narrow page-route mapping from the stable public URLs above to `scripts/html/*.html`, while preserving existing root static asset serving, `/api/*` dispatch, query strings, MIME types, cache behavior, and traversal protection.
- [ ] Coder 2 — Update all `scripts/html/*.html` local page and asset `href`/`src` references to root-relative public paths (`/about.html`, `/styles/site.css`, `/scripts/site.js`, etc.); preserve fragment-only anchors, external URLs, form behavior, page content, and the existing admin script cache-busting query.
- [ ] Coder 3 — Update path-producing references in `scripts/admin.js`, `scripts/site.js`, and `scripts/posts.js` to root-relative public page/image URLs; leave `/api/...`, `window.location` analytics values, external URLs, and runtime behavior unchanged.
- [ ] Coder 4 — Expand `scripts/smoke-test.js` to assert success rather than only print responses, cover every stable page URL plus representative CSS/JS/image assets and existing API checks, and return a nonzero exit code for non-2xx results.
- [ ] Coder 5 — Update `README.md` so it documents `scripts/html/*.html` as the physical source location while continuing to advertise the stable root-level browser URLs; do not change dependencies or setup instructions beyond path accuracy.

Each coder owns exactly one task line and must not broaden scope. Any need to change the URL contract, dependencies, configuration, or architecture returns the task to Planner for approval.

## Reviewer Checklist

- [ ] Confirm no root HTML file was restored and every user-moved file remains under `scripts/html/`.
- [ ] Confirm the server mapping is limited to known page routes and does not remap `/api/*`, `/styles/*`, `/scripts/*`, or `/image/*`.
- [ ] Confirm all local HTML `href`, `src`, `action`, navigation, redirect, generated-link, `fetch`, and image references resolve against the stable public root.
- [ ] Confirm fragment links and external links were not rewritten.
- [ ] Confirm API paths remain same-origin `/api/*` paths.
- [ ] Confirm no dependency, environment, database, styling, content, or unrelated code changes were introduced.
- [ ] Review the final diff for minimality and maintainability before approval.

## Verification Plan

- [ ] Run a static reference scan across `server/dev-server.js`, `scripts/*.js`, `README.md`, `package.json`, and `scripts/html/*.html` for stale root-file assumptions and unintended `scripts/html/styles`, `scripts/html/scripts`, or `scripts/html/image` resolutions.
- [ ] Start the existing Node server on a verified free local port without installing dependencies or changing configuration.
- [ ] Verify HTTP `200` for `/`, `/index.html`, all ten other public `*.html` routes, representative `/styles/site.css`, `/scripts/site.js`, `/scripts/admin.js`, and existing local images.
- [ ] Verify `/api/health` and the existing post-stats API still return successful responses, proving page routing did not intercept APIs.
- [ ] Run `npm run smoke` and require a zero exit code with all expanded targets passing.
- [ ] Check representative HTML response bodies reference root-level public assets/pages and do not expose broken nested resource paths.
- [ ] If browser tooling is available, open Start, Blog, Mail, Admin Login, and one chapter page; verify navigation, CSS/JS loading, console errors, blog links/images, admin redirects, and form/API calls.
- [ ] Compare `git diff` and `git status` before completion to prove only approved files changed and the user's existing HTML moves were preserved.

## Acceptance Criteria

- Existing public URLs `/`, `/index.html`, and every listed `/*.html` route work without redirects to a new required URL.
- All moved pages load their CSS, JavaScript, and local images from the existing root asset URLs.
- Navigation, generated blog links, blog cover images, and admin login/dashboard redirects use stable public URLs and do not depend on the physical HTML directory.
- All `/api/*` requests keep their current contracts and are not captured by static page routing.
- The expanded smoke test fails on a broken route/asset and passes when all required targets are available.
- Documentation accurately separates physical HTML locations from browser URLs.
- No implementation file is changed until the user approves this plan; after implementation, independent Reviewer approval is required before completion.

# New UI Redraw Plan

## Status

- Branch: `new_ui`
- Role: implemented and verified
- User request: read `UI_design.md`, use `skills/personal-website-ui-polisher/website-ui-polisher-skill.md`, redraw the website UI.
- Skill used: `personal-website-ui-polisher`
- Complexity: complex; spans server routing, moved HTML pages, shared CSS, shared JS-generated paths, and visual system changes.

## Source Findings

- `UI_design.md` was re-read after the user updated it and now contains the active project UI rules.
- `docs/design-system.md` does not exist.
- The applicable design sources are `UI_design.md` and `skills/personal-website-ui-polisher/website-ui-polisher-skill.md`.
- All HTML files have been moved to `scripts/html/`.
- `server/dev-server.js` still expects root-level HTML files, so `/`, `/about.html`, `/blog.html`, etc. will return `404` unless route mapping is repaired.
- Moved HTML still uses root-level relative assumptions such as `./styles/site.css` and `./scripts/site.js`; these must become root-relative URLs such as `/styles/site.css`.
- Current CSS is dark, glassy, colorful, and dashboard-like. This conflicts with the skill direction: restrained, light `#F5F5F5`, editorial, systematic, Electric Blue used sparingly, Pulse Cyan only for feedback.

## Scope

Allowed files:

- `server/dev-server.js`
- `scripts/html/*.html`
- `styles/site.css`
- `scripts/site.js`
- `scripts/admin.js`
- `scripts/posts.js`
- `scripts/smoke-test.js`
- `README.md` if path documentation needs updating
- `tasks/todo.md`

Out of scope:

- Backend API behavior
- Data models
- Supabase schema
- Dependencies
- Environment files or secrets
- Large content rewrites
- Moving HTML files back to root
- Adding UI libraries

## Acceptance Criteria

- Public URLs stay stable:
  - `/`
  - `/index.html`
  - `/about.html`
  - `/blog.html`
  - `/contact.html`
  - `/mail.html`
  - `/admin-login.html`
  - `/admin.html`
  - `/Surfing_founder.html`
  - `/bar.html`
  - `/product.html`
  - `/football.html`
- HTML remains physically under `scripts/html/`.
- All page-local asset links resolve from root-level public URLs:
  - `/styles/...`
  - `/scripts/...`
  - `/image/...`
  - `/api/...`
- UI follows the project skill:
  - background `#F5F5F5`
  - primary text `#131313`
  - secondary text `#5F5F5F`
  - borders `#DADADA`
  - Electric Blue `#0909E2` used sparingly for brand/headlines/CTA/key accents
  - Pulse Cyan `#27D7C7` used only for hover, active, focus, and interaction feedback
  - no large blue backgrounds, heavy-card dashboard feel, generic SaaS layout, or decorative-first animation work
- Functionality remains intact:
  - Blog list/detail rendering
  - Blog generated links and cover images
  - Mail form submission
  - Contact copy/share interactions
  - Admin login/dashboard JS loading
  - `/api/*` routing
- Verification passes:
  - `npm run smoke`
  - manual HTTP checks for all public pages and representative CSS/JS/image assets
  - static scan for stale `./styles`, `./scripts`, `./image`, and root HTML assumptions inside moved pages

## Implementation Plan

1. Repair static routing for moved HTML.
   - Map known public page URLs to `scripts/html/*.html`.
   - Preserve existing `/api/*`, `/styles/*`, `/scripts/*`, and `/image/*` behavior.
   - Keep traversal protection and MIME behavior.

2. Normalize moved HTML paths.
   - Convert local CSS/JS/page links in `scripts/html/*.html` to root-relative public paths.
   - Preserve external links, fragments, content, forms, and admin script cache-busting query.

3. Normalize JS-generated paths.
   - Update generated blog links and fallback image paths in `scripts/site.js`, `scripts/admin.js`, and `scripts/posts.js` where needed.
   - Keep API requests as `/api/*`.

4. Redraw shared UI in `styles/site.css`.
   - Replace the current dark/glass style with the skill’s light editorial system.
   - Establish tokens, typography, layout rhythm, border system, buttons, cards, forms, image treatment, hover/focus states, and responsive rules.
   - Preserve class names to avoid HTML/JS breakage.

5. Tighten page-specific layout only where CSS cannot solve it.
   - Keep structural edits minimal.
   - Focus on hierarchy, spacing, typography, and image treatment before animation.

6. Expand smoke coverage if necessary.
   - Ensure broken routes/assets fail the command rather than only printing responses.

7. Verify.
   - Completed: static scans.
   - Completed: local server on free port `3125`.
   - Completed: `npm run smoke`.
   - Completed: all public pages and core assets return 200.
   - Completed: browser visual inspection gap reported.

## Verification Results

- Static scan found no stale moved-page references for `./styles`, `./scripts`, `./image`, nested `../image` CSS URLs, or generated `./blog.html` / admin links.
- JS syntax checks passed for `server/dev-server.js`, `scripts/site.js`, `scripts/admin.js`, `scripts/posts.js`, and `scripts/smoke-test.js`.
- `npm run smoke` passed against `http://127.0.0.1:3125` with local memory-mode API.
- HTTP 200 verified for `/`, `/index.html`, `/about.html`, `/blog.html`, `/contact.html`, `/mail.html`, `/admin-login.html`, `/admin.html`, `/Surfing_founder.html`, `/bar.html`, `/product.html`, `/football.html`, `/styles/site.css`, `/scripts/site.js`, `/scripts/admin.js`, `/scripts/posts.js`, `/image/blog/banner.jpg`, `/image/contact/contact_bnner.jpg`, and `/api/health`.
- Browser visual inspection was not completed in this tool environment; validation was HTTP/static/JS-based.

## Review Checklist

- No backend/data/config/dependency changes.
- No root HTML files restored.
- `scripts/html/` remains the source location.
- Public URLs work.
- UI matches `personal-website-ui-polisher` rules.
- Electric Blue count is controlled per page.
- Cyan is feedback-only.
- Long-form text does not use display typography.
- Images are desaturated/unified by default.
- Responsive layouts avoid overlap and unreadable controls.

## Comment input popup update
- Status: approved for implementation.
- Scope: keep article-bottom comment list visible; move only the comment writing form into a popup opened from Chat With Others.
- Acceptance: comment list uses name + time + message rows with dividers; submit flow still refreshes comments and count; no backend/API/database changes.

## Start page object-entry redesign
- Status: approved for implementation.
- Scope: only `scripts/html/index.html` and start-page CSS in `styles/site.css`.
- Acceptance: start page shows Edison Xu logo/nav, large IBM slogan, four image-only object links with grayscale default, lit hover/active/focus states, physical tabletop overlap, correct routes; no Blogs/detail/other page edits.

## About page right-column iteration
- Status: approved for implementation on branch `about2.1`.
- Scope: only `scripts/html/about.html` and About-specific CSS in `styles/site.css`; do not modify other pages.
- Constraint: keep the left sidebar presentation largely unchanged; only adjust anchor links if needed for the new right-column sections.
- Plan:
  1. Replace the right column with three sections in this order: Experience, Projects, Focus.
  2. Build Experience from six entries: XJTLU, SurferGarage, Research, Home399 Bar, Miami Victory Club, Activity Team.
  3. Add hover/focus photo popovers for Experience entries, using existing images when present and placeholders where folders are empty.
  4. Convert the current four Focus cards into two Projects cards.
  5. Move the current Projects-style long-form logic into the final Focus section.
- Assets:
  - Use images from `/image/about/SurferGarage/`, `/image/about/Home399%20bar/`, and `/image/about/Miami%20Victory%20Club/`.
  - Use placeholders for XJTLU, Research, and Activity Team; existing folder is spelled `Acitivity Team`.
- Verification:
  - Confirm only About files changed, excluding existing untracked local-server pid.
  - Run static checks for malformed tags in `scripts/html/about.html`.
  - Verify `/about.html` renders and referenced About images return HTTP 200 where applicable.

## Start page demo popovers
- Status: approved for implementation on branch `about2.1`.
- Scope: only `scripts/html/index.html` and Start-specific CSS in `styles/site.css`.
- Goal: for demo presentation, disable the four Start object links and show photo popovers instead.
- Behavior:
  - Computer object: no link and no photo association for now.
  - Mic object: show SurferGarage photo grid.
  - Cocktail object: show Home399 Bar photo grid.
  - Football object: show Miami Victory Club photo grid.
  - Preserve object visuals; reveal popovers on hover/focus/click via button focus.
- Out of scope: child page files, routing, backend, and permanent deletion of existing pages.
- Verification: `/index.html`, referenced Start images, and representative popover images return 200; `git diff --check` passes.
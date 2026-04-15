# Task

## Goal

- [x] Build an Edison personal website from `tasks/website_goal.docx` with five main sections: Start, About, Blog, Contact, and Mail.

## Constraints

- Use the product direction from the PRD: expressive Start page, trust-building About page, blog with MDX support, Contact links, and Mail interactions.
- Treat this as a complex task because it spans architecture, multiple pages, dynamic data, and future backend integrations.
- Keep the MVP focused on phase-one scope first: site architecture, Start, About, Blog list/detail, Contact, and basic Mail form.
- Defer phase-two dynamic features until the core experience is solid: view counts, likes, comments, and email notifications.

## Complexity Check

- [x] Confirm this is a complex task
- [x] Reason: multi-page app, architecture choices, cross-file implementation, data-flow design, and ambiguous details that need structure before coding

## Planner

- [x] Read `tasks/website_goal.docx`
- [x] Summarize product scope, page roles, and MVP priorities
- [x] Identify likely implementation tracks: app shell, content system, visual design system, and dynamic feature scaffolding
- [x] Confirm the implementation plan with the user before execution

## Plan Adjustment

- [x] Adjust phase-one implementation from a planned Next.js scaffold to a dependency-light static MVP so work could continue without blocking on package installation or runtime setup.
- [x] Keep the structure migration-ready: shared styles, shared scripts, page-per-route files, and explicit placeholders for later backend/data integration.

## Plan

- [x] Initialize a dependency-light web app structure with page routes, shared styles, and shared scripts
- [x] Build the global shell: layout, navigation, typography, shared styles, and page transitions
- [x] Implement the Start page with four symbolic interactive objects and chapter-based navigation
- [x] Implement the About page with formal profile, experience, and project sections
- [x] Implement the Blog system with article list, article detail route, and Markdown-ready content structure
- [x] Implement the Contact page with external profiles and a curated friends section
- [x] Implement the Mail page with a basic anonymous message form and backend-ready submission contract
- [x] Add placeholders or interfaces for future metrics, likes, comments, and notifications without overbuilding phase one
- [x] Verify behavior, page routing, responsiveness, and content flow

## Verification

- [x] Run the app locally with `python -m http.server 3000` and verify primary HTML routes return `200 OK`
- [x] Check navigation structure between Start, About, Blog, Contact, and Mail at file level and route level
- [x] Verify Blog list/detail content loading path via shared data file plus `blog.html?slug=...` route contract
- [x] Verify Mail form basic validation and submission path by code review of localStorage-backed front-end flow
- [ ] Check responsive behavior on desktop and mobile widths in a browser
- [x] Review the implementation for scope control, visual coherence, and MVP alignment

## Review

- Verified: static server returned `200 OK` for `index.html`, `about.html`, `contact.html`, and `mail.html`; blog route shell and required scripts were served; route links and key DOM hooks were checked.
- Risks: no browser screenshot or headless rendering pass yet; Mail is front-end only and does not persist to a database; Blog uses a lightweight in-browser renderer rather than full MDX.
- Plan match: overall phase-one MVP intent is met, but the implementation intentionally deviated from the earlier Next.js scaffold in order to keep momentum without dependency setup.
- Reviewer approval: local self-review passes for MVP scope; a browser-based UI pass is still recommended.

## Phase Two Goal

- [x] Build the second phase from `tasks/website_goal.docx`: backend and database support for blog views, likes, comments, anonymous messages, email notifications, and analytics-ready event collection.
- Status: live Supabase and Resend verification passed for the lightweight backend path.

## Phase Two Constraints

- [x] Keep phase-two scope aligned with the PRD: prioritize dynamic capability over visual refactor.
- [x] Minimize disruption to the current V1 pages and reuse existing page structure where practical.
- [x] Treat this as a complex task because it includes architecture, framework/runtime decisions, database design, API contracts, and verification across front end and backend.
- [x] Do not change dependencies, configuration, or deployment model silently; these require explicit user approval before execution.

## Phase Two Acceptance Criteria

- [x] Blog detail pages can record and display view counts from the database.
- [x] Blog detail pages can submit likes through the backend and return updated counts safely.
- [x] Blog detail pages can submit comments to the database with moderation status support.
- [x] Mail page submissions are stored in the database instead of `localStorage`.
- [x] Anonymous mail submissions trigger an email notification.
- [x] Core page interaction events have a clear collection contract for later dashboards.
- [x] The implementation is verified end to end in local development with clear fallback/error behavior.

## Phase Two Planner

- [x] Re-read `tasks/website_goal.docx` and extract the exact dynamic feature scope for phase two.
- [x] Audit the current static MVP and identify the minimum migration path needed to support database access and server-side endpoints.
- [x] Confirm whether phase two should stay static-plus-external-service or migrate to the PRD target stack of Next.js + Route Handlers / Server Actions.
- [x] Define the smallest acceptable backend architecture before any coding starts.

## Phase Two Plan

- [x] Decide the runtime shell for dynamic features.
- [ ] Recommended default: migrate from the current static MVP to a minimal Next.js app shell because the PRD explicitly targets Next.js, Route Handlers / Server Actions, and Vercel deployment.
- [x] Alternative fallback if the user wants minimum migration: keep static pages temporarily and add a thin backend service, but this should be treated as a deviation from the PRD.
- [x] Map current routes and shared assets into the chosen runtime without broad UI rewrites.
- [x] Define environment variable boundaries for Supabase, email provider, and analytics/event ingestion.

- [x] Design the database schema in Supabase.
- [x] Create `posts` support fields or a stable post identity contract for analytics linkage.
- [x] Create `post_views` or a denormalized view-count strategy with bot/spam considerations documented.
- [x] Create `post_likes` with rate-limit or duplicate-like mitigation strategy.
- [x] Create `comments` with `status` values for `pending`, `published`, and `hidden`.
- [x] Create `messages` for anonymous mail submissions.
- [x] Define indexes, timestamps, and retention/audit needs for each table.

- [x] Design the backend contract.
- [x] Define route handlers or server actions for `recordView`, `likePost`, `submitComment`, and `submitMessage`.
- [x] Define validation rules, payload shapes, and response contracts for each action.
- [x] Define abuse controls: rate limiting, origin checks, honeypot or challenge strategy, and basic content validation.
- [x] Define notification flow for anonymous messages and, if desired, comment moderation alerts.

- [x] Integrate the front end with the backend.
- [x] Replace blog mock metrics with database-backed counts.
- [x] Add like interaction wiring and optimistic or non-optimistic update behavior.
- [x] Add comment form and comment list rendering with moderation-aware visibility.
- [x] Replace Mail page `localStorage` submission with real backend submission and success/error states.
- [x] Add analytics event hooks for Start click-through, Contact outbound clicks, Mail submissions, and blog engagement milestones.

- [ ] Prepare operations and moderation basics.
- [x] Define admin-side query patterns for reviewing comments and messages in Supabase.
- [x] Document how email notification secrets are configured and rotated.
- [x] Define failure behavior when database or email service is unavailable.

## Phase Two Verification

- [x] Verify local development bootstraps successfully in the chosen runtime.
- [x] Verify database migrations or schema setup can be applied reproducibly.
- Note: remote Supabase schema is now applied and verified through `npm run db:verify`.
- [x] Verify each API path with valid and invalid payloads.
- [x] Verify blog views increment under the intended rules and are displayed correctly.
- [x] Verify likes update correctly and duplicate-like protection behaves as designed.
- [x] Verify comments are written with the correct moderation status and rendered according to visibility rules.
- [x] Verify anonymous messages are stored in the database and no longer depend on browser `localStorage`.
- [x] Verify email notifications send successfully in the success path and degrade clearly in failure cases.
- [x] Verify analytics event hooks fire for the required page interactions.
- [ ] Compare the updated behavior against the current phase-one baseline to ensure no page regresses structurally.

## Phase Two Execution Notes

- Completed with minimal migration: added `package.json`, `.env.example`, `server/dev-server.js`, `lib/api-router.js`, `lib/services/store.js`, `lib/services/notify.js`, `lib/services/supabase.js`, and `supabase/schema.sql`.
- Front-end wiring now uses `/api/posts/*`, `/api/messages`, and `/api/analytics` from `scripts/site.js`.
- `mail.html` was updated to reflect the backend-backed flow.
- Current verification uses live Supabase storage and Resend notification with local secrets from `.env`.
- Local validation passed on dedicated ports during verification because `3000` had already been occupied by an earlier static server.
- Real Resend notification test passed with the provided API key and notify address.
- Real Supabase connection, schema verification, post metrics seed, view count, like count, pending comment write, anonymous message write, analytics write, and Resend notification all passed.
- Added `npm run db:verify` and `npm run db:seed` so schema presence and initial post metrics can be checked reproducibly after the SQL is applied.
- Added same-origin checks, per-visitor in-memory rate limits, and hidden honeypot fields for comments and anonymous messages.
- Added `supabase/admin-queries.sql` for reviewing messages, moderating comments, and inspecting metrics/events.

## Phase Two Blockers

- None for local phase-two backend verification.
- Remaining operational action: rotate exposed Supabase and Resend keys after development verification.

## Phase Two Risks

- [ ] The current repository is a static HTML/CSS/JS MVP, so phase two likely requires a framework/runtime migration before PRD-aligned backend work can start cleanly.
- [ ] Email delivery adds secrets and third-party dependency management, which raises approval and operational requirements.
- [ ] Analytics, likes, and comments are abuse-prone and need anti-spam controls early rather than as an afterthought.
- [ ] If route structure or post identity changes during migration, analytics and content linkage can become inconsistent.

## Phase Three Goal

- [ ] Build a private admin UI for managing blog metrics, anonymous messages, email replies, and blog publishing through Supabase-backed data.
- Status: implementation in progress. Admin auth, metrics, messages, message replies, blog CMS CRUD, image upload, and public published-post reads are implemented and locally verified against Supabase.

## Phase Three Constraints

- [ ] Keep the current public site stable while adding admin capabilities.
- [ ] Do not expose Supabase service keys or Resend keys to any browser-side admin code.
- [ ] Add authentication before exposing private admin data.
- [ ] Keep the backend lightweight; do not rewrite the whole app unless a specific task requires it.
- [ ] Prefer small schema extensions over replacing the existing phase-two schema.
- [ ] Maintain a clear separation between public APIs and private admin APIs.

## Phase Three Acceptance Criteria

- [ ] Admin can view each blog article with views, likes, comment count, latest activity, and engagement rate.
- [ ] Admin can view anonymous Mail messages from Supabase.
- [x] Admin can reply to a message from the backend through Resend and record the reply history.
- [x] Visitors can optionally leave an email address in Mail so the admin can reply directly.
- [x] Admin can mark messages as `new`, `read`, `replied`, or `archived`.
- [x] Admin can create, edit, preview, publish, unpublish, and archive blog posts.
- [x] Public Blog page loads published posts from Supabase instead of hardcoded `scripts/posts.js` data.
- [x] Public article detail page renders database-backed article content and keeps metrics/likes/comments working.
- [x] Admin actions are protected, validated, logged, and verified end to end.

## Phase Three Planner

- [ ] Audit current public Blog data flow in `scripts/posts.js` and `scripts/site.js`.
- [ ] Audit existing tables: `post_metrics`, `post_view_events`, `post_like_events`, `comments`, `messages`, and `analytics_events`.
- [ ] Decide admin route shape, recommended minimal route: `/admin.html`.
- [ ] Decide admin authentication model before implementation.
- [ ] Recommended default: single-owner admin password stored server-side in `.env` as `ADMIN_PASSWORD`, with HTTP-only admin session cookie.
- [ ] Define private admin API namespace, recommended route prefix: `/api/admin/*`.
- [ ] Define schema extensions for posts, message replies, admin sessions/action logs, and optional assets.
- [x] Confirm whether blog cover images should initially use URL fields only or Supabase Storage uploads.
- Decision: blog image upload is required in this phase. Use Supabase Storage for uploaded images and store the resulting public/signed URL in `cover_url`.

## Phase Three Plan

- [ ] Add admin authentication.
- [x] Add `ADMIN_PASSWORD` to `.env.example` as an empty placeholder.
- [x] Implement `POST /api/admin/login`, `POST /api/admin/logout`, and `GET /api/admin/session`.
- [x] Store admin session in an HTTP-only cookie.
- [x] Add same-origin checks and rate limits for admin login.
- [x] Ensure implemented `/api/admin/*` routes require a valid admin session.

- [ ] Extend the Supabase schema.
- [x] Add `blog_posts` table with `slug`, `title`, `excerpt`, `category`, `cover_url`, `content`, `status`, `published_at`, `created_at`, and `updated_at`.
- [x] Add `message_replies` table with `message_id`, `reply_to`, `subject`, `body`, `resend_email_id`, `sent_at`, and `created_at`.
- [x] Add optional `reply_email` field to `messages` for visitor-provided reply addresses.
- [x] Add `admin_action_logs` table with `action`, `target_type`, `target_id`, `metadata`, and `created_at`.
- [x] Add `blog_assets` table for uploaded image metadata: `id`, `post_id`, `storage_bucket`, `storage_path`, `public_url`, `alt_text`, `created_at`.
- [x] Create Supabase Storage bucket for blog uploads, recommended bucket name: `blog-assets`.
- [x] Define Storage policy so public readers can view published assets while writes happen only through server-side admin APIs.
- [x] Consider `blog_assets` only if uploads are required in this phase; otherwise keep `cover_url` as a URL/path field.
- Decision: image upload is in scope. `cover_url` remains on `blog_posts`, backed by `blog_assets` and Supabase Storage.
- [x] Create indexes for post status/published date, message status/date, and reply message lookup.
- [x] Add SQL seed to migrate current `scripts/posts.js` articles into `blog_posts`.

- [ ] Build private admin APIs.
- [x] `GET /api/admin/metrics/posts`: return post metrics plus derived engagement fields.
- [x] `GET /api/admin/messages`: list messages with filters for status and search.
- [x] `GET /api/admin/messages/:id`: show message detail and reply history.
- [x] `POST /api/admin/messages/:id/reply`: send a Resend reply and write `message_replies`.
- [x] Reject admin replies when the target message has no valid `reply_email`.
- [x] `PATCH /api/admin/messages/:id`: update message status.
- [x] `GET /api/admin/posts`: list all posts including draft and archived posts.
- [x] `POST /api/admin/posts`: create a draft post.
- [x] `PATCH /api/admin/posts/:id`: edit post metadata/content/status.
- [x] `POST /api/admin/posts/:id/publish`: publish a post and ensure `post_metrics` exists.
- [x] `POST /api/admin/posts/:id/archive`: archive a post without deleting metrics/history.
- [x] `POST /api/admin/uploads/blog-image`: upload blog images through the server to Supabase Storage and return `public_url`.

- [ ] Build the admin UI.
- [x] Add `admin.html` with login state and private dashboard shell.
- [x] Add dashboard overview cards: total views, likes, messages, pending comments, published posts.
- [x] Add Blog Metrics section: per-post table with views, likes, comments, engagement rate, and latest activity.
- [x] Add Messages section: inbox list, message detail, status controls, reply composer, and reply history.
- [x] Show whether a message is replyable based on the visitor-provided email.
- [x] Add Blog Editor section: post list, editor form, preview pane, status controls, and publish/archive actions.
- [x] Blog editor should use plain Markdown textarea plus preview, not a heavy rich-text editor.
- [x] Add image upload control in the Blog Editor and insert uploaded image URLs into Markdown or `cover_url`.
- [x] Add clear loading, empty, success, and error states.
- [x] Keep admin styling scoped so it does not destabilize public page styles.

- [ ] Move public blog content to Supabase.
- [x] Add public API `GET /api/posts` to return published posts.
- [x] Add public API `GET /api/posts/:slug` to return one published post.
- [x] Update `scripts/site.js` to load posts from `/api/posts` with a fallback to `window.BLOG_POSTS` if the API fails.
- [x] Treat Supabase `blog_posts` as the source of truth for public Blog content once verified.
- [x] Keep metrics, likes, and comments tied to stable `post_slug`.
- [x] Verify existing URLs like `blog.html?slug=agent-workflow-notes` continue to work.

- [ ] Add operational safeguards.
- [x] Log all admin writes to `admin_action_logs`.
- [ ] Never hard-delete posts, messages, replies, comments, or metrics by default.
- [x] Add input length limits for blog title, slug, excerpt, content, reply body, and cover URL.
- [x] Validate slugs to lowercase URL-safe strings.
- [x] Prevent publishing posts without title, slug, excerpt, and content.
- [x] Use `edisonxu0909@gmail.com` as the sender/reply identity for admin message replies where provider configuration allows it.
- [x] Add optional visitor email field to the public Mail form with clear copy: email is only needed if they want a reply.
- [x] Validate visitor email format server-side before storing `reply_email`.
- [x] Prevent replying to messages without a valid recipient email.
- [ ] Document manual recovery queries in `supabase/admin-queries.sql`.

## Phase Three Verification

- [x] Verify unauthenticated users cannot access `/api/admin/*`.
- [x] Verify admin login succeeds with the configured password and sets an HTTP-only session cookie.
- [x] Verify admin logout clears the session.
- [x] Verify Blog Metrics dashboard matches Supabase `post_metrics`.
- [x] Verify Mail inbox pulls real `messages` rows from Supabase.
- [x] Verify replying through admin sends a Resend email and creates a `message_replies` row.
- [x] Verify public Mail can submit with and without optional visitor email.
- [x] Verify admin reply is enabled only when `reply_email` exists.
- [x] Verify admin image upload stores the file in Supabase Storage and writes `blog_assets` metadata.
- [x] Verify uploaded images render correctly in Blog preview and public published posts.
- [x] Verify message status updates are persisted.
- [x] Verify admin can create a draft blog post.
- [x] Verify admin can edit and preview a draft post.
- [x] Verify publishing a post makes it visible on the public Blog page.
- [x] Verify archiving/unpublishing hides a post from the public Blog page without deleting data.
- [x] Verify public Blog list/detail still load if Supabase is temporarily unavailable by using the existing fallback.
- [x] Verify all admin write actions are present in `admin_action_logs`.
- [x] Run `npm run db:verify`, `npm run db:seed`, and a local smoke test after changes.

## Phase Three Execution Notes

- Added `admin.html`, `scripts/admin.js`, and server-side admin auth helpers.
- Added `POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/session`, `GET /api/admin/metrics/posts`, and `GET /api/admin/messages`.
- Added public `GET /api/posts` and `GET /api/posts/:slug` with fallback content until `blog_posts` schema is applied.
- Added `reply_email` handling in Mail form payload and server validation.
- Added `supabase/phase-three-schema.sql`; it has been applied and verified in Supabase for blog publishing, image uploads, and reply history.
- Applied and verified Phase Three schema in Supabase: `blog_posts`, `message_replies`, `admin_action_logs`, `blog_assets`, `messages.reply_email`, and `blog-assets` Storage bucket.
- Implemented admin message detail, status updates, Resend replies, reply history, blog post CRUD, publish/archive, Markdown preview, and Supabase Storage image upload.
- Verification used local port `3130` with temporary admin env values because `.env` is still missing `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET`.

## Phase Three Risks

- [ ] Admin authentication is security-sensitive; private endpoints must not rely on front-end-only checks.
- [ ] Moving blog content from hardcoded JS to Supabase changes the public content source and can break existing URLs if slug handling is wrong.
- [ ] Email reply requires a reliable recipient address; current anonymous messages do not collect sender email, so direct reply requires adding optional email input to Mail.
- [ ] Resend sender identity may require domain verification. If Gmail cannot be used directly as `from`, use verified Resend sender and set `reply_to` to `edisonxu0909@gmail.com`.
- [ ] Blog image upload requires Supabase Storage policy design and file validation for size/type.
- [ ] Rich text/Markdown editing can grow scope quickly; start with plain Markdown textarea and preview.
- [ ] The chosen approach intentionally avoids external CMS platforms for now; if content workflow becomes more complex later, reassess Ghost/Sanity/Contentful/Webflow-style CMS options.
- [ ] Exposed keys from earlier development should be rotated before any public deployment.

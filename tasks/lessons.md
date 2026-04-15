# Lessons

## Project-relevant rules

- Rule: Verify the exact task artifact path and file extension before attempting to parse or execute against it.
- Trigger: The user corrected the task input from `website_goal.md` to `website_goal.docx`.
- Preventive action: Use file discovery first, then inspect the actual target file before planning work.

- Rule: Before opening or validating a local preview, verify which process owns the target port and avoid assuming a port belongs to the latest server.
- Trigger: A local preview task ran far longer than expected because old Python/Node servers were still bound to `3000` and `3100`, while the current server was actually on `3120`.
- Preventive action: Check `netstat -ano` or equivalent port ownership first, use a fresh port when needed, and verify `/api/health` belongs to the current server before opening the page.

- Rule: Do not use long-lived server commands with stdout/stderr redirection patterns that may block the tool call in this environment.
- Trigger: `Start-Process` with redirected output started the server successfully but the tool call did not return promptly.
- Preventive action: Start long-lived local servers with a short foreground health-check pattern or a simple background process, then verify with HTTP requests instead of waiting on redirected process output.

- Rule: Admin write actions must show explicit progress, error, and verified-success states instead of assuming that a button click succeeded.
- Trigger: The admin blog workflow allowed image/upload/publish actions to fail or be misunderstood without clear UI feedback, so the user could not tell whether Supabase and the public frontend had updated.
- Preventive action: Wrap admin write handlers in `try/catch`, show operation-specific status text, and verify both database state and public API visibility before displaying publish success.

- Rule: Before admin write actions, explicitly verify the browser admin session and translate authentication failures into actionable UI text.
- Trigger: Publishing from the admin UI returned `Admin authentication required`, which meant the browser did not send a valid admin cookie even though the backend API worked when authenticated.
- Preventive action: Call `/api/admin/session` before protected writes, return the UI to login state when unauthenticated, and tell the user to re-login on the same host/port.

- Rule: Keep authentication entry pages separate from protected admin workspaces when browser session state is part of the failure mode.
- Trigger: The combined admin login/dashboard page made it unclear whether login succeeded, whether the dashboard loaded with a fresh cookie, or whether the user was operating inside a stale page state.
- Preventive action: Use a dedicated login page that redirects after successful login, and make the protected dashboard redirect back to login whenever `/api/admin/session` is not authenticated.

- Rule: When changing browser-side auth flow, bust cached JS and disable local dev caching for HTML/JS responses.
- Trigger: The admin login API succeeded, but the login page could still behave like the old combined login/dashboard page if the browser reused a stale `scripts/admin.js`.
- Preventive action: Add a version query to auth-critical scripts and send `Cache-Control: no-store` from the local dev server.

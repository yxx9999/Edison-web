# Lessons

## Project-relevant rules

- Rule: After the user approves a UI version as the working baseline, do not perform broad redraws, component replacements, or unsolicited visual restructuring.
- Trigger: The user said this version is good and requested future work to be limited to explicit micro-adjustments; suggestions or better solutions must be written as a todo first and executed only after approval.
- Preventive action: For UI refinement tasks, change only the specifically requested target. If proposing a broader improvement, write it to `tasks/todo.md` and wait for explicit approval before implementation.

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

- Rule: When the user asks for the fastest local deployment and preview, start the site and open it first; do not expand into a full test workflow unless requested.
- Trigger: The user clarified “直接部署，打开一下就好” after a broader smoke-test plan had started.
- Preventive action: Treat “本地部署，打开一下” as a preview-only task by default, with only a minimal startup check.

- Rule: In toolbar layouts with a required action button, reserve non-shrinking space for the action first and let long titles wrap within the remaining width.
- Trigger: The blog detail "返回列表" button compressed or wrapped because the title was allowed to take priority in the same row.
- Preventive action: For title/action rows, set the action to `flex: 0 0 <fixed width>` with `white-space: nowrap`, and set the title to `min-width: 0` with wrapping behavior.

- Rule: When designing comment interactions, distinguish between the persistent comment list and the comment writing form; only move the form into a popup when requested.
- Trigger: The user clarified that the article bottom should still show the comment list, while only the writing/comment input area should appear after clicking the write-comment action.
- Preventive action: Before planning comment UI changes, explicitly separate display behavior for existing comments from input behavior for new comments.

- Rule: Treat the Blogs page and blog detail/sub-article pages as an approved baseline; do not modify them unless the user explicitly names those pages for changes.
- Trigger: The user stated that the Blogs page and sub-article pages are perfect and asked to move on to other pages.
- Preventive action: For future tasks, exclude `scripts/html/blog.html`, blog detail rendering in `scripts/site.js`, and blog-specific CSS unless the user explicitly requests Blogs or sub-article page edits.

- Rule: For precise CSS tuning, never replace bare values such as `font-size: 0.88rem` or `top: 18px` across the whole stylesheet.
- Trigger: A start-page slogan adjustment temporarily changed unrelated navigation, button, status, and section spacing styles that happened to share the same numeric values.
- Preventive action: Scope replacements to the exact selector block, then grep for the new value and verify every remaining occurrence is intentional before finishing.

- Rule: For simple local deployment requests, do not run long-lived dev servers in the foreground through the tool.
- Trigger: A local preview task appeared to hang because `npm run dev` was started in the foreground; the command was actually waiting as a server process, while the user only wanted the site deployed and opened quickly.
- Preventive action: Read the project start command, start the server as a background process, verify the expected URL with a minimal HTTP status check, then open the browser. If PowerShell `Start-Process` fails because of duplicated `PATH/Path` environment keys, use a direct Node/background process approach and keep the flow short.

- Rule: Before wiring an image path into HTML, verify the actual file name and extension that exists on disk.
- Trigger: The About avatar was first referenced as `image/about/edison.webp`, but the available user-provided image was `image/about/edison.jpeg`.
- Preventive action: Check the target image directory before editing markup, then use the existing asset path exactly so local preview requests return 200.

- Rule: Do not rewrite Chinese HTML files through PowerShell paths that can change text encoding or corrupt punctuation.
- Trigger: About page markup broke because a PowerShell write path corrupted UTF-8 Chinese punctuation, turning valid closing tags like `</p>` into malformed text such as `??/p>`.
- Preventive action: Before and after editing localized HTML, grep for replacement characters and malformed closing tags, and prefer byte-safe restoration or exact scoped patches over broad `Get-Content` / `Set-Content` rewrites.

- Rule: After any scripted HTML rewrite, immediately verify the target file size is nonzero before continuing with further edits.
- Trigger: An About page image-adaptation script accidentally wrote `scripts/html/about.html` to 0 bytes before the page was rebuilt and verified.
- Preventive action: For future file rewrites, check `(Get-Item <file>).Length`, grep for required structural anchors, and verify the local route returns 200 before making additional changes.

- Rule: When the user corrects a requested layout count, immediately collapse the implementation to that exact count instead of preserving prior structure.
- Trigger: The About Focus section was initially discussed while the old implementation had two cards, and the user clarified that Focus should become one card only.
- Preventive action: For section replacement tasks, restate the final component count before editing and verify the DOM contains only that count after the change.

- Rule: After adding browser-side UI initialization code, verify that the initializer is actually invoked by the page boot sequence.
- Trigger: The About Focus CN/EN toggle function was defined in `scripts/site.js` but not called, so the CN button had no click behavior.
- Preventive action: For every new UI handler, grep for both the function definition and its initialization call, then verify the DOM state changes after a simulated or browser click.

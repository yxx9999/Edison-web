Project Rules

This is Edison Xu's personal website. The site should feel like a personal operating system for a young founder, builder, and media creator working in the AI-native era.

Do not treat this website as a generic portfolio, resume site, SaaS landing page, or corporate homepage.

General Engineering Rules
Do not change business logic unless the user explicitly asks.
Do not change routes, data models, or core architecture unless required.
Do not add new dependencies without explaining why they are necessary.
Prefer small, focused changes over large rewrites.
Preserve existing working functionality.
After making changes, run the available lint/build/test commands when possible.
If a command fails, report the failure clearly and explain what was changed.
UI / Design Rules

For any UI, layout, visual, styling, typography, color, animation, image, or component-polishing task, first read:

docs/design-system.md
skills/personal-website-ui-polisher/SKILL.md
skills/personal-website-ui-polisher/lessons.md if it exists

All UI work must follow the design system unless the user explicitly overrides it.

Core visual direction:

White, black, gray create restraint and premium feeling.
Electric blue creates brand recognition.
Pulse cyan is only used for interaction feedback.
IBM Plex Mono creates digital/systematic identity.
Apple system font stack ensures readability.
Body text uses 12px as the default content-reading size unless a specific component needs a documented exception.
Subheadings use the Apple system font stack at 28px, 700 font weight, and inherit the surrounding text color unless a specific component needs a documented exception.
Images should default to grayscale or low-saturation treatment and may activate into blue stylized states on hover or active interaction.
Each page should have at most 1–2 strong electric-blue focal points.
Design Change Policy

When editing UI:

Keep the visual system consistent.
Do not over-decorate.
Do not overuse cards, gradients, shadows, or animations.
Do not use large blue backgrounds.
Do not use cyan as a primary brand color.
Do not make every section visually loud.
Prioritize whitespace, typography, hierarchy, and image treatment.

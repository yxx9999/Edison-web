---
name: personal-website-ui-polisher
description: Use this skill when improving, polishing, refactoring, or implementing UI design for Edison Xu's personal website. This includes visual design, layout, typography, color, spacing, image treatment, hover states, responsive behavior, and component styling. Do not use this skill for backend logic, data modeling, routing, API work, or non-visual feature development.
---

# personal-website-ui-polisher

## Purpose

This skill turns the Edison personal website design system into executable UI changes.

The goal is not to create a generic portfolio website. The goal is to create a restrained, sharp, digital, editorial, AI-native personal website with a strong sense of personal operating system.

## Required Reading

Before making UI changes, read:

1. `docs/design-system.md`
2. `skills/personal-website-ui-polisher/lessons.md` if it exists
3. The relevant page/component files that will be edited

Do not start editing before understanding the design system.

## Core Design Direction

The website should feel:

* Minimal
* Restrained
* Premium
* Digital
* Experimental
* Systematic
* Founder-like
* AI-native

It should not feel:

* Generic portfolio
* Corporate website
* SaaS template
* Over-decorated
* Colorful
* Trend-chasing
* Heavy-card dashboard

## Visual System Summary

Use the following principles:

1. Background uses `#F5F5F5`.
2. Primary text uses `#131313`.
3. Secondary text uses `#5F5F5F`.
4. Borders and dividers use `#DADADA`.
5. Electric Blue `#0909E2` is used only for brand emphasis, hero headlines, page headlines, nav links, key numbers, primary CTA, and a few decorative accents.
6. Pulse Cyan `#27D7C7` is used only for hover, active, focus, and interaction feedback.
7. Each page should contain at most 12 strong Electric Blue visual focal points.
8. Avoid large blue backgrounds.
9. Avoid using cyan as a brand color.

## Typography Rules

Use a two-typeface system:

### Display Typeface

Use `IBM Plex Mono` for:

* Logo mark
* Navbar
* Hero headline
* Page headline
* Section label
* Project index
* Key numbers
* Metadata
* CTA label

Display Typeface is responsible for being remembered.

### Text Typeface

Use Apple system font stack for:

* Body text
* Subheadline
* Secondary text
* Caption
* Project summary
* Article excerpt
* Footer text
* Form label
* Long-form writing

Text Typeface is responsible for being understood.

## Image Treatment Rules

1. Images should default to grayscale or low saturation.
2. Do not use raw high-saturation images by default.
3. People images, project images, and screenshots should be visually unified.
4. Hover or active states may activate Electric Blue stylized effects.
5. Important people or projects may use blue silhouette, halftone, duotone, or mask cutout treatment.
6. Images are visual evidence, not decoration.

## Workflow

When asked to improve UI:

1. Inspect the current page/component.
2. Identify which parts violate the design system.
3. Make a short implementation plan.
4. Apply the smallest set of changes needed.
5. Preserve functionality, routes, and data behavior.
6. Check responsive behavior.
7. Run build/lint/test commands when available.
8. Summarize what changed and what still needs review.

## Priority Order

When improving a page, prioritize in this order:

1. Layout and information hierarchy
2. Typography scale
3. Spacing and whitespace
4. Color usage
5. Image treatment
6. Component states
7. Micro-interactions
8. Responsive behavior

Do not start with animations or decorative effects.

## Forbidden

Do not:

1. Rewrite the whole site unless explicitly asked.
2. Change business logic.
3. Change routing.
4. Add heavy UI libraries without approval.
5. Add random gradients.
6. Add large shadows.
7. Overuse cards.
8. Use too many colors.
9. Use blue everywhere.
10. Use cyan as the main brand color.
11. Turn the site into a generic SaaS landing page.
12. Make all text IBM Plex Mono.
13. Use display typography for long-form reading.
14. Make body text larger than intended headline levels.
15. Ignore `docs/design-system.md`.

## Output Expectations

After UI changes, report:

1. Files changed.
2. What visual system rules were applied.
3. Any trade-offs or uncertain points.
4. Whether build/lint/test passed.

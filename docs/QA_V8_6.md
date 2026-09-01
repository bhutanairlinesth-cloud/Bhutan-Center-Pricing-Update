# Bhutan Center V8.6 — Public Layout QA

## What was fixed

The V8.5 screenshots exposed structural CSS regressions rather than simple spacing issues. Several public Home sections were using class names that only had responsive fragments or hover effects, with no desktop layout definition.

Restored desktop/tablet/mobile layout for:
- Why Bhutan Center (`philosophy-*`)
- Everything in One Place (`service-grid`)
- Bhutan Airlines feature (`airline-feature-*`, `route-line`)
- Discover Bhutan (`city-list`, `city-row`)
- Home planner (`planner-card`, `planner-copy`)
- Compact booking submit placement

Motion was also changed so it never hides a whole `<section>`. Reveal animation is now applied only to contained blocks/cards.

## Static audit
- Public TSX files scanned: 23
- Static public class names checked: 165
- Public class names without any CSS selector after fix: 0
- CSS parse errors: 0
- GitHub web-upload unsafe bracket paths: 0

## Deployment note
The execution environment used for this repair could not complete `npm install` within its network timeout, so the final Vercel build should still be treated as the authoritative Next.js build check after upload.

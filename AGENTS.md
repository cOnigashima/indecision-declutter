# AGENTS.md

## Product Rule

不断捨離 is built around one principle: **決断しないで、退避する**.

Use `docs/design/design_handoff_indecision_declutter` as the source of truth for visual design, copy, interaction flow, and screen count. The `.dc.html` files are reference prototypes only; do not copy their HTML into production code.

## Implementation Rules

- Build the product app in React Native / Expo from the root project.
- Keep the legacy Vue/PWA implementation under `legacy/vue-pwa/` for reference only.
- Use React Navigation for routing. Candidate/discarded are bottom tabs; detail/edit/discarded detail are stack pushes; photo viewer and release confirmation are modals.
- Keep visual constants in `src/theme/tokens.ts`. Do not scatter one-off colors or font names through screens.
- Use the terms from the design handoff: prefer **退避** over 保存, and treat 手放し as **変容**, not deletion.
- Use blue/open enso for evacuation, gray enso for release confirmation, and red/closed enso for release completion.
- Keep icon-grade PNGs in `assets/`; use lighter UI PNGs in `src/assets/`. Do not replace brush enso images with auto-traced SVG unless there is an original vector source.
- Do not add backend or cloud storage unless explicitly requested. The app should remain local-first.

## Visual QA

- Check the app against the 375x812 iPhone-sized design comps.
- Preserve the key layout anchors: washi background, 2-column cards, center camera FAB, full-page detail screens, and full-screen ritual modals.
- Avoid generic marketing screens. The first screen should be the usable candidate/discarded app shell.

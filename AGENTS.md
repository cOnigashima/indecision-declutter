# AGENTS.md

## Product Rule

不断捨離 is built around one principle: **決めずに、写しを収める。**

Use `docs/PHILOSOPHY.md` (design language: tone, color, enso) and `docs/specs/product-spec.md` (per-screen spec) as the source of truth for visual design, copy, interaction flow, and screen count. Color/font values live in `src/theme/tokens.ts`; enso rendering requirements in `openspec/specs/enso-motif/spec.md`. The original hi-fi comps (`.dc.html`) remain in git history at commit `4190750` for reference only; do not copy their HTML into production code.

## Implementation Rules

- Build the product app in React Native / Expo from the root project.
- Use React Navigation for routing. Candidate/discarded are bottom tabs; detail/edit/discarded detail are stack pushes; photo viewer and release confirmation are modals.
- Keep visual constants in `src/theme/tokens.ts`. Do not scatter one-off colors or font names through screens.
- Use the terms defined in `docs/PHILOSOPHY.md` / `product-spec.md`: the capture action is **写しを収める**, the user-facing candidate space is **縁側**, and **手放す→捨離** remains a transformation, not deletion. Keep `candidate` / `discarded` as internal identifiers.
- Use blue/open enso for a stored copy whose decision remains open on the 縁側, gray enso for 手放し confirmation, and red/closed enso for 手放し completion into 捨離.
- Keep icon-grade PNGs in `assets/`; use lighter UI PNGs in `src/assets/`. Do not replace brush enso images with auto-traced SVG unless there is an original vector source.
- Do not add backend or cloud storage unless explicitly requested. The app should remain local-first.

## Visual QA

- Do visual QA at the 375x812 iPhone-sized viewport.
- Preserve the key layout anchors: washi background, 2-column cards, center camera FAB, full-page detail screens, and full-screen ritual modals.
- Avoid generic marketing screens. The first screen should be the usable candidate/discarded app shell.

# Mobile Migration Spec

## Summary

Migrate 不断捨離 from the legacy Vue/PWA implementation to a root Expo / React Native app. The visual and interaction source of truth is `docs/PHILOSOPHY.md` (design language) and `docs/specs/product-spec.md` (per-screen spec); the original hi-fi comps remain in git history at commit `4190750`.

The first slice established the app skeleton: Expo runtime, routing, design tokens, fonts, enso assets, and placeholder screens for the full 11-screen flow. The second slice adds local SQLite persistence plus the camera/photo storage loop.

## Initial Slice

- Expo SDK 57 + TypeScript at repo root.
- Dev server scripts use port `8704`.
- React Navigation structure:
  - Bottom tabs: `CandidateList`, `DiscardedList`
  - Stack screens: `Capture`, `ItemDetail`, `ItemEdit`, `DiscardedDetail`, `EvacuationComplete`, `ReleaseComplete`
  - Modal screens: `PhotoViewer`, `ReleaseConfirm`
- Domain item shape:
  - `id`, `name`, `photos`, `coverIndex`, `urgency`, `status`, `blockers`, `memoryNote`, `price`, `lastUsedAt`, `location`, `createdAt`, `updatedAt`, `releasedAt`
- Design tokens live in `src/theme/tokens.ts`.
- Blue and red enso PNG assets live in `assets/` for app config and `src/assets/` for UI. Keep app-config images at 1024px when needed for icons; keep UI images at 512px unless a larger rendered size is introduced.
- SVG conversion is deferred until original vector artwork exists. Auto-tracing the brush enso images is not expected to improve fidelity or maintenance.
- SQLite persistence lives in `src/lib/db.ts`, with `items` and `item_photos` tables.
- Captured photos are compressed to JPEG and copied into `FileSystem.documentDirectory/indecision-photos/` via `src/lib/photoStorage.ts`.
- App data is exposed through `src/state/ItemsContext.tsx`.
- The pre-migration Vue/PWA files remain in git history (recoverable from commit `4190750`); they are no longer in the working tree.

## Deferred Slices

1. Full edit form coverage for price, location, last-used date, blockers, and photo removal/reorder.
2. Gesture-based carousel/photo viewer and photo reorder.
3. Undo affordances for release and evacuation.
4. Pixel-pass against the design language (`docs/PHILOSOPHY.md` / `docs/specs/product-spec.md`) on iPhone-sized viewport.

## Acceptance For This Slice

- `npm run typecheck` succeeds.
- `npm run start` starts Expo on port `8704`.
- Candidate/discarded tabs render with the custom center camera FAB.
- FAB opens capture.
- Capture can take one or more photos, store them locally, and create a SQLite item.
- Candidate/discarded lists read from SQLite.
- Detail opens edit, viewer, adds photos, and opens release confirmation.
- Release confirmation updates SQLite status, opens release complete, and returns to discarded.
- Discarded detail can restore an item to candidates.
- Evacuation complete returns to capture.

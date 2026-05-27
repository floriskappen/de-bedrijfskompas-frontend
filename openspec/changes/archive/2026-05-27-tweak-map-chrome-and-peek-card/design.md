## Context

Small post-hoc design pass on the map page after the new pipeline-fetched data landed. The data now carries `favicon_url`, the bottom hint felt redundant on a screen whose only affordance is tapping a pin, and a desktop user reported a glitch where mousing over a cluster moved it.

## Goals / Non-Goals

**Goals:**
- Use the favicon when available so the peek card identifies the company more concretely than a single-letter monogram can.
- Reduce chrome noise: the bottom hint stated the obvious and competed visually with the map.
- Make cluster markers stable under mouse hover.

**Non-Goals:**
- A full identity-system overhaul. The monogram tile stays as fallback; we're not designing a logo treatment.
- Adding configuration for "show / hide bottom hint" — it's gone, full stop.
- Touching the data contract; `favicon_url` was already there, we just typed it.

## Decisions

**Favicon-with-monogram-fallback, error-driven swap.**
Render an `<img>` inside a paper-card-style tile when `favicon_url` is present; on `onError`, flip a `faviconFailed` state and fall back to the existing ink monogram tile. Alternative: pre-validate the URL at build time. Rejected — would mean an extra fetch per company per build and bake in liveness state that goes stale. Letting the browser fail gracefully is cheaper and self-healing.

**Reset `faviconFailed` on selection change.**
The error flag is per-mounted-card; each new selection starts optimistic so a broken favicon on one company doesn't suppress favicons on the next. Reset happens in the same effect that syncs `selectedId` → `displayedId`.

**Inline `<img>` not CSS `background-image`.**
`<img>` gets the browser's intrinsic error handling for free; background-image needs an `Image()` probe to know when to fall back. The intrinsic `onError` is exactly what we need.

**Drop the bottom hint outright rather than gating it.**
The hint shipped pre-clustering, when "this is a map you tap" wasn't obvious. With clustering numerals and a peek card on every tap, the hint is doubly redundant. A feature flag for "experiment with hint copy later" would be premature.

**Fix the cluster hover by mirroring the pin pattern.**
Mapbox writes a raw `transform: translate(...)` on the marker root to position it. Tailwind's `hover:scale-105` composes into the same `transform` property, overwriting the translate when the hover variant matches — the cluster snaps to `(0,0)` and back. The pin code already separates marker root (Mapbox-owned transform) from inner visual (user-owned transforms); clusters now do the same. No CSS-only fix would be as robust because any future hover/active utility on the root would re-introduce the bug.

## Risks / Trade-offs

- **[Hot-linking favicons]** → We reference `favicon_url` directly. Most sites allow it (we set `referrerPolicy="no-referrer"` to be polite), and the fallback covers blocked ones. If we later see widespread blocking, mirror the assets in the pipeline.
- **[Spec drift from rapid frontend iteration]** → This change is retroactive, which is the smell. Mitigation: keep map-overview's chrome section short and stop listing examples by name (the visual-design-system scenario was over-specific).
- **[Cluster fix is invisible to tests]** → The bug only manifests with a real Mapbox-managed transform. The fix follows an established pattern (pin markers) so it doesn't need its own regression test; verification was manual hover.

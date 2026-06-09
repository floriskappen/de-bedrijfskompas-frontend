## design rework — done

Both active changes (`switch-to-three-level-axes`, `add-local-favorites`) are
implemented and reworked for design quality.

three-level axes:
- shared three-bar focus meter replaces the level *text* on the detail rows and
  as the filter sheet's selected minimum ("≥ … focus" = at least this much).
- filter axis row: "?" is now a small utility link beside the axis name; the
  histogram+slider became a four-column level strip whose columns align with the
  bars, so dragging past a bar flips the minimum on its edge (no dead zone).
- the favorites-filter placeholder moved out of this change into the favorites one.

local favorites:
- favorites-only is a switch at the top of the sheet (not a chip); the in-sheet
  overview link is gone (favorites open from the map chrome star).
- saved companies carry an accent star on their map tag.
- favorites cards: calm paper surface + per-axis focus-meter compass summary,
  no more cumulative score badge or text tags.

verification: vitest (67) + astro build green; Playwright detail/favorites/
map-overview suites green (incl. new none-column-reset, pin-mark, and
favorites-meter tests).

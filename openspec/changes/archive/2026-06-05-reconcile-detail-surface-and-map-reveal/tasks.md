## 1. Detail page surface

- [x] 1.1 Add a `.surface-warm-grain` utility in `src/styles/global.css` mirroring the peek card's `.ontwerp-card.is-warm` background (`--filter-surface` + `paper-grain-soft.svg` at 600px)
- [x] 1.2 Apply the class to `<main>` in `src/pages/[slug].astro` and `src/pages/en/[slug].astro`, replacing `bg-paper-warm`

## 2. Map reveal skip on bloom return

- [x] 2.1 In `src/lib/transitions/bloom-curtain.ts`, set `sessionStorage` `bloom-nav` when the navigation destination resolves to a map route (`/` or `/en/`), guarded by try/catch
- [x] 2.2 Add a synchronous `is:inline` script above the reveal surface in `src/components/MapPage.astro` that reads and clears `bloom-nav`, toggling `skip-map-reveal` on `<html>` before paint
- [x] 2.3 Add `.skip-map-reveal .map-reveal-surface::before/::after { content: none; animation: none; }` in `src/styles/global.css`

## 3. Verification

- [ ] 3.1 Browser-driven check: direct visit / reload of `/` and `/en/` still plays the stepped paper reveal (covers "Direct entry reveals from paper")
- [ ] 3.2 Browser-driven check: detail back control returns to the map with no reveal animation and no flash of the cover (covers "Return from detail skips the reveal")
- [ ] 3.3 Browser-driven check: the detail page background matches the peek card surface colour and grain in both locales (covers "Detail background matches the peek card surface")
- [ ] 3.4 Confirm deep-link `?selected=<id>` still selects and opens the peek card after a direct entry (covers "Deep-link state survives the reveal")

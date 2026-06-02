## 1. Page Shell

- [x] 1.1 Add a stable reveal hook/id/class to the full-screen `MapPage.astro` root so the animation applies to the complete map surface.
- [x] 1.2 Ensure the reveal hook is present on `/`, `/en/`, and empty-data test routes because they all use the shared map page.

## 2. Reveal Styling

- [x] 2.1 Add short stepped paper-cover reveal keyframes in `src/styles/global.css` using overlay opacity/mask animation.
- [x] 2.2 Keep the overlay non-interactive and ending invisible so the reveal settles into the normal interactive map surface.
- [x] 2.3 Add `prefers-reduced-motion: reduce` rules that render the shell directly in its final state with no reveal animation.

## 3. Browser Coverage

- [x] 3.1 Add Playwright test `initial map reveal starts from paper cover` covering the spec scenario "First load reveals from paper" on `/` and `/en/`.
- [x] 3.2 Add Playwright test `reduced motion skips initial map reveal` covering the spec scenario "Reduced motion skips the reveal".
- [x] 3.3 Extend or add Playwright test `deep-link opens peek card through initial reveal` covering the spec scenario "Deep-link state survives the reveal".

## 4. Verification

- [x] 4.1 Run `npm run test:e2e` or the focused `tests/map-overview.spec.ts` suite.
- [x] 4.2 Run `npm run test`.
- [x] 4.3 Manually review the reveal timing on `/` and `/en/` to confirm it feels short, stepped, and not visually smooth.

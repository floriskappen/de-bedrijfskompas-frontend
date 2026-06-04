## 1. Peek card structure & interaction

- [x] 1.1 Reorder the card to pentagon → identity (favicon/monogram + name + locality/distance) → plain tagline; remove the "in het echt"/"in real life" callout label and wash
- [x] 1.2 Make the whole card the affordance: `role="button"`, tabindex 0, `aria-label` naming the CTA; tap or Enter/Space navigates to the detail route (locale + slug preserved)
- [x] 1.3 Make the whole card the drag surface with tap/drag disambiguation (>~4px move = drag); drag-down past ~⅓ closes, short drag snaps back, up-drag stiff and capped
- [x] 1.4 Add the top-right close (✕) button beside the bookmark; both buttons stop pointer propagation so they neither drag nor navigate; add `close_label` strings (nl/en)
- [x] 1.5 Pad the peek-card overlay so the floating card has air on all sides; apply `.peek-card-float` (radius + drop shadow) and `--color-surface-page` background

## 2. Basemap

- [x] 2.1 Remove `applyPaperMapStyle` and its `map.on("load", …)` call from `MapView.tsx`; leave the stock Mapbox "light" style
- [x] 2.2 Drop the now-unused `--map-*` palette vars; retint `.map-atmosphere` to the accent-soft + surface bloom and refresh the stale CSS comments

## 3. Verification

- [x] 3.1 Update `tests/map-overview.spec.ts` for the new peek card: replace the "open full profile" CTA-link test with a whole-card tap that opens `/en/<id>/` (asserts `role="button"`); repoint the action-buttons test to bookmark + ✕ and the `rgb(242, 231, 231)` page surface; add a close-button-clears-selection-without-navigating test ("peek card content" + "detail navigation" scenarios)
- [x] 3.2 Run unit suite (`vitest run`) — design-system + filters + data-shape tests pass; the redesign touches no validation/data code. (2 failures in `index.test.ts` are pre-existing: local `companies.json` is rejected by the tag-family validator and drops every company — unrelated to this change.)
- [ ] 3.3 Run the Playwright e2e suite to exercise the updated peek-card/basemap specs in a real browser — BLOCKED locally: the same stale `companies.json` drops `land-life-company`, so the peek-card flows can't render. Run once fresh pipeline data is available.
- [ ] 3.4 Manual browser pass on drag feel (down-to-close threshold, stiff/​capped up-drag) and basemap bloom — not yet done; gated on the same data refresh.

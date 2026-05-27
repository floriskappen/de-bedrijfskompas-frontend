## 1. Data type

- [x] 1.1 Add optional `favicon_url?: string` to `Company` in `src/lib/company-data/types.ts`

## 2. Peek card favicon

- [x] 2.1 Render an `<img>` favicon tile in `PeekCard.tsx` header when `favicon_url` is present
- [x] 2.2 Fall back to the existing ink monogram tile when `favicon_url` is absent or on image-load error (state flag, reset on selection change)

## 3. Remove bottom hint

- [x] 3.1 Delete `src/components/BottomHint.tsx`
- [x] 3.2 Remove the `BottomHint` import + usage from `src/components/MapPage.astro`
- [x] 3.3 Remove the `hint_template` keys from both locales in `src/lib/i18n/messages.ts`

## 4. Cluster hover bug

- [x] 4.1 Move cluster marker visual styling (incl. `hover:scale-105 active:scale-95`) onto an inner element inside `MapView.tsx`, leaving the Mapbox-managed marker root bare (covers desktop hover glitch)

## 5. Verification

- [x] 5.1 `npm run build` passes
- [x] 5.2 `npm test` still passes (18/18)
- [x] 5.3 Manual: favicon renders on a company with `favicon_url`, monogram on one without; cluster no longer jumps on hover

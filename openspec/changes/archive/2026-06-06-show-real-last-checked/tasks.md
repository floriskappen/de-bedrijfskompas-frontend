## 1. Data type

- [x] 1.1 Add optional `created_at?: string` and `updated_at?: string` (ISO 8601) to the `Company` interface in `src/lib/company-data/types.ts`; confirm `validate()` passes them through unchanged (no new required-field check).

## 2. Relative-time helper

- [x] 2.1 Add a helper (e.g. `src/lib/company-data/last-checked.ts`) that takes an ISO string + locale and returns a localized relative time via `Intl.RelativeTimeFormat`, picking the coarsest sensible unit (minute → year); returns `null` for an absent/unparseable value.

## 3. Detail footer

- [x] 3.1 In `CompanyDetail.tsx`, derive the footer from `company.updated_at` using the helper; render `"{last_checked} {relativeTime}"` when present, and omit the footer entirely when the helper returns `null`.
- [x] 3.2 Change the `last_checked` copy in `src/lib/i18n/messages.ts` to the prefix word only ("gecheckt" / "checked"), lowercase.

## 4. Tests

- [x] 4.1 Unit (vitest): the relative-time helper returns localized nl/en strings for day/month/year diffs and `null` for missing/invalid input (`formats updated_at as localized relative time`).
- [x] 4.2 E2e (Playwright): a detail page for a company with `updated_at` shows a lowercase last-checked footer containing a relative-time phrase (`detail footer shows real last-checked time`).
- [x] 4.3 Unit (vitest): the helper returns `null` for missing/invalid `updated_at`, which drives the footer's `{lastChecked && …}` omission guard (`returns null for missing or unparseable input`). Covered at the unit level rather than e2e: all real records now carry `updated_at`, so no built page can exercise the absent case, and the repo has no DOM-render harness.

## 5. Verify

- [x] 5.1 Ran `npm run test` (49 pass) and `npm run test:e2e` (43 pass); `npm run build` succeeds and the built nl/en footers read "gecheckt 3 uur geleden" / "checked 3 hours ago" — real `updated_at`, lowercase.

## Why

The company detail page footer shows a hardcoded "gecheckt 12 dagen geleden" / "checked 12 days ago" — the same string for every company, regardless of when its data was actually last refreshed. The pipeline now emits per-company `created_at` and `updated_at` ISO timestamps, so the footer can finally tell the truth.

## What Changes

- The pipeline data contract gains two optional top-level timestamp fields, `created_at` and `updated_at` (ISO 8601), passed through to the typed record.
- The detail page's last-checked footer is derived from the real `updated_at` as a localized relative time (nl/en), replacing the fixed string.
- When a record carries no `updated_at`, the footer is omitted rather than showing a fabricated date.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `company-data`: the company record shape gains optional `created_at` / `updated_at` timestamps that pass through to the typed record.
- `company-detail`: the last-checked footer reflects the company's real `updated_at` as a localized relative time, and is omitted when no timestamp is present.

## Impact

- Data contract with the pipeline: additive, optional fields — no existing field changes, no break for records that lack them.
- `src/lib/company-data/types.ts` (Company type), `src/components/CompanyDetail.tsx` (footer), `src/lib/i18n/messages.ts` ("last_checked" copy), and a small relative-time helper.

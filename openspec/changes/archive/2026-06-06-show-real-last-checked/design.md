## Context

`CompanyDetail.tsx` ends with a footer rendered from the static i18n key `last_checked` ("gecheckt 12 dagen geleden" / "checked 12 days ago"). The pipeline now ships `created_at` and `updated_at` ISO timestamps on every record, so the line can be made truthful. The `Company` type does not yet declare these fields.

## Goals / Non-Goals

**Goals:**
- Surface the real `updated_at` as a localized relative time in the detail footer.
- Keep the data-contract change additive and optional so older records still load.

**Non-Goals:**
- Showing `created_at` anywhere in the UI (carried in the type for completeness only).
- A general date/time formatting layer or absolute-date tooltip.
- Changing validation to require the new fields.

## Decisions

**Relative time via `Intl.RelativeTimeFormat`.** Browser-native, locale-aware, and lowercase by default for nl/en ("12 dagen geleden", "12 days ago") — no date library. A small helper picks the coarsest sensible unit (minute/hour/day/month/year) from the diff between `now` and `updated_at`. Alternative — a hand-rolled pluralization table — was rejected as redundant with the platform API.

**Copy split: prefix word + formatted relative time.** `last_checked` becomes the prefix only ("gecheckt" / "checked"); the helper appends the relative time. Keeps both translatable strings in `messages.ts` and the date math in one place. The relative phrase itself comes from `Intl`, so it is not stored as copy.

**Omit, don't fake, when the timestamp is absent.** The spec requires no footer when `updated_at` is missing. The component guards on a parsed, valid date; an unparseable or absent value renders nothing — never a fabricated "12 days ago".

**Timestamps are optional on the type, no validator change.** `created_at?` / `updated_at?` added to `Company`; `validate()` keeps treating them as ignored extras, matching how `match_quality` already passes through untouched. This preserves backward compatibility for records that predate the field.

## Risks / Trade-offs

- **Clock skew / "0 days ago".** A record refreshed today reads "vandaag"/"today" or "x hours ago"; acceptable and honest. The helper floors to the coarsest unit so sub-minute diffs read as the smallest bucket, not a negative number.
- **Static build snapshot.** The relative time is computed at render; for a static site that means build time, so a long-lived deploy drifts. Acceptable given builds re-run on each data refetch (the `fetch:data` → `build` pipeline), keeping the snapshot fresh.

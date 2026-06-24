# BYOM Struggles

Log of friction encountered **while integrating the BYOM constitution** (`vendor/byom`) into this
app. This file feeds back into BYOM's own v1 documentation — it is read by the BYOM maintainer to
improve `constitution/` (especially `05-integration-guide.md`) for the v1.0.0 release. It is the
local half of BYOM ROADMAP **Phase 5** (integration-guide validation).

## What belongs here

Only friction caused by **how the BYOM constitution describes or requires something** — not issues
with this app's code, this app's integration plan, or general engineering problems. Examples of what
counts:

- A requirement that is ambiguous, contradictory, or impossible to map cleanly onto a real app.
- A contract that is stated at the idea level but gives no way to know when you've satisfied it
  (no observable acceptance signal).
- Terminology that clashes with the consuming app or with other chapters (`02` vs `05` vs `06`
  using different words for the same thing is a known risk).
- A seam or invariant that forced you to **improvise** because the constitution didn't say enough.
- A place where the constitution overclaims or underclaims relative to what a real app can promise.
- Gaps between `05-integration-guide.md`'s `BYOM-INTEGRATION.md` spec and what an app actually needs
  to record.

## What does NOT belong here

- Bugs in this app's BYOK code. File those as normal issues / fix them in the change.
- Scope or sequencing problems with `BYOM_INTEGRATION_PLAN.md`. Update the plan instead.
- Feature ideas or product requests.
- Anything a different consuming app might not hit (struggles should be about the *constitution*,
  which is shared, not about this app's specifics).

## How to log an entry

Add an entry **as you hit the friction**, not at the end. One entry per distinct friction point. Use
this template:

```markdown
### <short title>

- **Where:** `<constitution file>` > <section/requirement/invariant>
- **In the context of:** <which OpenSpec change / task you were doing>
- **The friction:** <what you found unclear, missing, contradictory, or unimplementable as written>
- **What you did instead:** <how you resolved it in this app, so the integration keeps moving>
- **Suggested BYOM improvement:** <concrete change to the constitution for v1 — wording, an added
  acceptance scenario, a clarified term, a missing seam, etc.>
```

Keep each entry concrete and small. If the same friction recurs, add a dated note to the existing
entry rather than opening a duplicate. There is no required order — append new entries at the end.

## Entries

### No integration-document template shipped

- **Where:** `vendor/byom/constitution/05-integration-guide.md` > "Authoring `BYOM-INTEGRATION.md`"
- **In the context of:** `adopt-byom-constitution`, task 2.1
- **The friction:** `05` describes the ten required sections in prose but ships no template file to copy. The precedent this constitution follows — a shared design system — ships `vendor/ontwerp/templates/DESIGN.md` for consumers to scaffold from. BYOM has no `BYOM-INTEGRATION.template.md`, so an agent must reconstruct the section shape from a description, risking drift between consumers.
- **What you did instead:** authored the doc by reading `05`'s section list and filling each section; no template to scaffold from.
- **Suggested BYOM improvement:** ship `BYOM-INTEGRATION.template.md` in the constitution. (ROADMAP Phase 5 already lists this as "Optional" — recommend making it required for v1.)

### No propagation-log section prescribed for the integration document

- **Where:** `05-integration-guide.md` > the ten-section spec; `05` > "Submodule and versioning"
- **In the context of:** `adopt-byom-constitution`, task 2.6
- **The friction:** `05` prescribes the ten sections an integration doc must have, but none is a propagation/update log. Its design-system analogue (`design-system-consumption`) has both a "Design-system update process" requirement and a propagation-log section in `.design/DESIGN.md`. BYOM's `05` mentions a deliberate update *process* but gives no canonical place in the integration doc to *record* advances (e.g. `v0.1.0` → `v1.0.0`), so each consumer invents one.
- **What you did instead:** added a "Propagation log" section to `BYOM-INTEGRATION.md`, flagged as an app-specific extension.
- **Suggested BYOM improvement:** prescribe a propagation-log section in `05`'s integration-doc spec, mirroring the design-system pin-file pattern, so the update-process requirement has an observable home.

### BYOK vs BYOM / "key" vs "model" terminology clash

- **Where:** cross-cutting — `00-philosophy.md`, `01-provider-model.md`, `02-security-invariants.md` vs the consuming app's existing "BYOK" layer naming
- **In the context of:** `adopt-byom-constitution` (the whole change)
- **The friction:** The constitution is model-centric ("bring your own **model**"; the user brings a *model* via a category, the key is just the credential). The consuming app's layer is key-centric ("BYOK" = bring your own *key*), built before the constitution existed. The two names refer to the same integration, and reconciling them across `BYOM-INTEGRATION.md`, `AGENTS.md`, and the spec required deliberate mapping. This recurs for any consumer whose layer predates the constitution.
- **What you did instead:** documented the mapping explicitly in `BYOM-INTEGRATION.md`'s intro and Deviations; kept the app's internal `byok` naming rather than renaming.
- **Suggested BYOM improvement:** in `00` or `05`, acknowledge that consuming apps may already have a key-centric name for the layer; clarify that BYOM's model-centric framing is the canonical term while an app's pre-existing name is an acceptable alias to record in `BYOM-INTEGRATION.md`.

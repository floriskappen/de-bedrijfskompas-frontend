## Context

Changes A–F made the BYOK layer functionally conform to the BYOM constitution (`vendor/byom`, pinned `v0.1.0`): all six invariants are met, and the `03`/`06` deviations are closed. What remains is closing the conformance *gate* — `05-integration-guide.md`'s 12-box checklist — and finalizing the compliance record. Two things make this non-trivial: (1) checklist box 1 ("app is free and open source") is unchecked (no `LICENSE`; `package.json` is `private: true`), and that gap was never recorded in `BYOM-INTEGRATION.md`'s deviations because no change re-walked the full checklist after A; (2) the *follow-on* to compliance — the badge and the registry — are blocked on externals this app cannot create. The badge link target is `https://BYOM-SITE/` (a placeholder; the domain is not chosen), and `registry.yaml`'s CI requires `https://` `url`, `source_url`, and `integration_doc_url`, none of which validate without a live app URL and a public repo.

## Goals / Non-Goals

**Goals:**
- Close `05`'s conformance checklist: every box green and pointed to its implementation.
- Close the open-source gap by adding an OSI license at the repo root.
- Finalize `BYOM-INTEGRATION.md` so its deviations list matches a real, fresh checklist walk (drift corrected).
- Record the badge + registry as a deferred follow-on with their concrete blockers named, so a future change has a clear entry condition.

**Non-Goals:**
- Display the BYOM badge. Deferred — the link target does not exist.
- Submit the upstream registry PR. Deferred — no live URL / public repo to validate against the schema.
- Any change to the BYOK request boundary, budget, CSP, cost surface, or onboarding (A–F are done).

## Decisions

### 1. License: GPL-3.0-or-later

Ship `LICENSE` declaring GPL-3.0-or-later, matching `vendor/byom`'s license. The app vendors the constitution as a GPL-3.0-or-later submodule; a matching license keeps the two coherent and aligns with the BYOM badge's "free and open-source" stance. Alternatives: MIT (permissive) — rejected because copyleft matches the movement's framing of "free" and the user's decision; Apache-2.0 — needless patent clauses for an app with no patent surface.

### 2. Defer badge + registry rather than improvise in G

The badge README fixes the link target as the constitution *site root* (`/`), "a long-lived external contract," and the domain is a placeholder. Displaying the badge linked to the byom GitHub repo instead is an improvisation neither `04` nor the badge README blesses. The registry schema CI-enforces `https://` URLs that can't be validated without a live app URL and a public source repo. So G records badge + registry as deferred with three named blockers (site domain; live app URL; public repo) and leaves them to a follow-on change H. Alternative considered: ship the badge linking to the GitHub repo now — rejected as an unblessed improvisation to log in `BYOM_STRUGGLES.md`.

### 3. The checklist re-walk is a first-class task, not a rubber stamp

B–F each closed its own deviation, but nobody re-walked all 12 boxes since A, so drift accumulated (the open-source gap went unrecorded). G verifies each box against the code rather than assuming, and treats `BYOM-INTEGRATION.md`'s deviations list as the artifact that must match the walk's result. The walk itself is a verification activity (a task), not runtime behaviour — it has no spec requirement of its own; the existing "Local integration document" requirement already obliges recording deviations.

### 4. Spec delta: one ADDED requirement in `byom-consumption`

The only checklist box without spec backing is box 1 (free/open-source). B already added the CSP requirement as box 3's acceptance signal; the license requirement is the analogue for box 1. No `bring-your-own-key-llm` spec change — the BYOK request layer is unchanged. Alternative: add a "conformance checklist walk" requirement — rejected (verification activity, not behaviour; would bloat the spec without an observable signal beyond the integration doc).

## Risks / Trade-offs

- **G does not meet the plan's literal DoD** ("badge displayed; registry PR open"). → Mitigation: the proposal re-scopes G to the gate-close and records badge/registry as a deferred follow-on; the plan's own snapshot (§3) already flagged the badge as `⏳ Follow-on`. The deviation from the plan's DoD is stated in the change's verification notes, not hidden.
- **The re-walk surfaces more drift than the license.** → That is the point; each finding is either closed in G or recorded as an honest deviation. No silent assumptions.
- **GPL-3.0 may conflict with a future proprietary intent.** → The user confirmed GPL v3; if intent changes, that becomes a recorded deviation later.

## Open Questions

- Does / will the app have a live `https` URL and a public source repo? This determines *when* the follow-on badge/registry change can open, not whether G can close the gate. Not blocking.

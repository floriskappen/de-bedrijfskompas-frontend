## Why

Changes A–F made the BYOK layer functionally conform to the BYOM constitution — all six invariants are met, and the `03`/`06` deviations are closed. But the conformance gate was never formally closed: `05`'s checklist box 1 ("app is free and open source") is still unchecked (no `LICENSE` at the repo root; `package.json` is `private: true`), and the deviations list in `BYOM-INTEGRATION.md` has drifted — it lists only "no badge yet," omitting the open-source gap that was never recorded because no change re-walked the full checklist after A. This change closes the gate honestly: re-walk `05`'s checklist end-to-end, add the license, and finalize the compliance record. The badge + registry — the follow-on to compliance, already flagged `⏳` in the plan's snapshot — stay deferred: they are blocked on upstreams this app cannot create (a chosen BYOM site domain for the badge link target; a live https app URL and a public source repo for the registry entry).

## What Changes

- Add a **GPL-3.0-or-later `LICENSE`** at the repo root (matching `vendor/byom`'s license), closing `05` checklist box 1 ("app is free and open source"). No paywall, subscription, or developer-side metering exists today; the license makes the open-source claim checkable.
- **Re-walk `05`'s 12-box Conformance checklist** end-to-end against the A–F implementation, correcting any drift (e.g. confirming "non-model features not gated" still holds after F's IA move).
- **Finalize `BYOM-INTEGRATION.md`**: record the license gap closed; restate the remaining deviations honestly — the BYOK/BYOM terminology mapping (permanent) and the badge/registry deferred pending upstream site domain / live URL / public source repo.
- **Defer the badge and the upstream registry PR** to a follow-on change. They are not achievable in G: the badge link target is `https://BYOM-SITE/` (a placeholder — the domain is not chosen), and `registry.yaml` CI requires `https://` `url`, `source_url`, and `integration_doc_url`, none of which can be validated without a live app URL and a public repo. G records these as deferred, not done.
- **Log constitution-level friction** to `BYOM_STRUGGLES.md` (the unresolved badge link target; the badge/registry artifacts living under `website/` which `AGENTS.md` directs agents to ignore for implementation decisions).
- Extend the `byom-consumption` conformance test with a **license-presence** assertion, the analogue of the CSP presence check added by B.

## Capabilities

### New Capabilities

- _none_

### Modified Capabilities

- `byom-consumption`: add a "Free and open-source license" requirement backing `05` checklist box 1 and `04` badge eligibility — the app SHALL ship an OSI license at the repo root and SHALL not meter access. (No `bring-your-own-key-llm` spec change; the BYOK request layer is unchanged.)

## Impact

- **Routes:** none. No UI behaviour change; no badge is displayed.
- **Code:** new `LICENSE` file at repo root; `BYOM-INTEGRATION.md` finalized; `BYOM_STRUGGLES.md` appended; `src/lib/byom/byom-consumption.test.ts` extended with a license-presence assertion.
- **Data contract with the pipeline:** unchanged.
- **Dependencies:** none added.
- **Constitution:** closes the last open conformance box (free/open-source). Badge display and registry listing are explicitly out of scope and deferred to a follow-on change.

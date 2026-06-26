## 1. License — close conformance checklist box 1

- [x] 1.1 Add a `LICENSE` file at the repository root declaring GPL-3.0-or-later (full SPDX license text), matching `vendor/byom`'s license.
- [x] 1.2 Add `"license": "GPL-3.0-or-later"` to `package.json` (currently absent; `private: true` stays — private means not-published, not proprietary).

## 2. Conformance checklist re-walk

- [x] 2.1 Walk all 12 boxes of `vendor/byom/constitution/05-integration-guide.md`'s "Conformance checklist" against the A–F implementation; for each box, confirm the implementation pointer is real or record a deviation. Lead with this walk (design decision 3) — do not assume.
- [x] 2.2 Specifically re-verify "Non-model features are not gated behind a key" after F's IA move (Ikigai entry relocated into the filter panel): confirm the map, filters, favorites, detail pages, axis pages, and philosophy page work with no key configured.

## 3. Finalize BYOM-INTEGRATION.md

- [x] 3.1 Record the open-source gap closed (LICENSE added); correct the deviations drift — the doc currently lists only "no badge yet," omitting the open-source box that was unchecked.
- [x] 3.2 Restate the remaining deviations honestly: the BYOK/BYOM terminology mapping (permanent), and the badge + registry **deferred** pending three named blockers (BYOM site domain for the badge link target; a live `https` app URL; a public source repo) as the entry condition for the follow-on change.
- [x] 3.3 Add a propagation-log entry for change G (license added; checklist re-walked; badge/registry deferred).

## 4. Conformance test — maps to spec scenario "Repository carries an open-source license"

- [x] 4.1 Add a license-presence assertion to `src/lib/byom/byom-consumption.test.ts` (test name: "repository carries an open-source license") — assert a `LICENSE` file exists at the repo root and declares GPL-3.0-or-later. This is the analogue of the CSP presence check added by B.
- [x] 4.2 Run `npm test` and confirm the `byom constitution consumption` suite is green, including the new license test and the existing pin/CSP/integration-doc tests.

## 5. Friction log — BYOM_STRUGGLES.md (plan §6.3)

- [x] 5.1 Append entries (or dated notes) to `BYOM_STRUGGLES.md` for constitution-level friction surfaced by G: (a) the badge link target is an unresolved placeholder (`https://BYOM-SITE/` — domain not chosen), so a compliant app cannot link the badge to the constitution site; (b) the badge assets and `registry.yaml` live under `vendor/byom/website/`, which `AGENTS.md` (both the app's and the constitution's) directs agents to ignore for implementation decisions. If no new friction is found, state so explicitly in the verification notes with the reason.

## 6. Verify and archive readiness

- [x] 6.1 Run `openspec status --change finalize-byom-integration` and `openspec validate finalize-byom-integration`; confirm the change validates and all `applyRequires` artifacts are done.
- [x] 6.2 In the change's verification notes, state the deviation from the plan's literal §5.G DoD (badge display + registry PR deferred, not done) and record that BYOM Phase 5's conformance gate is closed while the badge/registry follow-on is blocked on upstreams.

## Verification notes

**Deviation from the plan's literal §5.G DoD.** `BYOM_INTEGRATION_PLAN.md` §5.G defines done as "Conformance checklist all green; `BYOM-INTEGRATION.md` finalized; badge displayed; registry PR open; Phase 5 marked done." This change delivers the first two and deliberately defers the badge display and the upstream registry PR. They are not achievable in G: the badge link target is `https://BYOM-SITE/` (a placeholder whose domain is not chosen), and `registry.yaml`'s CI requires `https://` `url`, `source_url`, and `integration_doc_url` — none validate without a live app URL and a public source repo. This re-scoping is recorded openly in `proposal.md`, `design.md` (Risks), and `BYOM-INTEGRATION.md` (Deviations), not hidden. The plan's own §3 snapshot already flagged the badge as `⏳ Follow-on, only after full compliance`.

**Conformance gate closed.** Re-walked all 12 boxes of `05`'s Conformance checklist against the A–F implementation. 11 were already green; box 1 ("app is free and open source") is closed here by the GPL-3.0-or-later `LICENSE`. Box 8 ("non-model features not gated") was re-verified after F's IA move — `hasConfirmedByokConfig` gates only the Ikigai entry (`MapView.tsx:1062`), not the map, filters, favorites, detail, axis, or philosophy pages. No drift beyond the open-source gap (which was never previously recorded in the deviations list — now corrected).

**Tests.** `npx vitest run` → 131 passed across 15 files, including the new `byom constitution consumption > repository carries an open-source license` test (asserts `LICENSE` exists, declares GPL-3.0, and `package.json.license === "GPL-3.0-or-later"`). `openspec validate finalize-byom-integration` → valid; 4/4 artifacts done.

**Friction logged.** 3 entries appended to `BYOM_STRUGGLES.md`: (a) the badge link target is an unresolved placeholder; (b) the badge/registry artifacts live under `website/` which `AGENTS.md` says to ignore; (c) the deviations list can drift from the checklist with no sync requirement.

**Phase 5 status.** BYOM Phase 5's conformance gate is closed for this app. The badge + registry follow-on — the *celebration* that follows compliance — is blocked on three upstreams (site domain; live URL; public repo) and is the entry condition for a future change. Phase 5's core success criterion (an agent lands here, follows the constitution, produces a correct `BYOM-INTEGRATION.md`, and logs friction for v1) is met.

# BYOM Integration Plan

How this app (`de-bedrijfskompas`) gets from its current browser-local BYOK layer to a fully
**BYOM-compliant** integration of the [`vendor/byom`](./vendor/byom) constitution, executed as a
sequence of OpenSpec changes. This plan is the local half of BYOM ROADMAP **Phase 5** — validating
the integration guide against a real app — and is the reason the `v0.1.0` tag was cut.

The constitution is the authority; this plan is the path. The constitution stays idea-level; the
technical implementation lives in this app and in `BYOM-INTEGRATION.md`.

## 1. Authority and pin

- **Constitution:** `vendor/byom`, pinned to **`v0.1.0`** (submodule, `branch = release/v0.1`).
  See `.gitmodules`.
- **Authority:** `vendor/byom/AGENTS.md` is the entry point. The normative content is
  `vendor/byom/constitution/` (seven chapters, `00`–`06`). `vendor/byom/website/` is
  movement-facing and is **ignored** for implementation decisions.
- **Status of the pin:** `v0.1.0` is a pre-v1 cut. Constitution content (Phases 0–4) is complete;
  the integration guide (`05`) has **not** been validated against a real app. That validation is
  this plan's job. Until v1.0.0 is released, the pin moves deliberately, never automatically.

## 2. Read order (before touching anything)

Every agent working any change in this plan **must**, first:

1. Read `vendor/byom/AGENTS.md`.
2. Read `vendor/byom/constitution/02-security-invariants.md` (the mandatory invariants —
   non-negotiable).
3. Read the constitution chapter(s) their change touches (see each change's "Constitution coverage").
4. Read `BYOM-INTEGRATION.md` (the current compliance state and deviations) — or, until Change A
   creates it, this plan's §4 snapshot.

## 3. Where we are now

The app already has a working browser-local LLM access layer — `src/lib/byok/` (client, storage,
OpenRouter adapter, providers, types) — plus a setup UI (`src/components/ByokSetupDialog.tsx`),
consumed by the Ikigai matching flow (`src/lib/ikigai/runner.ts`). It was built before the BYOM
constitution existed; it aligns with several invariants but has real gaps.

> Terminology: this app's layer is called **BYOK** ("bring your own *key*"). The constitution is
> **BYOM** ("bring your own *model*") — deliberately model-centric: the user brings a *model*
> (via a category), the key is just the credential. The two names refer to the same integration.
> This naming clash is itself a friction point; see `BYOM_STRUGGLES.md`.

### Conformance snapshot

| Constitution requirement | Where it lives now | Status |
|---|---|---|
| Inv 1 — in-memory by default, opt-in persistence | `byok/storage.ts` (`sessionApiKey`, `saveKey`) | ✅ Met |
| Inv 2 — key never sent to dev servers | `byok/openrouter.ts` (direct browser→provider) | ✅ Met |
| Inv 3 — strict CSP | — | ❌ Missing (no CSP anywhere in the app) |
| Inv 4 — minimal third-party JS | `package.json` | ⚠️ Mapbox/React present; needs an audit + justification |
| Inv 5 — never log key / key-linked prompts | `byok/*` (no logging paths) | ✅ Met (error path too) |
| Inv 6 — pre-flight estimation + enforceable budget ceiling | `byok/client.ts`, `byok/storage.ts` | ⚠️ Allowance ceiling + post-hoc usage exists; **no pre-flight estimate, no in-flight accounting** |
| Data egress — prompts go only to the provider | `byok/openrouter.ts` (no analytics/telemetry) | ✅ Met |
| `01` — request a *category*, not a hardcoded model | `byok/providers.ts` | ❌ Hardcodes `deepseek/deepseek-v4-flash`; no frontier/worker concept |
| `03` — first-time-key-holder onboarding | `ByokSetupDialog.tsx` | ❌ No "what is a key", no OpenRouter link, no provider-spend-limit prompt |
| `03` — clear stale key on 401, prompt re-connect | `byok/client.ts` | ❌ Returns `invalid_key`; does not clear `sessionApiKey` |
| `03` — persistent connection-management surface | `ByokSetupDialog.tsx` | ⚠️ Partial (re-open to change model/budget); no clear-key or history view |
| `06` — live per-request cost (real usage, pending state) | — | ❌ "Cost indication follows later" placeholder only |
| `06` — local spend history | — | ❌ Missing |
| `06` — no-lost-work leave warning | — | ❌ Missing (no `beforeunload` during paid requests) |
| `05` — `BYOM-INTEGRATION.md` at repo root | — | ❌ Missing |
| `05` — pin a released constitution version | `vendor/byom` | ✅ Pinned `v0.1.0` |
| `05` — agent guidance pointing to the constitution | `AGENTS.md` | ❌ No BYOM entry (ontwerp entry exists; BYOM does not) |
| `04` — badge + registry listing | — | ⏳ Follow-on, only after full compliance |

## 4. Target state

Every box in `05-integration-guide.md`'s **Conformance checklist** is green, and `BYOM-INTEGRATION.md`
is authored with all ten required sections. Specifically:

- All six invariants honored, each **pointed to** in the app and recorded in `BYOM-INTEGRATION.md`.
- Data-egress rule followed (key + prompts → provider only).
- Wizard UX contract (`03`) met, including the first-time-key-holder path and stale-key clearing.
- Each model-powered feature declares **frontier** or **worker**; the user chooses the model.
- Non-model features are not gated behind a key.
- Call path is browser → provider, no dev backend.
- Budget ceiling (inv 6) **and** cost-transparency surface (`06`) both present.
- `BYOM-INTEGRATION.md` authored; constitution pinned to a release tag.
- Then, and only then: BYOM badge displayed; registry entry submitted upstream.

## 5. The path — OpenSpec changes

Seven changes, sequenced as a DAG. Each is sized like an existing OpenSpec change in this repo
(cf. `openspec/changes/archive/2026-06-09-add-bring-your-own-key-llm/`). Pick one up via the
OpenSpec workflow (`proposal` → `design` → `specs` → `tasks` → implement → archive).

```
A  ──►  B ─┐
        C ─┼─►  E ─►  F ─►  G
        D ─┘
```

- **A** is the foundation; everything depends on it.
- **B, C, D** can run in parallel after A.
- **E** depends on **D** (uses pre-flight + usage) and informs **F**.
- **F** depends on **C** (model choice) and **E** (budget/history).
- **G** is the close-out; depends on B, C, D, E, F.

Recommended order if working linearly: **A → D → C → B → E → F → G**.

> **Every change below carries the cross-cutting responsibilities in §6.** They are not repeated in
> full in each change — only called out where a specific constitution chapter is in scope.

---

### Change A — `adopt-byom-constitution`

**Goal:** Make the constitution the named authority for the BYOK layer; establish the compliance
artifact and the struggles feedback loop. No behaviour change.

**Constitution coverage:** `05` (pin, authority, `BYOM-INTEGRATION.md`, agent guidance); mirrors the
existing `design-system-consumption` pattern for ontwerp.

**Capabilities:**
- New: `byom-consumption` (the pin + authority + presence of `BYOM-INTEGRATION.md`).
- Modified: `AGENTS.md` (add a BYOM entry alongside the ontwerp entry).

**Key tasks:**
- Add an `AGENTS.md` entry naming `vendor/byom/AGENTS.md` + `constitution/` as the BYOK authority,
  stating that deviations must be recorded in `BYOM-INTEGRATION.md`. Mirror the ontwerp entry's shape.
- Author a **draft `BYOM-INTEGRATION.md`** at the repo root with all ten sections from
  `05-integration-guide.md`, filled in for the **current** state. The "Deviations" section lists
  every gap in §3 above honestly, with the reason. Pinned version: `v0.1.0`.
- Add a `byom-consumption` spec + test (mirror `src/styles/design-system.test.ts`): assert the
  submodule is at `vendor/byom`, `VERSION` is `v0.1.0`, `AGENTS.md` references it, and
  `BYOM-INTEGRATION.md` exists. Test the pin with `git describe --tags --exact-match`.
- Confirm `BYOM_STRUGGLES.md` exists (it does) and is referenced from `BYOM-INTEGRATION.md`'s
  deviations note.

**Dependencies:** None (submodule already added).

**Definition of done:** Constitution is the named authority; pin test green; `BYOM-INTEGRATION.md`
exists with an honest, complete current-deviation list.

---

### Change B — `byok-security-csp-and-stale-key`

**Goal:** Close the load-bearing security gaps: strict CSP, third-party-JS audit, stale-key clearing
on auth failure.

**Constitution coverage:** invariants 3 (CSP), 4 (minimal JS), 5 (no logging on error path); wizard
contract `03` "When a request fails" (clear stale key on 401, no silent retry, no leakage).

**Capabilities:**
- Modified: `bring-your-own-key-llm` (add CSP + stale-key-clearing requirements).

**Key tasks:**
- Add a **strict CSP**. Decide the mechanism in `design.md` (Astro CSP directive vs `_headers` —
  depends on host). `connect-src` must allow `https://openrouter.ai`; also allow whatever the map
  needs (Mapbox tile/font origins) since the map is non-model but shares the page. `script-src`
  should be `self` (deps are bundled, not CDN-loaded).
- On `invalid_key` (401/403 from `byok/openrouter.ts`), **clear `sessionApiKey`** and surface a
  re-connect prompt; do not retry silently. Wire this in `byok/client.ts` or the storage layer.
- Audit third-party JS (inv 4): list what's genuinely needed and why (Mapbox, React, …); record the
  audit in `BYOM-INTEGRATION.md`'s key-handling section.
- Add a test: an `invalid_key` result clears the session key (assert `getSessionByokApiKey()` is
  null after). Add a CSP presence check to the `byom-consumption` test.
- Update `BYOM-INTEGRATION.md`: resolve inv 3/4/5 and the stale-key deviation; update the invariant
  mapping to point at the new code.

**Dependencies:** A.

**Definition of done:** Strict CSP present and tested; 401 clears the key and prompts re-connect;
JS audit recorded; invariants 3/4/5 mapped in `BYOM-INTEGRATION.md`.

---

### Change C — `byok-model-categories`

**Goal:** Stop hardcoding one model; let each feature declare a category (frontier/worker) and let
the user choose within it.

**Constitution coverage:** `01-provider-model.md`; seam 2 of `05`.

**Capabilities:**
- Modified: `bring-your-own-key-llm` (category model, not a pinned model).
- Modified: `ikigai-matching` (declare the category each LLM pass needs).

**Key tasks:**
- Replace the single hardcoded model in `byok/providers.ts` with a **category** model
  (`frontier` / `worker`), each mapping to a set of suitable OpenRouter models. Default to `worker`.
- Have each model-powered feature **declare** its category. For Ikigai: ISCO derivation and pass-1
  are extraction/ranking → `worker`; pass-2 (data-grounded reasoning) → decide in `design.md`
  (`worker` unless reasoning quality genuinely demands `frontier`). Record the decision and its
  reasoning in `BYOM-INTEGRATION.md`.
- Surface category + model options in `ByokSetupDialog.tsx`; the user picks within the feature's
  category. Do not silently hard-code.
- Update the existing "Visitor configures OpenRouter" scenario and add a "user chooses within a
  category" scenario + test. Update the model-id verification approach from the original BYOK change.
- Update `BYOM-INTEGRATION.md`: fill the model-powered-features-and-categories section.

**Dependencies:** A. (Parallel with B and D.)

**Definition of done:** No hardcoded single model; user chooses within the feature's category; every
model-powered feature's category is recorded with reasoning.

---

### Change D — `byok-preflight-budget`

**Goal:** Enforce the budget ceiling **before** a request is sent, accounting for in-flight calls.

**Constitution coverage:** invariant 6; "The honest budget boundary" in `02`.

**Capabilities:**
- Modified: `bring-your-own-key-llm` (pre-flight estimation, in-flight-aware cumulative ceiling).

**Key tasks:**
- Estimate the prompt token cost **pre-flight** (best-effort estimate; record the estimation method
  in `design.md`). Keep the existing post-hoc provider-reported usage as the **source of truth for
  displayed cost** (per `06`) — the estimate only guards the ceiling.
- Track **in-flight** cost so concurrent / multi-step agentic calls cannot blow past the ceiling
  before spend catches up. The Ikigai runner issues sequential passes; model the in-flight check so
  a future concurrent caller is safe.
- Refuse the request at the ceiling (return `allowance_exceeded` before the fetch).
- Tests: pre-flight blocks an over-budget request **before** `fetch` is called; in-flight cost is
  counted. Keep the existing allowance tests green.
- Update `BYOM-INTEGRATION.md`: resolve the inv-6 deviation; note the best-effort boundary.

**Dependencies:** A. (Informs E.)

**Definition of done:** Over-budget requests are refused pre-fetch; in-flight spend is accounted for;
the best-effort nature is documented.

---

### Change E — `byok-cost-transparency`

**Goal:** Make spend legible — real per-request cost, local history, and no-lost-work protection.

**Constitution coverage:** `06-cost-transparency.md` (all four principles).

**Capabilities:**
- Modified: `bring-your-own-key-llm` (live cost, attribution, local history, leave warning).

**Key tasks:**
- Surface **live per-request cost** from the provider's real usage data (already extracted in
  `byok/openrouter.ts`). Show **pending** until real usage lands (e.g. mid-stream before the final
  chunk). Never fabricate an estimate as the displayed cost.
- **Per-request attribution** at minimum; per-feature encouraged. The Ikigai passes are natural
  per-feature units (derivation / pass-1 / pass-2) — attribute to those.
- Add a **local spend history** view (browser-local, next to the key setup; the developer never
  sees it). This is the same posture as the key (inv 1).
- Add a **leave warning** (`beforeunload`) when an in-flight paid request would be aborted — the same
  pattern as unsaved-changes guards. Does not apply where work continues in the background.
- Tests: pending state shown until usage lands; history is local and not sent anywhere; leave warning
  fires during an in-flight paid call.
- Update `BYOM-INTEGRATION.md`: resolve the `06` deviations; point at the history + leave-warning
  code.

**Dependencies:** D (uses pre-flight + usage). (Informs F's budget UI.)

**Definition of done:** User sees real cost (with pending state), local history, and a leave warning
during paid requests.

---

### Change F — `byok-onboarding-and-connection-management`

**Goal:** Walk a first-time key holder all the way through, and make the connection a persistent
management surface (not set-and-forget).

**Constitution coverage:** `03-wizard-ux-contract.md` (wizard must-cover items 1, 2, 3, 6; "After
connecting"; "Tone"); seam 1 of `05`.

**Capabilities:**
- Modified: `bring-your-own-key-llm` (onboarding steps, connection-management surface).

**Key tasks:**
- Before asking for a key, explain plainly: the feature needs model inference, the user brings their
  own key, and they pay their provider directly. No surprise about who pays.
- Point to where/how to get an OpenRouter key (concrete link), assuming the user has never seen an
  API key. **Prompt setting a spend limit at the provider** during onboarding (the hard cap; inv 6's
  provider-side layer).
- Restate/link the **honest threat model** (browser-local is a privacy/control win, not a
  cryptographic guarantee).
- Make the wizard the first-run instance of a **persistent connection surface**: after connecting,
  the user can change the model (within the feature's category — ties to C), adjust the budget,
  **clear or rotate the key**, and **view local spend history** (ties to E).
- Tests (browser-driven, per the OpenSpec UI rule): a first-time key holder can reach the flow from
  the Ikigai entry and complete onboarding; the connection surface exposes model/budget/clear/history.
- Update `BYOM-INTEGRATION.md`: resolve the onboarding + connection-management deviations.

**Dependencies:** C (model choice) and E (budget/history).

**Definition of done:** A first-time key holder can onboard end-to-end; the connection-management
surface is complete and reachable.

---

### Change G — `finalize-byom-integration`

**Goal:** Close out Phase 5 — confirm full conformance, then badge + registry.

**Constitution coverage:** `05` conformance checklist; `04-badge-and-registry.md`.

**Key tasks:**
- Walk the `05` **Conformance checklist** end-to-end against the now-updated implementation. Each
  invariant pointed to its implementation; each checklist box green.
- Finalize `BYOM-INTEGRATION.md`: remove resolved deviations, complete the invariant mapping and the
  pinned version. Re-read every constitution chapter to confirm nothing drifted.
- **Only if fully compliant:** add the BYOM badge (assets in `vendor/byom/website/public/assets/badge/`)
  with the honest claim text from `04`.
- Submit a registry entry: open a PR **upstream** against
  `vendor/byom/website/registry/registry.yaml` (per its schema/CI). This is an upstream action;
  record it here as a task.
- Record that BYOM Phase 5 is validated (feeds the BYOM maintainer's v1 release).

**Dependencies:** B, C, D, E, F.

**Definition of done:** Conformance checklist all green; `BYOM-INTEGRATION.md` finalized; badge
displayed; registry PR open; Phase 5 marked done.

## 6. Cross-cutting responsibilities (every change)

These apply to **every** change in §5. An agent picking up any todo OpenSpec change from this plan
**must** do all of the following as part of that change — they are not optional and not separate
tasks:

1. **Read the constitution first.** `vendor/byom/AGENTS.md`, then `02-security-invariants.md`,
   then the chapter(s) your change covers (see "Constitution coverage"). Do not implement from
   memory.

2. **Update `BYOM-INTEGRATION.md`.** In your change: mark the gap(s) you closed as resolved, update
   the per-invariant mapping to point at your new code, and record any **new** deviation with its
   reason. `BYOM-INTEGRATION.md` is the living compliance record; it must reflect reality after your
   change lands.

3. **Log friction to `BYOM_STRUGGLES.md`.** This is mandatory. As you work, append entries to
   `BYOM_STRUGGLES.md` for **any friction caused by how the BYOM constitution describes or requires
   something** — ambiguity, a contract with no observable acceptance signal, terminology that clashes
   (e.g. BYOK vs BYOM, "key" vs "model"), a requirement that forced improvisation, an over/underclaim,
   a gap in the `BYOM-INTEGRATION.md` spec. Use the entry template in that file. **Do not** log your
   own implementation bugs, plan-scope issues, or product ideas there — those go elsewhere. The point
   is to capture what BYOM's own docs need to fix for v1; this is the concrete output of Phase 5.
   If you finish a change and added nothing to `BYOM_STRUGGLES.md`, say so explicitly in the change's
   verification notes and explain why there was no friction.

4. **Verify.** Add named tests for every new/modified scenario (unit for the boundary, Playwright
   for UI-visible behaviour — the OpenSpec config requires real browser checks for visual constraints).
   Run typecheck and the OpenSpec status checks before archiving.

## 7. Out of scope for this integration

- **Direct-to-provider support** (OpenAI/Anthropic APIs directly) — v1 is OpenRouter-only per `01`.
- **A privileged-chrome browser extension** for real phishing resistance — explicitly out of scope
  for BYOM v1 (`04`).
- **A shared BYOM client library** (npm/pub) — allowed by the constitution, not a deliverable.
- **Renaming the app's BYOK layer/spec to "BYOM".** The app keeps its internal `byok` naming; BYOM
  is the constitution it conforms to. The mapping is recorded in `BYOM-INTEGRATION.md`. (If this
  becomes a recurring source of confusion, log it in `BYOM_STRUGGLES.md`.)

## 8. Relationship to the BYOM roadmap

This plan executes BYOM ROADMAP **Phase 5** (integration-guide validation). Its success criteria
mirror the roadmap's "Definition of done for v1": an agent lands here, follows `AGENTS.md` +
`constitution/`, and produces a correct `BYOM-INTEGRATION.md` — and at least one consuming app
(Bedrijfskompas) has proven the integration pattern end to end. The struggles logged in
`BYOM_STRUGGLES.md` are the feedback that makes `05-integration-guide.md` better for v1.0.0.

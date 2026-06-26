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

### Estimation required, but no tokenizer blessed (inv 6 vs inv 4)

- **Where:** `02-security-invariants.md` > invariant 6 ("Pre-flight token estimation …"); invariant 4 ("Minimal third-party JavaScript")
- **In the context of:** `byok-preflight-budget`, task 1.1
- **The friction:** Inv 6 requires estimating a request's token cost pre-flight, but the constitution never says *how* to count tokens, and inv 4 actively discourages the dependency a real tokenizer (tiktoken &c.) would add. The two invariants pull against each other with no blessed resolution: an app must estimate tokens, is told not to pull in JS to do it, and is given no sanctioned heuristic. Every consumer improvises a character-ratio and must defend it as "best-effort" on its own.
- **What you did instead:** a no-dependency heuristic — input tokens ≈ `ceil(message chars / 4)`, output tokens ≈ `maxTokens ?? 2048` — recorded in `design.md` and `BYOM-INTEGRATION.md`, explicitly labelled best-effort per "The honest budget boundary."
- **Suggested BYOM improvement:** in `02` (or a `06`-adjacent note), bless a token-estimation heuristic as the constitutionally-acceptable default for apps that won't ship a tokenizer, and state plainly that inv 4's "minimal JS" does not require a tokenizer-free estimate to be precise.

### No guidance for unknown / null model pricing

- **Where:** `02-security-invariants.md` > invariant 6; `01-provider-model.md`
- **In the context of:** `byok-preflight-budget`, tasks 1.1 and 1.3
- **The friction:** Inv 6 says to "estimate its token cost and check it against a … cumulative budget," and the budget is set in the provider's billing unit (USD). Converting tokens → USD requires the model's per-token price. But the constitution never addresses the case where a model's pricing is unknown or null — which is exactly this app's state (`deepseek/deepseek-v4-flash` ships with null pricing pending verification), and is the natural state of any consumer that adopts the constitution before pinning real prices. `01` describes categories and models but prescribes nothing about pricing availability or what to do when it is absent. An app cannot satisfy inv 6 in USD without inventing a fallback.
- **What you did instead:** a named conservative `FALLBACK_USD_PER_TOKEN` constant used *only* for the ceiling guard (never for displayed cost), sized to over-estimate so the guard never under-blocks, to be superseded when change C supplies real per-model pricing.
- **Suggested BYOM improvement:** in `01` or `02`, require every model entry to carry pricing (and define the migration shape for an entry whose pricing is unverified), or explicitly bless a "conservative fallback rate, guard-only, never displayed" pattern so consumers don't each reinvent the boundary.

### "Accounting for in-flight requests" has no observable acceptance signal

- **Where:** `02-security-invariants.md` > invariant 6 ("…accounting for in-flight requests, so concurrent or multi-step calls cannot blow past the ceiling…")
- **In the context of:** `byok-preflight-budget`, task 3.3
- **The friction:** Inv 6 mandates in-flight accounting but states no acceptance scenario — there is no way to know, from the constitution, what observable behaviour satisfies "accounting for in-flight requests." The requirement is stated at the idea level only. An app cannot tell whether it has implemented enough (e.g., does a single sequential caller like this app's Ikigai runner satisfy it trivially, or is a concurrent-overshoot test required?), so each consumer invents its own acceptance test.
- **What you did instead:** invented an explicit acceptance test: two `sendByokLlmRequest` calls issued concurrently, each estimate alone fitting but combined exceeding the allowance, assert the second resolves `allowance_exceeded` with `fetch` called exactly once.
- **Suggested BYOM improvement:** in `02`, attach an acceptance scenario to invariant 6 — e.g. "given two concurrent requests whose combined estimates exceed the allowance, the second is refused before its fetch" — so the in-flight requirement has an observable, portable signal a consumer can test against.

### "Surface suitable options" has no minimum or acceptance bar

- **Where:** `01-provider-model.md` > "Request a category, not a model"; `05-integration-guide.md` > seam 2 ("The model-category request")
- **In the context of:** `byok-model-categories`, tasks 2.3 and 6.1
- **The friction:** `01` says "the app surfaces suitable options for the user to pick" and `05` seam 2 says "the app surfaces suitable options for the user to pick. The app does not silently hard-code a single model." But neither defines a minimum: is one model per category "letting the user choose," or is a single-option `<select>` still too close to pinning? An app with one curated worker model has technically replaced a hardcoded model with a category-tagged chooser, but the visitor's effective choice is unchanged. The constitution gives no acceptance bar (no minimum count, no "at least N models," no "the set must be non-trivial") so each consumer must decide when it has done enough.
- **What you did instead:** shipped a category-tagged `<select>` with the one curated worker model, structurally correct (the architecture supports adding models without a second migration; adding a model to the registry automatically surfaces it). The visitor's effective choice expands when the maintainer curates more models. Recorded the single-model state honestly in `BYOM-INTEGRATION.md`'s category-choice surface.
- **Suggested BYOM improvement:** in `01` or `05` seam 2, prescribe a minimum for "surface suitable options" — e.g. "at least two models per category the app uses, or a documented rationale for why fewer suffices" — so the "does not silently hard-code" requirement has an observable, testable acceptance bar.

### "Strict CSP" is unquantified against a dependency-heavy page

- **Where:** `02-security-invariants.md` > invariant 3 ("Strict Content Security Policy … to limit where scripts can load from and where the page can send data")
- **In the context of:** `byok-security-csp-and-stale-key`, tasks 2.1 and 2.2
- **The friction:** Inv 3 mandates a "strict" CSP but defines neither what "strict" means nor what concessions remain acceptable. A real app that embeds a WebGL map (Mapbox GL) cannot run under a maximally strict policy: Mapbox spawns workers from `blob:` URLs and injects runtime `<style>` elements, forcing `worker-src 'self' blob:` and a `style-src` that admits runtime injection. Whether a CSP carrying those concessions still counts as "strict" is undecidable from the constitution — there is no acceptance scenario, no allowlist of permitted concessions, and no threshold. The app must self-certify that the *intent* (no key/prompt exfil via injected scripts to arbitrary origins) is met by `script-src 'self' <hashes>` and a closed `connect-src`, while recording the Mapbox concessions as "deviations" that the constitution gives no vocabulary to classify.
- **What you did instead:** recorded the concessions (blob workers, style injection) with per-origin justification in `BYOM-INTEGRATION.md`, held the operative protections (no `'unsafe-inline'`/`'unsafe-eval'` in `script-src`, closed `connect-src`, no wildcard `*`), and self-certified "strict" on the key-exfiltration intent.
- **Suggested BYOM improvement:** in `02` inv 3, define what "strict" protects (key/prompt exfiltration via injected scripts and arbitrary-origin egress) and name the *load-bearing* directives (`script-src` without `'unsafe-inline'`/`'unsafe-eval'`/`*`, `connect-src` as a closed allowlist), so a consumer can tell which concessions (blob workers, style injection) preserve "strict" and which break it. Optionally bless the meta-tag delivery form with its known limits.

### "Minimal third-party JavaScript" has no threshold

- **Where:** `02-security-invariants.md` > invariant 4 ("Minimal third-party JavaScript. Every dependency is attack surface for key theft. Keep third-party JS to the minimum the app genuinely needs.")
- **In the context of:** `byok-security-csp-and-stale-key`, task 4.2 (the JS audit)
- **The friction:** Inv 4 says "minimal … the app genuinely needs" but gives no threshold, metric, or acceptance signal for "minimal enough." An app with a large but product-essential dependency (Mapbox GL is both the biggest supply-chain-XSS surface and the product itself) cannot tell from the constitution whether it has satisfied inv 4 or merely documented a violation. "Every dependency is attack surface" reads as if any non-trivial dependency fails, which would make most real apps non-compliant by construction. The requirement forces an audit (good) but provides no way to close it.
- **What you did instead:** produced a runtime-surface audit (all deps bundled by Vite; no CDN loads after `script-src 'self'`), justified each dependency, stated the Mapbox-as-largest-surface-and-the-product tension plainly, and leaned on the CSP (`script-src 'self'` + closed `connect-src`) as the compensating control that bounds the residual risk.
- **Suggested BYOM improvement:** in `02` inv 4, separate the *audit* obligation (enumerate and justify every runtime dependency) from the *threshold* question, and bless a compensating-control framing: a dependency is acceptable when its exfiltration risk is bounded by the inv-3 CSP (closed `connect-src`, no `'unsafe-inline'` scripts), not when it is "small." Give the audit an acceptance signal so a consumer can mark inv 4 met, not merely "partial" forever.

### "Pending, mid-stream" assumes a streaming transport

- **Where:** `06-cost-transparency.md` > principle 1 ("Live cost, from real usage" — "if usage has not arrived yet — for example, mid-stream before the final chunk — the app shows the cost as pending")
- **In the context of:** `byok-cost-transparency`, task 1.2 (streaming adapter)
- **The friction:** `06`'s pending-state framing is written in streaming terms ("mid-stream before the final chunk"), but the constitution never says the provider call *must* stream. A non-streaming app (one `fetch` → one JSON response with `usage`) has no "final chunk" — usage arrives only when the whole response resolves, so "pending mid-stream" has no native referent. Such an app must either switch its transport to streaming purely to make the constitution's wording fit, or reinterpret "pending" as "the whole fetch is in flight," which the constitution does not bless. The requirement conflates a transport choice with a transparency requirement.
- **What you did instead:** switched the OpenRouter adapter to streaming (`stream: true` + `stream_options.include_usage`) so usage arrives as a discrete final-chunk event, making the pending → landed transition literal and giving the boundary a clean place to emit cost events. Recorded that the streaming choice was made to satisfy `06`'s framing, not for token-by-token UX (the Ikigai passes return JSON, not streamed text).
- **Suggested BYOM improvement:** in `06` principle 1, separate the *transparency requirement* (show pending until real usage arrives; never fabricate) from the *transport assumption* — state that streaming is one way to satisfy it but a non-streaming app may show pending across the whole in-flight request. Otherwise a consumer reading `06` literally concludes it must stream to be compliant.

### Leave-warning `beforeunload` has no observable acceptance signal

- **Where:** `06-cost-transparency.md` > principle 4 ("No lost work" — "the app intercepts with the standard leave warning")
- **In the context of:** `byok-cost-transparency`, task 2.3 / 6.2 (leave guard)
- **The friction:** Principle 4 mandates a leave warning when an in-flight paid request would be aborted, but `beforeunload` interception has no observable acceptance signal in browser test harnesses: Playwright/jsdom cannot assert the native unload dialog, and `beforeunload` does not fire on in-tab navigation. There is no portable, automatable way to prove the warning fires — a consumer can only unit-test the *predicate* that gates it (`isByokLeaveGuarded()`), not the interception itself. The constitution gives no guidance on what acceptance evidence suffices.
- **What you did instead:** unit-tested the guard predicate (`isByokLeaveGuarded()` true during an in-flight request or flagged unsaved work; false otherwise) and stated plainly that the `beforeunload` dialog itself is not asserted (no observable signal), per the honest-boundary stance `06` itself adopts for late/coarse provider data.
- **Suggested BYOM improvement:** in `06` principle 4, state the acceptance evidence a consumer should produce (e.g. a unit test of the guard predicate plus a note that the native dialog is not assertable in-browser), so the requirement has a portable, testable acceptance bar rather than an unverifiable interception claim.

### "Prompt setting a provider spend limit" has no acceptance signal

- **Where:** `02-security-invariants.md` > "The honest budget boundary" ("Require both — the onboarding flow does"); `05-integration-guide.md` > seam 4 ("the provider spend limit: the hard cap, set at the provider during onboarding")
- **In the context of:** `byok-onboarding-and-connection-management`, task 3.1 (provider spend-limit prompt)
- **The friction:** `02` asserts the onboarding flow prompts the provider-side spend limit and `05` calls it the hard cap, but the constitution gives no acceptance signal for what "prompted" means. A browser-local app with no backend cannot verify the user set the limit (calling OpenRouter with the key to check would violate invariant 2), so "prompt" can only be copy + a link. The constitution does not bless the informational-copy-and-link form, nor does it say whether an acknowledgment gate is required or forbidden — each consumer must decide and defend the choice. "Require both" reads as if the app enforces two layers, but the app can only enforce one (its own ceiling); the second is a recommendation the user acts on elsewhere.
- **What you did instead:** informational copy + a link to `https://openrouter.ai/settings/credits`, no acknowledgment gate (a gate would be theatre — unverifiable), with the honest note that the app cannot check it. Recorded in `BYOM-INTEGRATION.md`.
- **Suggested BYOM improvement:** in `02` (or `05` seam 4), bless the "informational copy + link, no gate" form for the provider spend limit and state plainly that the app cannot verify it — so "prompt" has an observable, portable acceptance bar (the copy and link are present) rather than an unverifiable enforcement claim.

### "Legible to a first-time key holder" is untestable

- **Where:** `03-wizard-ux-contract.md` > "What the wizard must cover" (items 1, 2); `05-integration-guide.md` > seam 1 ("If this path is not legible to someone who has never seen an API key, the integration is not finished")
- **In the context of:** `byok-onboarding-and-connection-management`, tasks 3.2–3.5 (onboarding tests)
- **The friction:** `03`/`05` make first-time-key-holder legibility the acceptance bar ("if that path isn't clear to someone who's never seen an API key, the app isn't done"), but legibility is subjective and has no observable signal a consumer can test. A Playwright test can assert the onboarding copy, the get-a-key link, and the threat-model line are present and localized; it cannot assert a first-timer finds them *legible*. Like the logged "surface suitable options" minimum-bar friction, the requirement states an idea-level guarantee with no portable acceptance scenario, so each consumer self-certifies legibility.
- **What you did instead:** Playwright tests assert each onboarding element (intro copy, OpenRouter keys link, spend-limit link, threat-model restatement) is present in the active locale; legibility itself is self-certified against the `03` "Tone" guidance (plain, no hype, no padding).
- **Suggested BYOM improvement:** in `03` or `05` seam 1, attach an observable acceptance scenario to "legible to a first-time key holder" — e.g. "the onboarding surfaces, before the key input, the three facts (what it does, where to get a key, the spend limit) and the threat model, in the active locale" — so the legibility requirement has a testable floor rather than a subjective bar.

### `06` specifies cost as data, not as a presentation pattern — the live-cost surface is reinvented per app

- **Where:** `06-cost-transparency.md` > principle 1 ("Live cost, from real usage") and principle 2 ("Per-request / per-feature attribution")
- **In the context of:** `byok-cost-transparency`, the live-cost UI (the app-level cost overlay)
- **The friction:** `06` specifies *what* cost data to expose (pending → real per request, per-feature attribution) but nothing about *how* the live cost is surfaced — where it lives relative to the feature, how long it stays, when it may be dismissed, how it behaves when the feature advances or on a small screen. These decisions are almost entirely app-agnostic, yet with no pattern to follow each consumer re-derives them from scratch. The cost here was concrete: the live cost first lived *inside* the triggering feature's loading state, which meant it vanished the instant the feature advanced to its results — before the final figure could be read — and again when an auto-hide timer fired between steps of a multi-pass run. A workable shape only emerged after several iterations. That re-derivation is constitution-shaped (a silent affordance), not app-specific.
- **What you did instead:** built an app-level cost surface decoupled from the feature via the cost event bus, whose lifecycle turned out to be general: (1) **appears on the first paid request and is decoupled from the triggering screen**, so it survives the feature's own transitions; (2) **persists until the user dismisses it** — it never auto-hides mid-run (auto-hide between steps was the main bug) — with dismissal (a small × or a swipe) **gated to "all requests settled"** so in-flight work can't be dismissed; (3) groups sequential calls of one operation (e.g. a multi-pass agentic run) into a single "burst" via a short grace window, while a genuinely new operation starts a fresh list; (4) offers a **collapsed pill (amount + pending pulse) ⇄ expanded panel (per-step breakdown + running total)**, defaulting expanded on desktop and collapsed on mobile, each toggleable; (5) always shows a running total (with its unit), starting at zero. Pending state + per-step attribution map straight onto `06` p1/p2; history and the leave-warning stay on their own surfaces (p3/p4).
- **Suggested BYOM improvement:** add a **non-normative "cost surface" reference pattern** to `06` (or an appendix to the integration guide) describing this lifecycle as a recommended shape for principle 1's live-cost presentation — decoupled from the feature, persistent-until-dismissed, dismissal gated to settled, burst-grouped, collapsible (pill ⇄ panel) with a per-viewport default, running total always shown. Keep it recommended rather than required (the constitution stays idea-level), but ship it so the affordance is not reinvented per app. This complements the existing "pending, mid-stream" entry: that one is about *when* cost is known; this is about *where and how* it is shown.

### "Persistent connection surface" pulls against the in-memory-key invariant for a multi-page app

- **Where:** `03-wizard-ux-contract.md` > "the wizard is the first-run instance of a persistent connection surface, not a one-time door" (and "After connecting"); vs `02-security-invariants.md` > invariant 1 ("API keys in memory by default, opt-in persistence")
- **In the context of:** `byok-onboarding-and-connection-management`, task 10.1 (presenting the connection-management surface)
- **The friction:** `03` wants the connection surface to be *persistent* and always-reachable. The most natural realization of "persistent, reachable, shareable" in a conventional web app is a durable location — a settings **route/page** with its own URL. But invariant 1 mandates the active key live **in memory by default** (a RAM variable, not `sessionStorage`/`localStorage` unless the user opts in). In a multi-page app (this one is Astro/MPA), navigating to a real settings route is a full document load that tears down the JS context and **drops the unsaved session key** — so the "persistent surface" reached by a route shows "disconnected" for exactly the privacy-default user invariant 1 is protecting. The two requirements pull against each other and the constitution gives no guidance on resolving "persistent" against "in-memory": it never says whether "persistent" means *durable location* or merely *always-reachable within the session*, nor whether using `sessionStorage` to bridge a navigation is an acceptable invariant-1 concession.
- **What you did instead:** realized the connection-management surface as a **full-screen in-app view** (a same-page state flip, no navigation) rather than a route — "persistent" read as *always-reachable within the session*, not *durable URL*. This keeps the in-memory key alive and invariant 1 intact, at the cost of the surface having no shareable/bookmarkable URL. Recorded the trade-off in `design.md`; did not move the key to `sessionStorage`.
- **Suggested BYOM improvement:** in `03` (or `05`), clarify what "persistent connection surface" requires — *always-reachable within a session* vs *a durable, linkable location* — and explicitly address the multi-page case: state whether a same-page (in-app) surface satisfies "persistent", and whether bridging a real navigation via `sessionStorage` is an acceptable invariant-1 concession or a deviation to record. Without this, every MPA consumer must independently rediscover that "settings page" and "in-memory key" are in tension.

### The badge link target is an unresolved placeholder — a fully-compliant app cannot link it

- **Where:** `04-badge-and-registry.md` > "The badge"; `website/public/assets/badge/README.md` > "Link target" and "Canonical embed snippets"
- **In the context of:** `finalize-byom-integration`, task 2.1 (the conformance close-out) — deciding whether to display the badge
- **The friction:** `04` says a compliant app "may display a BYOM badge linking back to the constitution site," and the badge README fixes the link target as the site root (`https://BYOM-SITE/`), "a long-lived external contract." But the domain is an explicit placeholder — the README itself states "The site domain is not yet chosen." So an app that has closed every conformance box still cannot display a *correctly-linked* badge: the only blessed link target does not resolve. The celebration step (badge) depends on an artifact (the constitution site) that does not exist. The constitution gives no fallback (e.g. "link to the source repo until the site lands") and no way to mark the badge "compliant but unlinked," so each consumer must either improvise a non-blessed target or defer the badge entirely.
- **What you did instead:** deferred the badge to a follow-on change rather than improvise a link to the byom source repo. Recorded the deferral (with the unresolved link target as one of three named blockers) in `BYOM-INTEGRATION.md`'s deviations; the conformance gate is closed, the celebration is not.
- **Suggested BYOM improvement:** in `04` (or the badge README), bless an interim link target for the period before the site domain lands (e.g. the constitution source repo), or state explicitly that a compliant app may display the badge unlinked/with a deferred href until the site exists — so "fully compliant" and "can display a correctly-linked badge" are not coupled to an external that no consumer controls.

### The badge and registry artifacts live under `website/`, which AGENTS.md tells agents to ignore

- **Where:** `vendor/byom/AGENTS.md` > "What to ignore" ("Ignore `website/` entirely… do not read it, do not base implementation decisions on it"); vs `04-badge-and-registry.md` and `05-integration-guide.md` > "Registry submission" / "Conformance checklist" (badge + registry)
- **In the context of:** `finalize-byom-integration`, tasks 2.1 and 5.1
- **The friction:** The badge assets (`website/public/assets/badge/`), the badge embed contract (`website/public/assets/badge/README.md`), and the registry (`website/registry/registry.yaml` + `registry.schema.json` + `README.md`) all physically live under `website/`. But `AGENTS.md` — the entry point every implementing agent is told to read first — instructs agents to ignore `website/` *entirely* and "do not base implementation decisions on it." So the constitution requires an app to display the badge and submit a registry entry, while directing the agent who would do so to never read the files that define how. An agent following AGENTS.md literally cannot discover the badge `alt` text, the embed snippets, the link target contract, or the registry field reference. The movement-facing/site vs. implementation authority split is reasonable for `website/`'s prose pages, but the badge and registry are *implementation contracts* misfiled under the ignored tree.
- **What you did instead:** read the badge and registry files under `website/` despite the ignore directive (they are the only source for the embed contract and schema), because `04`/`05` require them. Flagged the tension here rather than treating it as an app bug.
- **Suggested BYOM improvement:** move the badge artifact contract and the registry schema/README out of `website/` into a constitution-level location (e.g. `constitution/` or a top-level `badge/` + `registry/`), or amend `AGENTS.md` to carve out the badge/registry files as *implementation authority* despite living under `website/`. The "ignore `website/`" rule should not cover files that `04`/`05` make load-bearing for consumers.

### The deviations list can drift from the conformance checklist with no sync requirement

- **Where:** `05-integration-guide.md` > "Authoring `BYOM-INTEGRATION.md`" (section 9, "Deviations from the constitution, and why") and "Conformance checklist"
- **In the context of:** `finalize-byom-integration`, task 2.1 (the first full checklist re-walk since change A)
- **The friction:** `05` lists ten sections the integration doc must have, including a deviations section, and separately a 12-box conformance checklist. But nothing requires the deviations list to stay *reconciled* with the checklist. Each change B–F closed its own deviation and updated the doc, but no change re-walked all 12 boxes, so an unchecked box (free/open-source) went unrecorded — the deviations list said "only the badge is missing" while a checklist box was actually red. The integration-doc spec gives no "the deviations list SHALL reflect a current walk of the checklist" obligation, so drift is the default state for any multi-change adoption.
- **What you did instead:** re-walked all 12 boxes in change G, found and closed the open-source gap, and corrected the deviations list to match. Added a `byom-consumption` license requirement so the box now has a spec-backed acceptance signal.
- **Suggested BYOM improvement:** in `05`, tie the deviations section to the checklist — e.g. "the deviations section SHALL be the set of unchecked conformance-checklist boxes, each with its reason" — so the two cannot drift apart, and a reader of `BYOM-INTEGRATION.md` can reconstruct the checklist state from the deviations list alone.

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

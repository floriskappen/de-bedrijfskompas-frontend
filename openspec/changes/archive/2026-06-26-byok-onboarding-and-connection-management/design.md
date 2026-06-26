## Context

The BYOK layer is constitutionally compliant on invariants 1–6 and cost transparency (changes B–E), but the `03-wizard-ux-contract.md` deviation remains: the setup sheet is a first-run key/allowance form that (a) never walked a first-time key holder through what a key is, where to get one, the provider spend limit, or the honest threat model, and (b) becomes unreachable once a key is confirmed — `requestByok` (MapView.tsx:535) short-circuits when `hasConfirmedByokConfig()`, so after first confirm the only re-entry is the 401-clear error path. `03` says "the wizard is the first-run instance of a persistent connection surface, not a one-time door" — today the surface is one-time. `clearByokKey()` exists (storage.ts:189) but is wired only on 401; there is no user-facing clear/rotate. A bundled IA move relocates the Ikigai entry into the filter panel.

## Goals / Non-Goals

**Goals:**
- Split the single sheet into a lean first-run setup and an always-reachable BYOM settings surface, so management is reachable after connecting.
- Satisfy `03` must-cover items 1 (what connecting does/costs), 2 (get a key), 6 (threat model), and the `02` "require both" provider spend-limit prompt.
- Add the clear-key control; rotate already works via re-entry.
- Move the Ikigai entry into the filter panel.

**Non-Goals:**
- Request-boundary, budget, cost-bus, history, or CSP changes (B–E are done).
- A multi-step onboarding wizard (progressive inline disclosure instead).
- A `/over/` security page (threat model restated inline).
- Renaming the internal `byok` layer to "BYOM" (the mapping stays recorded in `BYOM-INTEGRATION.md`).

## Decisions

### Split into lean first-run setup + persistent settings sheet, sharing sub-pieces

`ByokSetupDialog` becomes the first-run setup sheet (onboarding copy, key, model, persistence, allowance, provider-spend-limit prompt, threat model); a new settings sheet hosts the living management surface (model change, budget adjust, clear/rotate key, usage, spend history). Shared sub-components (`ModelChooser`, `BudgetField`, `KeySection`, `SpendHistory`) serve both so model+budget controls don't drift between contexts. Why split: realizes `03`'s "first-run instance of a persistent surface" literally and fixes the unreachable-after-confirm gap. Alternative: one sheet with a `mode` flag (noisy for returning users; doesn't shed the spend/history that belongs in management).

### BYOM settings button: always-visible, two-mode

A new map chrome control opens the settings sheet when a key is configured, and the first-run setup sheet when one is not — one button, two modes. Why always-visible: satisfies `03`'s "always reach a way to" without the "never ambient" tension — a settings cog is a neutral management affordance, not a connect-nudge (it doesn't push connection; the visitor clicks it). Alternative: only show after connection (then first-run users have no entry except the gate, weakening "always reach"). Button label is lowercase user-facing copy (`model`/`llm`, mirroring `byok_title: "own llm key"`), not the constitution's "BYOM" term.

### Settings surface is a full-screen in-app view, not a route (invariant 1)

The persistent connection-management surface is presented as a **full-screen in-app
view** (a React-island state flip covering the map, `z-80`), reached from the chrome
gear and the cost-overlay manage affordance. The onboarding surface stays the
**bottom-sheet popover** reached from the Ikigai gate. Presentation follows the entry
point — `data-byok-variant="settings" | "onboarding"` — while the inner mode
(`data-byok-mode`) still derives from key state. Why not a real route (`/instellingen`):
the active session key is an **in-memory module variable** (`storage.ts` `sessionApiKey`),
per invariant 1 (in-memory by default, opt-in persistence). A real page navigation is a
full document load that tears down the JS context and **drops the unsaved session key** —
the settings page would read "disconnected" for the privacy-default (non-saved) user.
Surviving a navigation would require moving the key into `sessionStorage`, which weakens
invariant 1's posture (origin-readable storage for the whole tab session). The full-screen
in-app view gives the "settings page" feel (full-screen, not a cramped popover — the
thing the user actually objected to) without the route's cost. The settings button could
later gain a real URL only if the session-key posture is revisited; recorded as the open
trade-off, not a deviation. Alternative: route + `sessionStorage` (clean URL, softer
invariant 1; logged as `BYOM_STRUGGLES` friction if taken — not taken here).

### Onboarding content: progressive disclosure, prompt-not-gate, inline threat model

The first-run setup carries a "first time?" block, open by default when unconfigured and collapsed/hidden once confirmed — progressive disclosure, not a wizard (matches the bottom-sheet pattern and ontwerp minimalism; `03` mandates guarantees, not steps). The provider spend-limit is **copy + a link to `https://openrouter.ai/settings/credits`**, not an acknowledgment gate — the app cannot verify the user set it (browser-local, no backend; calling OpenRouter with the key to check would violate invariant 2), so a gate would be theatre. The app ceiling (D) is the soft guard; the provider limit is the hard cap; both are presented honestly. The threat model is a ~2-sentence inline restatement ("your key stays in your browser and calls openrouter directly; a privacy and control win, not a cryptographic guarantee"), in both setup and settings. Alternative for the threat model: a `/over/` security page linked from the sheet — deferred (more scope; `03` allows "restate").

### Ikigai entry → filter panel affordance that opens the existing flow

The filter panel gains an Ikigai entry (shaped like the favorites switch); activating it closes the filter panel and opens `IkigaiFlowDialog` via the existing `requestByok` gate. The flow itself and its BYOK gate are unchanged — only the entry point moves. Why not nest the wizard inside the filters sheet: the Ikigai flow is a heavy multi-stage dialog (menu/wizard/deriving/tune/judging/results/refine); nesting it in the filters bottom sheet would be modal-in-modal awkwardness. The move reframes Ikigai as an advanced filter (honest IA — it filters companies by personal direction) and frees the chrome slot the settings button takes. Alternative: keep a dedicated Ikigai chrome button (5 chrome controls; loses the IA honesty the visitor's reasoning wants).

### Clear-key disabled while an Ikigai pass is in-flight

The settings-surface clear button calls `clearByokKey()` (wipes session + saved key, emits `BYOK_CHANGED_EVENT`, which the sheet already subscribes to and re-reads) but is disabled while `isByokLeaveGuarded()` via the in-flight-request path, so a visitor cannot break a running paid pass by clearing mid-run. Rotate (re-entering a key) follows the same guard. Alternative: allow clear mid-run (breaks the pass; the boundary's in-flight count would orphan).

## Risks / Trade-offs

- **Provider spend-limit prompt is unverifiable** → honest copy states the app cannot check it; no gate; logged as `BYOM_STRUGGLES` friction ("prompted" has no acceptance signal, like the logged leave-warning/in-flight struggles).
- **"Legible to a first-time key holder" is subjective** → Playwright asserts the copy, the OpenRouter link, and the threat-model line are present in the first-run sheet; it cannot assert *legibility*; logged as `BYOM_STRUGGLES` friction (rhymes with the logged "surface suitable options" minimum-bar struggle).
- **Setup/settings split risks control drift** → shared `ModelChooser`/`BudgetField`/`KeySection`/`SpendHistory` sub-components used by both sheets; one source per control.
- **Ikigai-in-filters discoverability** → the entry sits alongside filters (favoured discovery surface); the `ByokCostOverlay` still gives contextual spend visibility during/after a run, so spend remains legible independent of the entry move.
- **Clear mid-run** → disabled while in-flight (above); the 401-clear path in `client.ts` is unchanged and still the automatic stale-key clear.

## Implementation notes

- **One adaptive component, not two files.** The "two sheets" of decision 1 are realized as one `ByokSetupDialog` in two modes (`data-byok-mode="onboarding" | "manage"`), derived from key state (saved key or confirmed session → manage; otherwise onboarding). This avoids two components drifting and lets callers just open the sheet; the UX outcome is identical to the split. An `updateByokConfig` storage helper persists model/budget changes in manage mode without touching the key.
- **Presentation is a second, orthogonal dimension.** A `variant` prop (`"onboarding" | "settings"`, defaulting to onboarding) chooses the *frame*, independent of `mode`: `settings` renders the full-screen in-app view (`.byok-settings-fullscreen`, centred `.byok-settings-view`, no backdrop-click dismiss), `onboarding` renders the bottom-sheet popover (`.byok-sheet`, backdrop-click dismiss). MapView sets the variant per entry point (gear + cost-overlay manage → `settings`; Ikigai gate → `onboarding`). Confirming a key always closes the surface and runs any continuation — the gear/manage paths carry no continuation, so they simply close; reopening the gear with a key now present lands on `manage`.
- **Chrome control is a settings/gear glyph.** The map chrome button (and the cost-overlay manage controls) use a cog glyph so the affordance reads unambiguously as "settings", not a key/connect nudge.
- **Routing refinement: saved key *or* session.** The management surface opens when a saved key OR a confirmed session exists (not "confirmed" alone), so a returning user with a saved key sees their spend/history and the reuse path without first re-confirming. The first-run setup opens only when no key is present at all. The map-overview spec scenarios use this wording.
- **Cost-overlay manage affordance realized (design option C).** The fullscreen Ikigai flow (`z-[75]`) covers the chrome during a run, so the settings button is unreachable mid-run. A small "manage" affordance on the cost overlay (`z-80`, visible during a paid request) opens the management surface — making it genuinely always-reachable, including during the one moment the user is most aware of spend, and giving the in-flight disabled-state an observable test path.

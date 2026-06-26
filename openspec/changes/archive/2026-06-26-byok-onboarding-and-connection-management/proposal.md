## Why

The BYOK setup sheet is a first-run key/allowance form that becomes unreachable once a key is confirmed, and it never walked a first-time key holder through what a key is, where to get one, the provider-side spend limit, or the honest threat model. This closes the last open BYOM deviation (`vendor/byom/constitution/03-wizard-ux-contract.md`) and realizes `03`'s "the wizard is the first-run instance of a persistent connection surface" by splitting the single sheet into a lean first-run setup and an always-reachable BYOM settings surface. A bundled IA move relocates the Ikigai entry into the filter panel as an advanced filter affordance.

## What Changes

- Add a persistent **BYOM settings** surface, reached from a new map chrome control (a settings/gear glyph), for connection management: change model, adjust budget, clear/rotate the key, and view spend history/usage. It is presented as a **full-screen in-app view** (not a route — a page load would drop the in-memory session key, invariant 1; see design). This is the always-reachable surface `03` "After connecting" requires; today the sheet is unreachable after first confirm except via the 401-clear path.
- Make the first-run **setup sheet lean**: onboarding copy (what connecting does, who pays), a concrete OpenRouter get-a-key link (`https://openrouter.ai/keys`), a provider-side spend-limit prompt (`https://openrouter.ai/settings/credits` — the hard cap), and an honest threat-model restatement. Spend/history moves out to the settings surface so the setup sheet is a focused first-run walkthrough.
- Add a **clear-key** control in the settings surface (`clearByokKey()` already exists in `storage.ts`; rotate already works via re-entry).
- Move the **Ikigai entry into the filter panel** as an advanced filter affordance and remove the dedicated Ikigai chrome button. The Ikigai matching flow itself and its BYOK gate are unchanged — only the entry point moves.
- No request-boundary, budget, CSP, or cost-bus changes; **no data-contract change** with the pipeline.

## Capabilities

### New Capabilities

- _none_ — both surfaces extend the existing `bring-your-own-key-llm` capability.

### Modified Capabilities

- `bring-your-own-key-llm`: add a first-time-key-holder onboarding requirement and a persistent connection-management-surface requirement; modify Provider setup (the setup sheet sheds spend/history to the settings surface and gains onboarding framing) and the Cost transparency "setup sheet shows spend" scenario (the cumulative spend + history surface moves to the connection-management surface).
- `map-overview`: modify Map chrome (swap the Ikigai chrome button for a BYOM settings chrome button) and Filter panel (add the Ikigai entry as an advanced filter affordance that opens the matching flow).

## Impact

- **Routes:** `/` and `/en/` (the map chrome). No new route is added — the settings surface is a full-screen in-app view inside the map island, so the in-memory session key survives (invariant 1).
- **Code:** `src/components/ByokSetupDialog.tsx` is one adaptive component carrying both `mode` (onboarding/manage, from key state) and `variant` (onboarding bottom-sheet / settings full-screen, from entry point); `src/components/MapView.tsx` (chrome: replace `ikigai-button` with a BYOM settings/gear button, drive `byokVariant`; filter panel: add the Ikigai entry that closes the panel first; cost-overlay manage opens the settings variant). `src/styles/global.css` (`.byok-settings-fullscreen` / `.byok-settings-view`). `src/lib/byok/storage.ts` (`clearByokKey` already present; no boundary change). `src/lib/i18n/messages.ts` (onboarding, threat-model, clear-key, settings, and Ikigai-entry labels — nl + en, lowercase). `IkigaiFlowDialog.tsx` is unchanged at its API level.
- **Provider links:** the get-a-key and credits links are anchor navigations opened in a new tab (`target="_blank" rel="noopener"`); they are not fetches, so the closed `connect-src` CSP is unaffected.
- **Dependencies:** none added.
- **Constitution:** closes the `03-wizard-ux-contract.md` deviation (onboarding + connection management). `BYOM-INTEGRATION.md` updated; constitution-level friction logged to `BYOM_STRUGGLES.md`.

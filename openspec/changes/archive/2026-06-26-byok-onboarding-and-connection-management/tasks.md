## 1. Shared sub-components + storage reuse

- [x] 1.1 Extract shared sub-pieces from `ByokSetupDialog.tsx` (`ModelChooser`, `BudgetField`, `KeySection`, `SpendHistory`) so the first-run setup sheet and the new settings sheet both consume them without drift; follow existing `byok-sheet`/`byok-field` patterns and ontwerp values, no new raw tokens.
- [x] 1.2 Reuse the existing `clearByokKey()` (`src/lib/byok/storage.ts`) for the clear control; confirm it wipes the in-memory `sessionApiKey` + persisted `savedKey` and emits `BYOK_CHANGED_EVENT`. No request-boundary (`client.ts`) or storage-shape change in this change.

## 2. i18n

- [x] 2.1 In `src/lib/i18n/messages.ts`, add localized keys (nl + en, lowercase, kept in sync) for: onboarding copy (what connecting does, who pays), the get-a-key link label, the provider-spend-limit prompt copy, the threat-model restatement line, clear-key label, rotate label, the settings-sheet title, and the Ikigai filter-panel entry label. Do not surface the constitution term "BYOM" to visitors; use lowercase `model`/`llm` wording mirroring `byok_title`.

## 3. First-run setup sheet (onboarding)

- [x] 3.1 Make the first-run setup sheet lean: add a progressive-disclosure "first time?" block (open by default when no confirmed config, collapsed/hidden once confirmed) carrying the onboarding copy, a get-a-key link to `https://openrouter.ai/keys` (`target="_blank" rel="noopener"`), the provider-spend-limit prompt + link to `https://openrouter.ai/settings/credits` (informational, no acknowledgment gate), and the ~2-sentence threat-model restatement. Move the spend/history block out to the settings sheet.
- [x] 3.2 Playwright `byok-onboarding.spec.ts` → `first-run setup explains connecting and costs` (scenario: First-run setup explains connecting and costs): open setup with no confirmed config, assert the localized onboarding copy is present in the active locale.
- [x] 3.3 Playwright `byok-onboarding.spec.ts` → `first-run setup links to obtain a key` (scenario: First-run setup links to obtain a key): assert an anchor `href="https://openrouter.ai/keys"` with `rel="noopener"`.
- [x] 3.4 Playwright `byok-onboarding.spec.ts` → `first-run setup prompts the provider spend limit` (scenario: First-run setup prompts the provider spend limit): assert the spend-limit copy and a link to `https://openrouter.ai/settings/credits`, and assert no blocking acknowledgment control gates confirmation.
- [x] 3.5 Playwright `byok-onboarding.spec.ts` → `first-run setup restates the honest threat model` (scenario: First-run setup restates the honest threat model): assert the threat-model restatement text is present.

## 4. Connection management settings sheet

- [x] 4.1 Create the settings sheet component using the shared sub-pieces: change model (within the feature's `worker` category), adjust allowance, clear/rotate key, and the cumulative spend + recent spend history (moved out of the setup sheet). Subscribe to `BYOK_SPEND_CHANGED_EVENT` so it updates live.
- [x] 4.2 Wire the clear-key control to `clearByokKey()`; disable both clear and rotate while `isByokLeaveGuarded()` (the in-flight-request path from `leaveGuard.ts`). On clear, the sheet re-reads config via `BYOK_CHANGED_EVENT` and returns to the first-run state.
- [x] 4.3 Playwright `byok-connection-management.spec.ts` → `connection management surface is reachable after connecting` (scenario: Connection management surface is reachable after connecting): confirm a key, open the settings sheet, assert model/allowance/clear/history are exposed.
- [x] 4.4 Playwright `byok-connection-management.spec.ts` → `connection management surface shows cumulative spend and history` (scenario: Connection management surface shows cumulative spend and history): stub a completed BYOK request, open the settings sheet, assert the cumulative total, allowance progress, and a recent record appear in the active locale.
- [x] 4.5 Playwright `byok-connection-management.spec.ts` → `clearing the key returns to the first-run state` (scenario: Clearing the key returns to the first-run state): with no in-flight request, activate clear, assert the surface returns to first-run state and `getSessionByokApiKey()` is null.
- [x] 4.6 Playwright `byok-connection-management.spec.ts` → `clear and rotate are disabled during an in-flight paid request` (scenario: Clear and rotate are disabled during an in-flight paid request): via `page.route`, stub a delayed streaming OpenRouter response, start an Ikigai pass, open the settings sheet, assert clear + rotate are disabled, then assert they re-enable after the stream settles.

## 5. Map chrome: connection-management button

- [x] 5.1 In `src/components/MapView.tsx`, replace the `ikigai-button` chrome control with a connection-management button. Wire it to open the settings sheet when `hasConfirmedByokConfig()`, else the first-run setup sheet. Remove `setIsIkigaiOpen` from the chrome button (Ikigai now opens only from the filter panel).
- [x] 5.2 Playwright `byok-chrome-entry.spec.ts` → `connection-management button opens the management surface` (scenario: Connection-management button opens the management surface): with a confirmed config, activate the button, assert the settings sheet opens.
- [x] 5.3 Playwright `byok-chrome-entry.spec.ts` → `connection-management button opens first-run setup` (scenario: Connection-management button opens first-run setup): without a confirmed config, activate the button, assert the first-run setup opens.

## 6. Filter panel: Ikigai entry

- [x] 6.1 In `src/components/MapView.tsx` filter panel, add the Ikigai entry as an advanced filter affordance (shaped like the favorites switch). Activating it closes the filter panel and calls `requestByok` → opens `IkigaiFlowDialog` when configured, or the first-run setup when unconfigured. Keep the BYOK gate (`requestByok`) unchanged.
- [x] 6.2 Playwright `ikigai-filter-entry.spec.ts` → `ikigai entry opens the matching flow` (scenario: Ikigai entry opens the matching flow): with a confirmed config, open the filter panel, activate the Ikigai entry, assert the filter panel closes and the Ikigai matching flow opens.
- [x] 6.3 Playwright `ikigai-filter-entry.spec.ts` → `ikigai entry opens BYOK setup when unconfigured` (scenario: Ikigai entry opens BYOK setup when unconfigured): without a confirmed config, activate the Ikigai entry, assert the filter panel closes and the first-run setup opens.

## 7. Regression / keep-green

- [x] 7.1 Keep `byok-reconnect.spec.ts` green: the 401 stale-key path in `client.ts` still clears the key and re-opens setup; the chrome change must not break it.
- [x] 7.2 Update `byok-cost-transparency.spec.ts` spend/history assertions to the new settings-sheet location (selectors move from the setup sheet to the settings sheet); keep the live-cost and leave-warning assertions green.
- [x] 7.3 Keep `byok-model-categories.spec.ts` green: the category chooser now lives in the shared `ModelChooser` used by both sheets.
- [x] 7.4 Keep the existing `Visitor configures OpenRouter` scenario green (first-run setup still confirms a key into a usable session config).

## 8. Constitution conformance records

- [x] 8.1 Update `BYOM-INTEGRATION.md`: resolve the `03-wizard-ux-contract.md` onboarding + connection-management deviation; update "How to get and connect a key" (first-run walkthrough + OpenRouter links + provider spend-limit prompt + threat model), "Where spend and budget appear in the UI" (settings surface), and the invariant mapping; add a propagation-log entry for change F noting the bundled Ikigai-into-filters IA move.
- [x] 8.2 Append friction entries to `BYOM_STRUGGLES.md`: "prompt setting a provider spend limit" has no acceptance signal (the app cannot verify/enforce it); "legible to a first-time key holder" is untestable beyond copy/link presence. If no further friction arises, state so explicitly with the reason.

## 9. Verify

- [x] 9.1 Run `npx astro check` (typecheck) and `npm test` (vitest); all green.
- [x] 9.2 Run `npm run test:e2e` (Playwright) for the new + existing byok/ikigai specs; all green.
- [x] 9.3 Run `openspec status --change byok-onboarding-and-connection-management` and confirm apply-ready; run the `byom-consumption` spec test to confirm the pin/invariant mapping still holds.

## 10. Presentation refinement: full-screen settings surface + UI fixes

Post-implementation pass after a UI review: the connection-management surface is
re-presented as a **full-screen in-app view** (not the bottom sheet), the onboarding
surface stays the bottom-sheet popover, plus a set of bundled UI fixes on the change's
surfaces.

- [x] 10.1 Add a `variant` ("onboarding" | "settings") prop to `ByokSetupDialog` that chooses the *frame* independent of `mode`: `settings` → full-screen in-app view (`.byok-settings-fullscreen` / `.byok-settings-view`, no backdrop-click dismiss), `onboarding` → bottom-sheet popover. Decision recorded in `design.md` (route would drop the in-memory session key, invariant 1).
- [x] 10.2 Wire `byokVariant` in `MapView.tsx`: chrome gear + cost-overlay manage → `settings`; Ikigai gate → `onboarding`. Settings-button SVG (and cost-overlay manage controls) swapped to an unambiguous settings/gear glyph.
- [x] 10.3 Assert presentation per entry point: `byok-chrome-entry.spec.ts` (gear → `data-byok-variant="settings"` + `.byok-settings-fullscreen` visible), `ikigai-filter-entry.spec.ts` (gate → `data-byok-variant="onboarding"`, no full-screen, filter panel closed).
- [x] 10.4 Ikigai gate closes the filter panel in **both** branches (key present and no-key onboarding), so the popover never stacks over the filters sheet.
- [x] 10.5 Cost overlay (`ByokCostOverlay.tsx`): drag transform/opacity ride the root so the dithered shadow tracks the card; fix the reduced-motion selector (`.byok-cost-overlay-root`); add `onPointerCancel` reset; expose the manage gear from the collapsed pill; add a `grabbing` cursor.
- [x] 10.6 Settings spend-head: show spent and the allowance ceiling as distinct facts (no repeated current-spend); update `byok-connection-management` + `byok-cost-transparency` spend assertions to match.
- [x] 10.7 Ikigai result card axis row: render the glyph + focus-meter per axis (mirroring the favorites compass) instead of bare unlabeled meters; safe optional chaining on axis scores.
- [x] 10.8 Ikigai filter-panel entry locked to the favorites switch's height (shared `min-height`) so the two rows read as one control group.
- [x] 10.9 Re-run vitest (130) + the byok/ikigai/map Playwright specs; all green. Log the `03`-vs-invariant-1 presentation tension to `BYOM_STRUGGLES.md`.

## 11. Second polish pass: onboarding explainer, CTA, icon, manage layout

A follow-up review pass on the same surfaces (copy + visual).

- [x] 11.1 Settings/manage view: full-bleed on mobile, a centred framed card (`min-width: 640px`) on desktop instead of a stretched column. Key-state redesigned as a framed status block — a live/saved dot + label on one line, the key actions in an aligned row below (`.byok-key-state` grid + `.byok-key-actions`), fixing the badge/buttons wrapping.
- [x] 11.2 Chrome settings button + cost-overlay manage controls: replaced the radial-spoke glyph (read as a sun / theme switch) with a proper toothed cog.
- [x] 11.3 Ikigai filter entry: rebuilt from a filter-row look-alike into a distinct, optional CTA — an eyebrow + hairline separator, a warm-surfaced card with an accent left edge, a framed icon, and a title + one-line description (`ikigai_filter_entry_sub`). Reads as a separate concrete action, not the default/best one (no solid accent fill). Removed the favorites-switch height pairing.
- [x] 11.4 Onboarding "first time?" explainer rewritten: the toggle is the visitor's own question ("what's an api key?") with a chevron-disclosure matching the company-detail axis rows (`.byok-onboarding-panel` grid-rows expand); the body is three numbered, eyebrow-labelled steps (who pays / get a key / set a limit) instead of a paragraph wall; threat-model line kept. Fixed the nl mistranslation ("belt" → "gaat rechtstreeks naar"). New i18n keys (nl+en, lowercase): `byok_onboarding_lead`, `byok_step_pay`, `byok_step_key`, `byok_step_key_tail`, `byok_step_limit`, `byok_spend_limit_link`, `ikigai_filter_entry_sub`; reworded `byok_first_time`, `byok_onboarding_intro`, `byok_spend_limit`, `byok_threat_model`. Onboarding test ids/copy anchors (`#byok-onboarding`/`#byok-get-key-link`/`#byok-spend-limit-link`/`#byok-threat-model`, "taalmodel"/"uitgavelimiet"/"geen cryptografische garantie") preserved.
- [x] 11.5 Re-run vitest (130) + byok/ikigai/map Playwright (72); all green.

## 1. Design System And Structure

- [x] 1.1 Read `vendor/ontwerp/AGENTS.md` plus the relevant language, recipe, zoo, and values files for the BYOK setup surface and map chrome control.
- [x] 1.2 Record any adopted BYOK/map-chrome visual adaptations or omissions in `.design/DESIGN.md`.
- [x] 1.3 Create the BYOK module structure for provider config, local storage, allowance state, request execution, and normalized error types.
- [x] 1.4 Add localized lowercase UI strings for the Ikigai entry point, BYOK setup, saved-key confirmation, allowance, cost placeholder, and provider error states.

## 2. BYOK State And Request Boundary

- [x] 2.1 Implement defensive storage normalization for provider, selected model, saved-key preference, saved-key presence, allowance, and usage metadata.
- [x] 2.2 Implement session-first key handling so unsaved keys remain in memory and saved keys require explicit visitor opt-in.
- [x] 2.3 Implement saved-key reuse confirmation without rendering the raw saved key.
- [x] 2.4 Implement local allowance checks and usage updates from provider-reported usage/cost where available, with unknown or estimated cost fallback.
- [x] 2.5 Implement the reusable LLM request boundary that accepts calling-feature prompt payloads and returns either content plus usage metadata or a normalized app error.
- [x] 2.6 Ensure the BYOK layer does not persist prompt text, response content, or feature-specific histories.

## 3. OpenRouter Provider

- [x] 3.1 Verify the exact OpenRouter model id for the requested DeepSeek V4 Flash default and place it in provider configuration.
- [x] 3.2 Implement the OpenRouter browser adapter with provider-specific request shape, authorization header, response extraction, and usage metadata extraction.
- [x] 3.3 Map provider/network failures to normalized categories: invalid key, insufficient credit, allowance exceeded, rate limit, network failure, and malformed response.
- [x] 3.4 Keep the provider adapter isolated so future providers can be added without changing matching-flow callers.

## 4. UI Integration

- [x] 4.1 Build the BYOK setup sheet/modal using pinned ontwerp values, with OpenRouter selected, API key input, save-for-next-time control, allowance input, cost placeholder, and confirmation action.
- [x] 4.2 Build the saved-key confirmation state for returning visitors with saved provider metadata and no raw-key display.
- [x] 4.3 Surface normalized provider and allowance errors in localized setup/request UI.
- [x] 4.4 Add an icon-only Ikigai/matching control to the map overview chrome using the existing map chrome idiom.
- [x] 4.5 Wire the Ikigai/matching control so it opens BYOK setup when no confirmed LLM configuration exists and does not run matching prompts in this change.

## 5. Tests And Verification

- [x] 5.1 Add unit tests named `byok storage keeps unsaved key session only` covering `Unsaved key is session-only`.
- [x] 5.2 Add unit tests named `byok saved key requires confirmation without revealing secret` covering `Saved key requires reuse confirmation`.
- [x] 5.3 Add unit tests named `byok allowance blocks exhausted requests` covering `Allowance blocks new request`.
- [x] 5.4 Add unit tests named `byok provider usage updates allowance state` covering `Provider usage updates local state`.
- [x] 5.5 Add unit tests named `byok request boundary returns content and usage` covering `Calling feature receives successful response`.
- [x] 5.6 Add unit tests named `byok request boundary does not persist prompts or responses` covering `BYOK does not persist feature history`.
- [x] 5.7 Add unit tests named `byok normalizes invalid key and malformed responses` covering `Invalid key is normalized` and `Malformed response is normalized`.
- [x] 5.8 Add browser tests named `byok setup configures openrouter with cost placeholder` covering `Visitor configures OpenRouter` and `Cost estimate placeholder is visible`.
- [x] 5.9 Add browser tests named `map ikigai button opens byok setup` covering `Ikigai chrome button opens BYOK setup`.
- [x] 5.10 Run the relevant unit tests, browser tests, typecheck, and OpenSpec status checks for this change.

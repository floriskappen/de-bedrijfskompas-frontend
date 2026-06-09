## Why

The Ikigai matching flow needs LLM inference, but the frontend has no backend and should not absorb provider costs or hold server-side secrets. A browser-local bring-your-own-key setup gives visitors explicit control over provider access while creating a reusable LLM boundary for the later matching feature.

## What Changes

- Add a reusable browser-local LLM access capability with OpenRouter as the first provider.
- Let visitors paste an API key, choose whether to save it locally, confirm saved-key reuse, and set a local allowance before LLM calls run.
- Add provider/model configuration with a cost-estimate placeholder and exact model-id verification during implementation.
- Normalize provider failures such as invalid keys, insufficient credit, allowance exhaustion, rate limits, network failures, and malformed responses.
- Add an Ikigai/matching entry control to the map overview that opens the BYOK setup when no confirmed LLM configuration is available.
- Keep actual Ikigai questions, ISCO matching, LLM prompts, result persistence, and reruns out of this change.

## Capabilities

### New Capabilities

- `bring-your-own-key-llm`: browser-local provider setup, optional key persistence, allowance tracking, reusable request execution, and normalized LLM errors.

### Modified Capabilities

- `map-overview`: add a map chrome entry point for the future Ikigai matching flow that gates entry through BYOK setup.

## Impact

- Affects the map overview React island and localized map chrome strings.
- Adds browser-local storage for LLM provider configuration, optional saved API key, allowance, and usage metadata.
- Adds an OpenRouter client adapter that calls the provider directly from the browser using the visitor's key.
- Does not change the company JSON data contract or pipeline interface.

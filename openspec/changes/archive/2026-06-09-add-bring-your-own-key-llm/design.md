## Context

The frontend is static Astro with React islands for interactive map behavior. There is no backend that can broker LLM calls, hold provider secrets, or absorb inference costs. Ikigai matching will need repeated LLM calls later, so this change creates the shared browser-local LLM access layer first and exposes it from the map entry point.

The current local-only pattern is the favorites store: defensive localStorage parsing, normalized payloads, and custom browser events for live updates. BYOK can follow that pattern for non-secret metadata, but saved API keys deserve clearer consent and a session-first default because any persistent browser storage is readable by scripts running on the page.

## Goals / Non-Goals

**Goals:**

- Provide a reusable LLM client boundary for future browser-only features.
- Support OpenRouter as the first provider and keep provider-specific behavior isolated.
- Let visitors paste a key, optionally save it locally, confirm saved-key reuse, and set a local allowance.
- Normalize provider errors into app-level states that UI and future flows can handle.
- Add a map chrome entry button for the future Ikigai matching flow that opens BYOK setup when needed.

**Non-Goals:**

- No Ikigai questionnaire, ISCO tag inference, prompt design, result ranking, or saved matching history.
- No backend proxy, server-side secret storage, accounts, analytics, or cookies.
- No pipeline/company data contract changes.
- No multi-provider UI beyond the OpenRouter option, though the structure should allow future providers.

## Decisions

1. Browser-local provider registry with OpenRouter first.

   The provider layer will expose stable app-level operations while hiding OpenRouter URL, request headers, model id, usage fields, and error mapping. A generic "provider" abstraction is useful now because future OpenAI, Anthropic, or Google support should not force Ikigai code to change. A one-off OpenRouter fetch was considered, but it would leak provider mechanics into feature flows.

2. Session-first key handling, with explicit persistent save.

   A pasted key should live in memory by default. If the visitor opts into "save for next time", the app may persist it in browser-local storage and must show saved-key presence without revealing the raw key on reuse. Persistent browser storage is convenient but not equivalent to secure secret storage; the UI should frame it as "on this device" rather than implying account-level safety.

3. Reusable request boundary returns normalized outcomes.

   Calling features should receive either content plus usage/cost metadata, or a small app error category such as invalid key, insufficient credit, allowance exceeded, rate limited, network error, or bad response. This keeps Ikigai prompt code from depending on provider HTTP status details. Provider raw responses should not be stored by the BYOK layer.

4. Local allowance is enforced before and after calls.

   The app should prevent calls once local allowance is exhausted and update usage after provider responses when usage/cost data exists. When exact provider cost is unavailable, the app should record an estimate or "unknown" cost and avoid claiming precision. This is a local guardrail, not a provider-side spend cap.

5. Map entry opens setup, not the matching flow.

   The new map chrome control can introduce the future matching mode without implementing matching. If no confirmed LLM configuration exists, it opens the BYOK setup. If configuration is confirmed, the later Ikigai change can continue from the same entry point. This keeps route behavior observable while preserving feature boundaries.

## Risks / Trade-offs

- Saved keys in browser storage are vulnerable to any script running on the page -> default to session-only, require explicit save consent, never reveal saved raw keys in UI, and avoid third-party script additions.
- OpenRouter cost/usage reporting may be incomplete or model-dependent -> track provider-reported values when available and present estimates/placeholders honestly.
- Direct browser calls can fail due to CORS, provider policy, or network conditions -> keep an adapter seam and surface normalized provider/network errors.
- Model identifiers can drift -> verify the requested DeepSeek model id during implementation and keep it in provider config rather than feature logic.
- A new map chrome control can crowd the existing map UI -> use the existing icon-only chrome idiom and pinned ontwerp values, then record any app-specific visual extension in `.design/DESIGN.md` during implementation.

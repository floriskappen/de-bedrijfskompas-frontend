# bring-your-own-key-llm Specification

## Purpose
TBD - created by archiving change add-bring-your-own-key-llm. Update Purpose after archive.
## Requirements
### Requirement: Provider setup

The app SHALL provide a browser-local first-run LLM setup flow that supports OpenRouter as the available provider, lets the visitor provide an API key, lets the visitor choose a model within the category the app's model-powered features declare, and SHALL require explicit visitor confirmation before the app treats the configuration as usable for LLM requests.

#### Scenario: Visitor configures OpenRouter

- **WHEN** a visitor selects OpenRouter, enters an API key, and confirms setup
- **THEN** the LLM configuration is available for browser-local requests in the current session

### Requirement: Optional local key persistence

The app SHALL keep pasted API keys in browser memory by default and SHALL persist the key only when the visitor explicitly chooses to save it for next time. Saved-key state SHALL remain local to the browser, SHALL NOT require accounts or backend requests, and SHALL NOT expose the raw saved key in confirmation UI.

#### Scenario: Unsaved key is session-only

- **WHEN** a visitor confirms setup without choosing to save the API key
- **THEN** the key can be used in the current browser session
- **AND** the raw key is not written to persistent browser storage

#### Scenario: Saved key requires reuse confirmation

- **WHEN** a saved provider configuration exists on a later visit
- **THEN** the setup flow shows that a key is saved for the selected provider and asks the visitor to confirm reuse without displaying the raw key

### Requirement: Local allowance tracking

The app SHALL let the visitor set a local spending allowance for LLM usage and SHALL prevent provider requests once the locally tracked allowance is exhausted. Before sending a request, the app SHALL estimate the request's token cost and SHALL refuse the request with an allowance-exceeded error when the estimated cost plus any in-flight reservations plus already-accumulated usage would exceed the allowance, so concurrent or multi-step calls cannot blow past the ceiling before spend catches up. When the visitor has not set an allowance, the app SHALL NOT enforce a ceiling. Locally tracked usage SHALL be derived as the sum of the local spend history records, each recorded from provider-reported real usage when available; when real usage is unavailable the app SHALL record an unknown-cost state rather than presenting an exact value. The pre-flight estimate is a best-effort guard only and SHALL NOT be presented to the visitor as the cost of a request; displayed cost comes from provider-reported real usage.

#### Scenario: Allowance blocks new request

- **WHEN** the locally tracked allowance is exhausted
- **THEN** the LLM client refuses a new provider request and returns an allowance-exceeded error

#### Scenario: Pre-flight estimate blocks an over-budget request before fetch

- **WHEN** a request's estimated cost plus accumulated usage exceeds the allowance
- **THEN** the LLM client refuses the request with an allowance-exceeded error before any provider fetch occurs

#### Scenario: Concurrent in-flight requests cannot overshoot the ceiling

- **WHEN** two requests are issued concurrently and each estimated cost alone fits under the remaining allowance but both combined would exceed it
- **THEN** the first request is sent and the second is refused with an allowance-exceeded error before its fetch occurs

#### Scenario: Failed request releases its in-flight reservation

- **WHEN** a request fails after its estimate was reserved for the in-flight check
- **THEN** the reserved estimate is released back so a failed request does not permanently consume the allowance

#### Scenario: Unset allowance skips the ceiling check

- **WHEN** the visitor has not set a local spending allowance
- **THEN** the LLM client does not refuse requests on budget grounds and does not perform a pre-flight ceiling check

#### Scenario: Provider usage updates local state

- **WHEN** a provider response includes usable usage or cost metadata
- **THEN** a local spend history record is appended with that real usage and the cumulative usage reflects it before the next request can run

### Requirement: Reusable LLM request boundary

The app SHALL expose a reusable browser-side LLM request boundary that accepts prompt content from calling features and returns either structured response content with usage metadata or a normalized error. The BYOK capability SHALL own provider request mechanics, key access, allowance checks, and provider error mapping; calling features SHALL own their prompts, response parsing expectations, and feature-specific histories.

#### Scenario: Calling feature receives successful response

- **WHEN** a calling feature sends a prompt through the configured LLM request boundary and the provider returns a usable response
- **THEN** the caller receives the response content plus any available usage metadata

#### Scenario: BYOK does not persist feature history

- **WHEN** a calling feature sends a prompt and receives a response
- **THEN** the BYOK capability does not persist the prompt, response content, or feature-specific result history

### Requirement: Normalized provider errors

The LLM request boundary SHALL map provider and network failures into stable app-level error categories covering invalid or expired key, insufficient provider credit, allowance exceeded, rate limit, network failure, and malformed provider response. Error handling SHALL be localized in UI surfaces that present these states to visitors.

#### Scenario: Invalid key is normalized

- **WHEN** the provider rejects a request because the API key is invalid or expired
- **THEN** the request boundary returns an invalid-key error category that the UI can present without provider-specific status text

#### Scenario: Malformed response is normalized

- **WHEN** the provider returns a response that cannot be used as the requested LLM output
- **THEN** the request boundary returns a malformed-response error category

### Requirement: Constitution conformance
The browser-local LLM access capability SHALL conform to the BYOM constitution pinned at `vendor/byom`, with the capability's compliance state and any deviations recorded in `docs/BYOM-INTEGRATION.md` (the repository root remains an acceptable alternative).

#### Scenario: Conformance is recorded against a pinned constitution
- **WHEN** the BYOK capability's conformance is reviewed
- **THEN** `docs/BYOM-INTEGRATION.md` names the pinned constitution version and records the capability's current deviations from the constitution's security invariants

### Requirement: Model category selection

The app SHALL NOT hardcode a single model for the BYOK layer. Each model in the provider registry SHALL be tagged with a category (`frontier` or `worker`). The app SHALL store the visitor's chosen model per category, SHALL surface the model options for each category the app's features declare, and SHALL let the visitor pick a concrete model within that category. The LLM request boundary SHALL accept a category declaration from the calling feature and SHALL route the request to the visitor's chosen model for that category. The boundary SHALL refuse a request whose declared category has no chosen model with a `missing_config` error, without sending the request to the provider.

#### Scenario: Visitor chooses within a category

- **WHEN** the setup flow is shown and the app's model-powered features declare the `worker` category
- **THEN** the flow surfaces the worker-tagged models from the provider registry and lets the visitor pick one

#### Scenario: Boundary routes by declared category

- **WHEN** a calling feature sends a request declaring the `worker` category through the request boundary
- **THEN** the boundary routes the request to the visitor's chosen worker model

#### Scenario: Unconfigured category is refused before the provider call

- **WHEN** a calling feature sends a request declaring a category the visitor has not chosen a model for
- **THEN** the boundary returns a `missing_config` error and does not call the provider

#### Scenario: Legacy saved model migrates to the worker category

- **WHEN** a visitor returns with a saved configuration that predates category-aware storage
- **THEN** the stored model is treated as the visitor's `worker` choice and remains usable without re-entry

### Requirement: Strict Content-Security-Policy
The app SHALL enforce a Content-Security-Policy in every built page, emitted as a `<meta http-equiv="content-security-policy">` tag in the document head via the framework's CSP configuration. The policy SHALL use `default-src 'self'` and `object-src 'none'`, SHALL NOT include `'unsafe-inline'` or `'unsafe-eval'` in `script-src`, and SHALL NOT include wildcard `*` origins in `script-src` or `connect-src`. Bundled inline scripts SHALL be permitted by content hashes generated by the build, not by `'unsafe-inline'`.

#### Scenario: Build output carries a Content-Security-Policy
- **WHEN** a production page is built
- **THEN** the rendered HTML head contains a `content-security-policy` meta tag whose `default-src` is `'self'` and whose `object-src` is `'none'`

#### Scenario: connect-src is limited to provider and map origins
- **WHEN** the policy's `connect-src` directive is inspected
- **THEN** it allows only `'self'`, `https://openrouter.ai`, `https://api.mapbox.com`, and `https://*.mapbox.com`, with no wildcard `*` and no other third-party origins

#### Scenario: Inline scripts are hash-locked
- **WHEN** the policy's `script-src` directive is inspected
- **THEN** it permits bundled inline scripts via per-script hashes and does not contain `'unsafe-inline'` or `'unsafe-eval'`

### Requirement: Stale key cleared on auth failure
The LLM request boundary SHALL treat a provider auth failure (`invalid_key`, HTTP 401 or 403) as a stale credential. On such a failure it SHALL clear the in-memory session key and any persisted saved key before returning the error, SHALL emit the BYOK configuration-changed event, and SHALL NOT retry the failed request. Surfacing the re-connect state SHALL be localized and SHALL NOT leak the key or prompt content.

#### Scenario: Auth failure clears the key without retry
- **WHEN** the provider rejects a request with an auth failure
- **THEN** the request boundary performs exactly one provider fetch, clears the in-memory and persisted key, and returns an `invalid_key` error

#### Scenario: Cleared key surfaces a re-connect prompt
- **WHEN** a model-powered flow receives an `invalid_key` result after the key was cleared
- **THEN** the flow surfaces a localized re-connect state and the setup surface no longer offers the cleared saved key for reuse

### Requirement: Cost transparency

The app SHALL make LLM spend legible to the visitor. Each model-powered request SHALL show its cost from the provider's real usage data, shown as pending while the request is in flight and as the real amount when usage arrives; the app SHALL NOT display a fabricated or estimated cost as the cost of a request. Spend SHALL be attributable per request at minimum and per feature where the calling feature declares a `purpose`. The app SHALL keep a local, on-device spend history — one record per completed request, stored next to the key setup and never sent to any developer endpoint — and this history SHALL be the source of truth for cumulative usage. Each history record SHALL carry the request `purpose`, the cost in the provider's billing unit (USD), the cost source, optional token counts, and a timestamp; it SHALL NOT carry prompt or response content. If leaving or closing the page would abort an in-flight paid request, the app SHALL intercept with a leave warning; the warning SHALL also fire when a consuming feature has signaled unsaved work that would be lost. History record shape: `{ id: string; purpose: string; costUsd: number | null; costSource: "provider" | "unknown"; promptTokens?: number; completionTokens?: number; totalTokens?: number; timestamp: string }`, where `costUsd: null` means usage did not arrive.

#### Scenario: Live cost shows pending then real usage

- **WHEN** a model-powered request is in flight
- **THEN** the cost surface shows the request's cost as pending
- **AND** when the provider's real usage arrives the surface shows the real cost amount instead of the pending state

#### Scenario: Spend is attributed per feature

- **WHEN** a request completes whose calling feature declared a purpose
- **THEN** the appended spend history record carries that purpose and the live cost surface attributes the cost to it

#### Scenario: Spend history is local and not transmitted

- **WHEN** a spend history record is written
- **THEN** it is stored on the device next to the key
- **AND** no developer endpoint receives the record, the cost, or the prompt or response content

#### Scenario: Leave warning fires during in-flight paid request or unsaved feature work

- **WHEN** an in-flight paid request is running or a consuming feature has signaled unsaved work that would be lost
- **AND** the visitor leaves or closes the page
- **THEN** the app intercepts navigation with a leave warning before the abort or loss occurs

### Requirement: First-time key holder onboarding

The first-run setup flow SHALL, before asking for an API key, explain in plain localized copy that the feature needs model inference, that the visitor brings their own key, and that they pay their provider directly for what they use. It SHALL point to where to obtain an OpenRouter key with a concrete link (`https://openrouter.ai/keys`), SHALL prompt the visitor to set a provider-side spend limit at the provider (`https://openrouter.ai/settings/credits`) as the hard cap that bounds spend beyond the app's local allowance, and SHALL restate the honest threat model: the key stays in the browser and calls the provider directly, a privacy and control win, not a cryptographic guarantee. The provider spend-limit prompt SHALL be informational copy and a link, not a blocking acknowledgment gate.

#### Scenario: First-run setup explains connecting and costs

- **WHEN** a visitor opens the first-run setup with no confirmed configuration
- **THEN** the setup shows localized copy explaining that the feature needs model inference, the visitor brings their own key, and they pay the provider directly

#### Scenario: First-run setup links to obtain a key

- **WHEN** the first-run setup is shown
- **THEN** it surfaces a link to `https://openrouter.ai/keys` for obtaining an OpenRouter key

#### Scenario: First-run setup prompts the provider spend limit

- **WHEN** the first-run setup is shown
- **THEN** it prompts the visitor to set a provider-side spend limit with a link to `https://openrouter.ai/settings/credits`, presented as the hard cap complementing the app's local allowance, without blocking confirmation on an acknowledgment

#### Scenario: First-run setup restates the honest threat model

- **WHEN** the first-run setup is shown
- **THEN** it restates that the key stays in the browser and calls the provider directly and that this is a privacy and control win, not a cryptographic guarantee

### Requirement: Connection management surface

The app SHALL provide a persistent, always-reachable connection-management surface for the browser-local LLM configuration, distinct from the first-run setup flow. After connecting, the visitor SHALL be able to reach it to change the model within the feature's declared category, adjust the local allowance, clear or rotate the key, and view the cumulative spend and on-device spend history. Reaching the surface SHALL NOT drop an active in-memory session — it MUST NOT require a full page navigation that would clear the unsaved session key (invariant 1: in-memory by default). Clearing the key SHALL wipe both the in-memory session key and any persisted saved key and SHALL return the surface to the first-run state. The clear and rotate controls SHALL be disabled while a paid request is in flight.

#### Scenario: Connection management surface is reachable after connecting

- **WHEN** a visitor with a confirmed configuration activates the connection-management entry
- **THEN** the management surface opens and exposes model, allowance, clear/rotate key, and spend history

#### Scenario: Connection management surface shows cumulative spend and history

- **WHEN** the connection-management surface is shown
- **THEN** it surfaces the cumulative spend derived from the local history, the allowance progress when an allowance is set, and the recent on-device spend records, presented in the active locale

#### Scenario: Clearing the key returns to the first-run state

- **WHEN** a visitor activates clear-key in the connection-management surface and no paid request is in flight
- **THEN** the in-memory and persisted key are wiped and the surface returns to the first-run setup state

#### Scenario: Clear and rotate are disabled during an in-flight paid request

- **WHEN** a paid request is in flight
- **THEN** the connection-management surface disables the clear and rotate controls


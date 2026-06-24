# bring-your-own-key-llm Specification

## Purpose
TBD - created by archiving change add-bring-your-own-key-llm. Update Purpose after archive.
## Requirements
### Requirement: Provider setup

The app SHALL provide a browser-local LLM setup flow that supports OpenRouter as the available provider, lets the visitor provide an API key, uses a configured default model for future matching calls, and shows a cost indication placeholder until provider/model-aware estimates are implemented. The setup SHALL require explicit visitor confirmation before the app treats the configuration as usable for LLM requests.

#### Scenario: Visitor configures OpenRouter

- **WHEN** a visitor selects OpenRouter, enters an API key, and confirms setup
- **THEN** the LLM configuration is available for browser-local requests in the current session

#### Scenario: Cost estimate placeholder is visible

- **WHEN** the setup flow is shown
- **THEN** it displays a cost indication area without claiming an exact provider charge

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

The app SHALL let the visitor set a local spending allowance for LLM usage and SHALL prevent provider requests once the locally tracked allowance is exhausted. Usage SHALL be updated from provider-reported usage or cost when available; when exact cost is unavailable, the app SHALL record a conservative estimate or unknown-cost state rather than presenting an exact value.

#### Scenario: Allowance blocks new request

- **WHEN** the locally tracked allowance is exhausted
- **THEN** the LLM client refuses a new provider request and returns an allowance-exceeded error

#### Scenario: Provider usage updates local state

- **WHEN** a provider response includes usable usage or cost metadata
- **THEN** the local usage state is updated before the next request can run

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
The browser-local LLM access capability SHALL conform to the BYOM constitution pinned at `vendor/byom`, with the capability's compliance state and any deviations recorded in `BYOM-INTEGRATION.md` at the repository root.

#### Scenario: Conformance is recorded against a pinned constitution
- **WHEN** the BYOK capability's conformance is reviewed
- **THEN** `BYOM-INTEGRATION.md` names the pinned constitution version and records the capability's current deviations from the constitution's security invariants


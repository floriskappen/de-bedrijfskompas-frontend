## MODIFIED Requirements

### Requirement: Provider setup

The app SHALL provide a browser-local first-run LLM setup flow that supports OpenRouter as the available provider, lets the visitor provide an API key, lets the visitor choose a model within the category the app's model-powered features declare, and SHALL require explicit visitor confirmation before the app treats the configuration as usable for LLM requests.

#### Scenario: Visitor configures OpenRouter

- **WHEN** a visitor selects OpenRouter, enters an API key, and confirms setup
- **THEN** the LLM configuration is available for browser-local requests in the current session

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

## ADDED Requirements

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

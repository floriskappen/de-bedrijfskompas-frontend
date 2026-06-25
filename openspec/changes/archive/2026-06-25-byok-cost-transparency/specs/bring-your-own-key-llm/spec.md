## MODIFIED Requirements

### Requirement: Provider setup

The app SHALL provide a browser-local LLM setup flow that supports OpenRouter as the available provider, lets the visitor provide an API key, lets the visitor choose a model within the category the app's model-powered features declare, and surfaces the visitor's local spend and spend history alongside the key. The setup SHALL require explicit visitor confirmation before the app treats the configuration as usable for LLM requests.

#### Scenario: Visitor configures OpenRouter

- **WHEN** a visitor selects OpenRouter, enters an API key, and confirms setup
- **THEN** the LLM configuration is available for browser-local requests in the current session

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

## ADDED Requirements

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

#### Scenario: Setup sheet shows cumulative spend and history

- **WHEN** the BYOK setup sheet is shown
- **THEN** it surfaces the cumulative spend derived from the local history, the allowance progress when an allowance is set, and the recent on-device spend records, presented in the active locale

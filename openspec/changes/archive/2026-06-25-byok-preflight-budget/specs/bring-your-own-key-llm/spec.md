## MODIFIED Requirements

### Requirement: Local allowance tracking

The app SHALL let the visitor set a local spending allowance for LLM usage and SHALL prevent provider requests once the locally tracked allowance is exhausted. Before sending a request, the app SHALL estimate the request's token cost and SHALL refuse the request with an allowance-exceeded error when the estimated cost plus any in-flight reservations plus already-accumulated usage would exceed the allowance, so concurrent or multi-step calls cannot blow past the ceiling before spend catches up. When the visitor has not set an allowance, the app SHALL NOT enforce a ceiling. Usage SHALL be updated from provider-reported usage or cost when available; when exact cost is unavailable, the app SHALL record a conservative estimate or unknown-cost state rather than presenting an exact value. The pre-flight estimate is a best-effort guard only and SHALL NOT be presented to the visitor as the cost of the request; displayed cost comes from provider-reported real usage.

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
- **THEN** the local usage state is updated before the next request can run

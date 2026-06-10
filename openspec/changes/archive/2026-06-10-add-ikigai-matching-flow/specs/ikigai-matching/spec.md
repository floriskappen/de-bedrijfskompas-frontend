## ADDED Requirements

### Requirement: BYOK-gated Ikigai flow
The Ikigai matching capability SHALL run only in the browser and SHALL require a confirmed BYOK LLM configuration before any LLM request is sent. The flow SHALL remain usable without accounts, backend requests other than the selected provider call, analytics, or cookies.

#### Scenario: Confirmed BYOK starts the flow
- **WHEN** a visitor starts Ikigai matching with a confirmed browser-local LLM configuration
- **THEN** the Ikigai questionnaire is shown without asking for an API key again

#### Scenario: Missing BYOK blocks matching prompts
- **WHEN** a visitor starts Ikigai matching without a confirmed browser-local LLM configuration
- **THEN** no Ikigai matching prompt is sent and BYOK setup is shown instead

### Requirement: Ikigai questionnaire
The flow SHALL ask a small fixed set of localized, plain-language questions covering what the visitor does, what they are good at, what they care about, and the kind of work context they prefer. Answers SHALL be kept in browser-local flow state and SHALL be available to later matching and refinement runs.

#### Scenario: Visitor completes questionnaire
- **WHEN** a visitor answers the required Ikigai questions
- **THEN** the flow can derive ISCO candidates and continue to candidate filtering

#### Scenario: Incomplete answers prevent matching
- **WHEN** required questionnaire answers are missing
- **THEN** the flow does not run ISCO derivation or company matching

### Requirement: ISCO minor-code derivation
The flow SHALL map the visitor's strengths and work answers to three-digit ISCO-08 minor-code candidates using the BYOK request boundary. The model prompt SHALL constrain valid output to the ISCO minor codes present in the loaded renderable company dataset, and the parsed result SHALL classify candidates as `strong` or `weak` with short reasoning.

#### Scenario: ISCO candidates are parsed
- **WHEN** the LLM returns valid ISCO candidates from the allowed loaded-code set
- **THEN** the flow stores the candidates with their strength, code, and reasoning

#### Scenario: Unknown ISCO candidates are rejected
- **WHEN** the LLM returns an ISCO code that is not present in the loaded renderable company dataset
- **THEN** that code is not used for deterministic company matching

#### Scenario: Malformed ISCO response is recoverable
- **WHEN** the LLM response cannot be parsed into the required ISCO candidate structure
- **THEN** the flow shows a recoverable error and keeps the visitor's questionnaire answers

### Requirement: Deterministic candidate ranking
The flow SHALL filter companies to those sharing at least one derived ISCO minor code with the visitor and SHALL rank them before LLM judging. Ranking SHALL combine user tag strength with company tag prominence and confidence, where strong user candidates weigh more than weak candidates, company `core` tags weigh more than `supporting`, `supporting` weighs more than `incidental`, and low-confidence company tags are discounted.

#### Scenario: Shared ISCO tags produce candidates
- **WHEN** companies share one or more derived ISCO minor codes with the visitor
- **THEN** those companies are included in the deterministic candidate pool sorted by rank

#### Scenario: Non-overlapping companies are excluded
- **WHEN** a company shares no derived ISCO minor code with the visitor
- **THEN** that company is excluded from the deterministic candidate pool

#### Scenario: Strong and core tags rank higher
- **WHEN** two companies match the visitor on otherwise comparable tags
- **THEN** the company matched through stronger user candidates and more prominent company tags ranks ahead

### Requirement: Axis tightening before LLM judging
The flow SHALL let the visitor tighten only the existing five axis focus minimums when the deterministic candidate pool is larger than the target pre-LLM pool. Axis tightening SHALL NOT change the derived ISCO tags. The target pre-LLM pool size SHALL be about 100 companies, and smaller datasets SHALL proceed with fewer candidates.

#### Scenario: Large pool can be tightened
- **WHEN** the deterministic candidate pool exceeds the target pre-LLM pool size
- **THEN** the visitor can adjust axis focus minimums and see the candidate count update

#### Scenario: Axis tightening preserves tags
- **WHEN** the visitor changes axis focus minimums in the Ikigai flow
- **THEN** the derived ISCO candidates remain unchanged

#### Scenario: Small pool proceeds
- **WHEN** the deterministic candidate pool contains 100 or fewer companies
- **THEN** the flow can proceed to LLM judging without requiring axis tightening

### Requirement: Two-pass LLM matching
The flow SHALL run two LLM judging passes through the BYOK request boundary. Pass 1 SHALL evaluate the deterministic top pool using compact company descriptions and return about 25 candidate company ids. Pass 2 SHALL evaluate those candidates using fuller profiles composed from existing company fields and return 3-10 selected matches with company ids and data-grounded reasoning.

#### Scenario: Pass 1 returns candidate ids
- **WHEN** pass 1 receives compact profiles for the deterministic top pool
- **THEN** it stores a parsed list of candidate company ids that exist in the loaded company data

#### Scenario: Pass 2 returns grounded matches
- **WHEN** pass 2 receives fuller profiles for the pass 1 candidates
- **THEN** it stores 3-10 selected matches with company ids and reasoning grounded in the supplied company profile fields

#### Scenario: Invalid company ids are ignored
- **WHEN** either LLM pass returns a company id that is not present in the supplied candidate set
- **THEN** that id is ignored and not shown as a result

### Requirement: Results and candidate review
The flow SHALL show the selected 3-10 matches as the primary result set and SHALL let the visitor expand or navigate to the broader pass 1 candidate set. Result cards SHALL render current company identity, localized tagline, axis focus summary, and the stored Ikigai reasoning.

#### Scenario: Selected matches are shown first
- **WHEN** a matching run completes successfully
- **THEN** the results UI shows the selected matches before the broader candidate set

#### Scenario: Broader candidates are available
- **WHEN** pass 1 produced candidates that were not selected in pass 2
- **THEN** the visitor can reveal those additional candidates from the results UI

### Requirement: Refinement runs
The flow SHALL let the visitor add a localized free-text refinement to a completed run and rerun the two LLM judging passes against the same deterministic top pool and axis filters. Each refinement SHALL create a new run entry linked to the earlier run.

#### Scenario: Visitor refines a completed run
- **WHEN** a visitor submits refinement text from the results UI
- **THEN** the flow reruns LLM pass 1 and pass 2 using the previous deterministic top pool plus the refinement

#### Scenario: Refinement keeps original deterministic scope
- **WHEN** a refinement run starts
- **THEN** it uses the same derived ISCO candidates and axis filters unless the visitor explicitly changes answers or filters in the flow

### Requirement: Local Ikigai history
The flow SHALL persist Ikigai matching history only in the visitor's browser. Persisted records SHALL include questionnaire answers, derived ISCO candidates, axis filters, deterministic candidate ids, LLM candidate ids, selected result ids, reasoning, refinements, timestamps, and schema version. Persisted records SHALL NOT store API keys or duplicate full company snapshots.

#### Scenario: Run persists locally
- **WHEN** a matching run completes
- **THEN** the visitor can return in the same browser profile and see the saved run history

#### Scenario: Company display uses current data
- **WHEN** saved history references a company id still present in the current company data
- **THEN** the UI renders current company fields for that company rather than a stored company snapshot

#### Scenario: Missing companies are hidden
- **WHEN** saved history references a company id no longer present in current company data
- **THEN** that company is omitted from visible results without breaking the saved run

### Requirement: Matching error handling
The flow SHALL handle BYOK and parsing failures without losing visitor answers or completed run history. Error states SHALL distinguish missing BYOK configuration, allowance exceeded, provider failure, malformed model output, and empty deterministic candidate pools.

#### Scenario: Provider error preserves draft
- **WHEN** BYOK returns a provider or allowance error during matching
- **THEN** the flow shows a localized error and preserves the visitor's answers and current flow state

#### Scenario: Empty deterministic pool is shown
- **WHEN** derived ISCO candidates produce no matching companies
- **THEN** the flow shows an empty-results state and lets the visitor revise answers or rerun ISCO derivation

## ADDED Requirements

### Requirement: Model category declaration

Each Ikigai LLM pass SHALL declare its model category (`frontier` or `worker`) through the BYOK request boundary. The ISCO minor-code derivation, pass-1 candidate selection, and pass-2 grounded matching passes SHALL all declare `worker`, because the passes perform structured extraction, ranking, and data-grounded synthesis over supplied company profiles rather than deep world-knowledge reasoning.

#### Scenario: ISCO derivation declares worker

- **WHEN** the Ikigai flow sends the ISCO minor-code derivation request through the BYOK boundary
- **THEN** the request declares the `worker` category

#### Scenario: Pass 1 declares worker

- **WHEN** the Ikigai flow sends the pass-1 candidate selection request through the BYOK boundary
- **THEN** the request declares the `worker` category

#### Scenario: Pass 2 declares worker

- **WHEN** the Ikigai flow sends the pass-2 grounded matching request through the BYOK boundary
- **THEN** the request declares the `worker` category

## MODIFIED Requirements

### Requirement: Provider setup

The app SHALL provide a browser-local LLM setup flow that supports OpenRouter as the available provider, lets the visitor provide an API key, lets the visitor choose a model within the category the app's model-powered features declare, and shows a cost indication placeholder until provider/model-aware estimates are implemented. The setup SHALL require explicit visitor confirmation before the app treats the configuration as usable for LLM requests.

#### Scenario: Visitor configures OpenRouter

- **WHEN** a visitor selects OpenRouter, enters an API key, and confirms setup
- **THEN** the LLM configuration is available for browser-local requests in the current session

#### Scenario: Cost estimate placeholder is visible

- **WHEN** the setup flow is shown
- **THEN** it displays a cost indication area without claiming an exact provider charge

## ADDED Requirements

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

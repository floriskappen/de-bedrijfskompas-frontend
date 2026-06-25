## ADDED Requirements

### Requirement: Content-Security-Policy is enforced
The byom-consumption conformance check SHALL assert that a Content-Security-Policy is present in the production build output, so the constitution's invariant 3 (strict CSP) has an observable, build-time acceptance signal alongside the pin and integration document.

#### Scenario: Built page carries a Content-Security-Policy
- **WHEN** the byom-consumption conformance is reviewed against a built page
- **THEN** the page HTML head contains a `content-security-policy` meta tag whose `default-src` is `'self'` and whose `object-src` is `'none'`

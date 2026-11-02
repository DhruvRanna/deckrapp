# Security Policy

## Supported versions

Security fixes are prioritized for the latest version on the default branch. DECKR is under active development and does not currently publish a formal version support matrix.

## Reporting a vulnerability

Please do not disclose exploitable vulnerabilities in public issues.

Use GitHub's **Report a vulnerability** flow on this repository (Security tab / private vulnerability reporting) if it is enabled. Include:

- A concise description and potential impact
- Reproduction steps or a proof of concept
- Affected commit, route, component, or dependency where known
- Any suggested mitigation

Please allow maintainers reasonable time to investigate and prepare a fix before public disclosure.

## Secrets and user data

- Never commit service-role keys, database passwords, access tokens, or production credentials.
- Browser-exposed Supabase publishable keys are not authorization controls. Enforce access with Supabase Row Level Security policies.
- Report suspected credential exposure promptly and rotate affected credentials.

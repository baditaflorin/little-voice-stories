# 0011 - Logging Strategy

## Status

Accepted

## Context

Mode A has no server logs. Browser console output should be quiet in production.

## Decision

Use minimal browser console logging. Production code should log only actionable local failures, such as model initialization failure or service worker registration failure. User-facing failures appear as in-app notices.

## Consequences

- No PII is intentionally written to logs.
- Debuggability relies on local reproduction and user-visible error messages.

## Alternatives Considered

- Remote logging: rejected because it would collect client data and require a service.

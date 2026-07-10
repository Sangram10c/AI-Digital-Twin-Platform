# Security

## Purpose

Document platform security controls, OWASP mitigations, and security headers.

## Scope

Application security standards across authentication, transport, headers, and logging.

## Content

## OWASP Top 10 Mitigations

| Threat                    | Mitigation                              |
| ------------------------- | --------------------------------------- |
| Injection                 | Parameterized queries via Prisma ORM    |
| Broken Auth               | JWT + refresh tokens, rate limiting     |
| Sensitive Data Exposure   | HTTPS, encrypted secrets, env variables |
| XXE                       | JSON-only API, no XML parsing           |
| Broken Access Control     | RBAC guards, resource ownership checks  |
| Security Misconfiguration | Helmet headers, CORS policy             |
| XSS                       | React auto-escaping, CSP headers        |
| Insecure Deserialization  | class-validator, whitelist DTOs         |
| Known Vulnerabilities     | Dependabot, npm audit                   |
| Insufficient Logging      | Pino structured logging                 |

## Security Headers

- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Content-Security-Policy: (configured per environment)

## Documents Included

- [authentication.md](./authentication.md)
- [authorization.md](./authorization.md)
- [encryption.md](./encryption.md)
- [secrets.md](./secrets.md)
- [rate-limiting.md](./rate-limiting.md)

## Related Documents

- [Authentication Design](../10-authentication-design/README.md)
- [Non-Functional Requirements](../04-non-functional-requirements/README.md)
- [Deployment](../21-deployment/README.md)

## Current Status

| Field      | Value    |
| ---------- | -------- |
| Status     | Migrated |
| Completion | 100%     |

## Owner

<!-- Team or role responsible for maintaining this section. -->

## Last Updated

2026-07-09

## Next Document

[Frontend Architecture](../16-frontend-architecture/README.md)

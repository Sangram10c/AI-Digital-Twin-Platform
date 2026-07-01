# Security

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

## Rate Limiting

- Global: 100 requests per 60 seconds
- Auth endpoints: 5 requests per 60 seconds
- AI endpoints: 20 requests per 60 seconds

## Data Encryption

- Passwords: bcrypt (12 rounds)
- Tokens: JWT with RS256
- Secrets: Environment variables (never committed)

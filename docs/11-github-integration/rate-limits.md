# GitHub Rate Limits

## Purpose

Document GitHub API rate limits that affect OAuth profile calls and any future full repository sync.

## Scope

Applies to calls from `GithubApiClient` and any repository crawl clients. Webhook **deliveries from GitHub to us** are not counted the same way as REST quota (they are push-based).

## Overview

GitHub applies rate limits per authentication method. With a user OAuth token, typical REST quota is on the order of **5,000 requests/hour** for the authenticated user (see official docs for current numbers).

Unauthenticated requests have a much lower limit — this platform always uses authenticated tokens after OAuth.

## Responsibilities

| Layer                          | Behavior                                                         |
| ------------------------------ | ---------------------------------------------------------------- |
| OAuth connect                  | Few calls (`/user`, `/user/emails`) — negligible                 |
| Webhooks                       | Inbound; workers upsert from payload — **minimal** outbound REST |
| Full repo sync (when restored) | Must respect `X-RateLimit-*` headers, backoff, pagination caps   |

## Design guidelines

1. Prefer **webhooks** for ongoing freshness
2. Cap pages (commits, etc.) on full sync
3. Retry with exponential backoff on `403`/`429`
4. Reuse connections; avoid N+1 GitHub calls in HTTP request path

## Official reference

https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api

Secondary resources headers:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Future Improvements

- Central rate-limit middleware for GitHub HTTP client
- Metrics dashboard for remaining quota

## References

- [Repository sync](./repository-sync.md)
- [Webhook](./webhook.md)
- [OAuth](./oauth.md)

# Authentication

## Overview

The platform uses JWT-based authentication with OAuth 2.0 social login support.

## Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB
    participant OAuth

    Client->>API: POST /auth/login
    API->>DB: Validate credentials
    DB-->>API: User data
    API-->>Client: { accessToken, refreshToken }

    Client->>API: GET /api/resource (Bearer token)
    API->>API: Validate JWT
    API-->>Client: Resource data

    Client->>API: POST /auth/refresh
    API->>DB: Validate refresh token
    API-->>Client: { newAccessToken }
```

## Supported Providers

- **Email/Password**: Traditional authentication
- **Google OAuth**: Sign in with Google
- **GitHub OAuth**: Sign in with GitHub

## JWT Structure

### Access Token (15 min expiry)

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "USER",
  "iat": 1234567890,
  "exp": 1234568790
}
```

## RBAC (Role-Based Access Control)

| Role   | Permissions        |
| ------ | ------------------ |
| ADMIN  | Full access        |
| USER   | CRUD own resources |
| VIEWER | Read-only access   |

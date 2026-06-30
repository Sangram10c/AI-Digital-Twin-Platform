# API Design

## Conventions

- **Base URL**: `/api/v1`
- **Format**: JSON
- **Authentication**: Bearer JWT token
- **Versioning**: URI-based (`/api/v1`, `/api/v2`)

## Response Format

### Success Response

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Paginated Response

```json
{
  "data": [],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

## Endpoints Overview

| Method | Endpoint       | Description        |
| ------ | -------------- | ------------------ |
| POST   | /auth/login    | User login         |
| POST   | /auth/register | User registration  |
| GET    | /auth/profile  | Get current user   |
| GET    | /users         | List users         |
| GET    | /workspaces    | List workspaces    |
| POST   | /documents     | Create document    |
| POST   | /ai/chat       | AI chat completion |
| GET    | /health        | Health check       |

## HTTP Status Codes

| Code | Meaning               |
| ---- | --------------------- |
| 200  | OK                    |
| 201  | Created               |
| 204  | No Content            |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 409  | Conflict              |
| 422  | Unprocessable Entity  |
| 429  | Too Many Requests     |
| 500  | Internal Server Error |

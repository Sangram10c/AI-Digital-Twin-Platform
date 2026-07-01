# Environment Variables

## Complete Reference

See `.env.example` at the root of the repository for all variables.

### Application

| Variable     | Default     | Description |
| ------------ | ----------- | ----------- |
| NODE_ENV     | development | Environment |
| BACKEND_PORT | 4000        | API port    |
| API_PREFIX   | api         | API prefix  |

### Database

| Variable     | Required | Description                  |
| ------------ | -------- | ---------------------------- |
| DATABASE_URL | Yes      | PostgreSQL connection string |

### Redis

| Variable  | Default                  | Description      |
| --------- | ------------------------ | ---------------- |
| REDIS_URL | redis://localhost:6379/0 | Redis connection |

### JWT

| Variable               | Required | Description        |
| ---------------------- | -------- | ------------------ |
| JWT_SECRET             | Yes      | JWT signing secret |
| JWT_ACCESS_EXPIRATION  | 15m      | Access token TTL   |
| JWT_REFRESH_EXPIRATION | 7d       | Refresh token TTL  |

### AI Providers

| Variable            | Required | Description         |
| ------------------- | -------- | ------------------- |
| AI_DEFAULT_PROVIDER | No       | Default AI provider |
| OPENAI_API_KEY      | No       | OpenAI API key      |
| ANTHROPIC_API_KEY   | No       | Anthropic API key   |
| GOOGLE_AI_API_KEY   | No       | Gemini API key      |
| OLLAMA_BASE_URL     | No       | Ollama server URL   |

import * as Joi from 'joi';

const INSECURE_JWT_SECRETS = [
  'change-me',
  'your-super-secret-jwt-key-change-in-production',
  'dev-jwt-secret-change-me',
];

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),

  // Application
  APP_NAME: Joi.string().default('AI Digital Twin'),
  BACKEND_PORT: Joi.number().port().default(4000),
  BACKEND_HOST: Joi.string().default('0.0.0.0'),
  API_PREFIX: Joi.string().default('api'),
  API_VERSION: Joi.string().default('v1'),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  CORS_CREDENTIALS: Joi.boolean().truthy('true').falsy('false').default(true),
  TRUST_PROXY: Joi.boolean().truthy('true').falsy('false').default(false),
  BODY_LIMIT: Joi.string().default('1mb'),

  // Database (required in all environments)
  DATABASE_URL: Joi.string().required().messages({
    'any.required': 'DATABASE_URL is required',
  }),

  // Redis
  REDIS_URL: Joi.string().optional(),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().integer().min(0).default(0),

  // JWT
  JWT_SECRET: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string()
      .min(32)
      .invalid(...INSECURE_JWT_SECRETS)
      .required()
      .messages({
        'any.invalid':
          'JWT_SECRET must be a strong secret in production (min 32 chars)',
        'any.required': 'JWT_SECRET is required in production',
      }),
    otherwise: Joi.string().default('dev-jwt-secret-change-me'),
  }),
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

  // OAuth (optional until auth is implemented)
  GOOGLE_CLIENT_ID: Joi.string().allow('').optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().allow('').optional(),
  GOOGLE_CALLBACK_URL: Joi.string().uri().optional(),
  GITHUB_CLIENT_ID: Joi.string().allow('').optional(),
  GITHUB_CLIENT_SECRET: Joi.string().allow('').optional(),
  GITHUB_CALLBACK_URL: Joi.string().uri().optional(),
  GITHUB_OAUTH_SCOPES: Joi.string().optional(),
  GITHUB_WEBHOOK_SECRET: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(16).required().messages({
      'any.required':
        'GITHUB_WEBHOOK_SECRET is required in production (min 16 chars)',
    }),
    otherwise: Joi.string().allow('').optional(),
  }),
  GITHUB_OAUTH_SUCCESS_REDIRECT: Joi.string().uri().optional(),
  GITHUB_OAUTH_ERROR_REDIRECT: Joi.string().uri().optional(),
  GITHUB_OAUTH_STATE_TTL_SECONDS: Joi.number()
    .integer()
    .positive()
    .default(600),
  OAUTH_TOKEN_ENCRYPTION_KEY: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(32).required().messages({
      'any.required':
        'OAUTH_TOKEN_ENCRYPTION_KEY is required in production (min 32 chars)',
    }),
    otherwise: Joi.string().default('dev-oauth-token-encryption-key-32b'),
  }),

  // AI (hybrid digest pipeline)
  AI_DEFAULT_PROVIDER: Joi.string()
    .valid(
      'groq',
      'openrouter',
      'huggingface',
      'cloudflare',
      'openai',
      'anthropic',
      'gemini',
      'ollama',
    )
    .default('groq'),
  AI_BILLING_MODE: Joi.string()
    .valid('free_only', 'mixed', 'paid')
    .default('free_only'),
  AI_EXTRACTION_MODE: Joi.string()
    .valid('heuristics_only', 'heuristics', 'light', 'full')
    .default('light'),
  AI_PROVIDER_FALLBACK: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(true),
  DIGEST_BATCH_SIZE: Joi.number().integer().positive().default(10),
  PR_BATCH_SIZE: Joi.number().integer().positive().default(5),
  MAX_AI_RETRIES: Joi.number().integer().positive().default(3),
  GROQ_API_KEY: Joi.string().allow('').optional(),
  GROQ_MODEL: Joi.string().default('llama-3.1-8b-instant'),
  OPENROUTER_API_KEY: Joi.string().allow('').optional(),
  OPENROUTER_MODEL: Joi.string().default('openrouter/free'),
  HUGGINGFACE_API_KEY: Joi.string().allow('').optional(),
  HUGGINGFACE_MODEL: Joi.string().default('Qwen/Qwen2.5-7B-Instruct'),
  HUGGINGFACE_BASE_URL: Joi.string()
    .uri()
    .default('https://router.huggingface.co/v1/chat/completions'),
  CLOUDFLARE_API_TOKEN: Joi.string().allow('').optional(),
  CLOUDFLARE_ACCOUNT_ID: Joi.string().allow('').optional(),
  CLOUDFLARE_AI_MODEL: Joi.string().default('@cf/meta/llama-3.1-8b-instruct'),
  OPENAI_API_KEY: Joi.string().allow('').optional(),
  OPENAI_ORG_ID: Joi.string().allow('').optional(),
  OPENAI_MODEL: Joi.string().default('gpt-4o-mini'),
  ANTHROPIC_API_KEY: Joi.string().allow('').optional(),
  ANTHROPIC_MODEL: Joi.string().default('claude-sonnet-4-20250514'),
  GOOGLE_AI_API_KEY: Joi.string().allow('').optional(),
  GOOGLE_AI_MODEL: Joi.string().default('gemini-2.0-flash'),
  OLLAMA_ENABLED: Joi.boolean().truthy('true').falsy('false').default(false),
  OLLAMA_URL: Joi.string().uri().optional(),
  OLLAMA_BASE_URL: Joi.string().uri().default('http://127.0.0.1:11434'),
  OLLAMA_MODEL: Joi.string().default('llama3.2:1b'),
  EMBEDDING_PROVIDER: Joi.string().default('openai'),
  EMBEDDING_MODEL: Joi.string().default('text-embedding-3-small'),
  EMBEDDING_DIMENSIONS: Joi.number().integer().positive().default(1536),

  // Storage
  STORAGE_PROVIDER: Joi.string().valid('local', 's3').default('local'),
  STORAGE_LOCAL_PATH: Joi.string().default('./uploads'),
  S3_BUCKET: Joi.string().allow('').optional(),
  S3_REGION: Joi.string().allow('').optional(),
  S3_ACCESS_KEY: Joi.string().allow('').optional(),
  S3_SECRET_KEY: Joi.string().allow('').optional(),
  S3_ENDPOINT: Joi.string().allow('').optional(),

  // Queue / BullMQ
  QUEUE_PREFIX: Joi.string().default('ai-twin'),

  // Logging & rate limiting
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .default('info'),
  THROTTLE_TTL: Joi.number().integer().positive().default(60),
  THROTTLE_LIMIT: Joi.number().integer().positive().default(100),

  // WebSocket
  WS_CORS_ORIGIN: Joi.string().optional(),
}).unknown(true);

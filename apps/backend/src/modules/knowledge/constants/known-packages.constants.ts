/**
 * Known npm package → framework/library labels for stack detection.
 * Extend this map as product coverage grows.
 */
export const KNOWN_NPM_PACKAGES: Record<
  string,
  { name: string; category: 'framework' | 'library'; ecosystem: string }
> = {
  '@nestjs/core': {
    name: 'nestjs',
    category: 'framework',
    ecosystem: 'node',
  },
  '@nestjs/common': {
    name: 'nestjs',
    category: 'framework',
    ecosystem: 'node',
  },
  next: { name: 'nextjs', category: 'framework', ecosystem: 'node' },
  nuxt: { name: 'nuxt', category: 'framework', ecosystem: 'node' },
  react: { name: 'react', category: 'framework', ecosystem: 'node' },
  'react-dom': { name: 'react', category: 'framework', ecosystem: 'node' },
  vue: { name: 'vue', category: 'framework', ecosystem: 'node' },
  '@angular/core': {
    name: 'angular',
    category: 'framework',
    ecosystem: 'node',
  },
  express: { name: 'express', category: 'framework', ecosystem: 'node' },
  fastify: { name: 'fastify', category: 'framework', ecosystem: 'node' },
  koa: { name: 'koa', category: 'framework', ecosystem: 'node' },
  '@prisma/client': {
    name: 'prisma',
    category: 'library',
    ecosystem: 'node',
  },
  prisma: { name: 'prisma', category: 'library', ecosystem: 'node' },
  typeorm: { name: 'typeorm', category: 'library', ecosystem: 'node' },
  mongoose: { name: 'mongoose', category: 'library', ecosystem: 'node' },
  sequelize: { name: 'sequelize', category: 'library', ecosystem: 'node' },
  bullmq: { name: 'bullmq', category: 'library', ecosystem: 'node' },
  bull: { name: 'bull', category: 'library', ecosystem: 'node' },
  ioredis: { name: 'ioredis', category: 'library', ecosystem: 'node' },
  redis: { name: 'redis', category: 'library', ecosystem: 'node' },
  axios: { name: 'axios', category: 'library', ecosystem: 'node' },
  zod: { name: 'zod', category: 'library', ecosystem: 'node' },
  'class-validator': {
    name: 'class-validator',
    category: 'library',
    ecosystem: 'node',
  },
  graphql: { name: 'graphql', category: 'library', ecosystem: 'node' },
  '@apollo/client': {
    name: 'apollo',
    category: 'library',
    ecosystem: 'node',
  },
  tailwindcss: {
    name: 'tailwindcss',
    category: 'library',
    ecosystem: 'node',
  },
  recharts: { name: 'recharts', category: 'library', ecosystem: 'node' },
  'socket.io': {
    name: 'socket.io',
    category: 'library',
    ecosystem: 'node',
  },
  passport: { name: 'passport', category: 'library', ecosystem: 'node' },
  jsonwebtoken: {
    name: 'jsonwebtoken',
    category: 'library',
    ecosystem: 'node',
  },
  argon2: { name: 'argon2', category: 'library', ecosystem: 'node' },
  bcrypt: { name: 'bcrypt', category: 'library', ecosystem: 'node' },
  dotenv: { name: 'dotenv', category: 'library', ecosystem: 'node' },
  joi: { name: 'joi', category: 'library', ecosystem: 'node' },
  pino: { name: 'pino', category: 'library', ecosystem: 'node' },
  winston: { name: 'winston', category: 'library', ecosystem: 'node' },
  jest: { name: 'jest', category: 'library', ecosystem: 'node' },
  vitest: { name: 'vitest', category: 'library', ecosystem: 'node' },
  playwright: {
    name: 'playwright',
    category: 'library',
    ecosystem: 'node',
  },
  '@nestjs/swagger': {
    name: 'nestjs-swagger',
    category: 'library',
    ecosystem: 'node',
  },
  '@nestjs/bullmq': {
    name: 'nestjs-bullmq',
    category: 'library',
    ecosystem: 'node',
  },
};

export const STACK_SCAN_LIMITS = {
  maxSourceFiles: 30,
  maxFileBytes: 200_000,
  sourceExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'] as const,
  ignoredPathParts: [
    'node_modules/',
    'dist/',
    'build/',
    '.next/',
    'coverage/',
    'vendor/',
  ] as const,
} as const;

# @adt/config

Shared configuration presets for the AI Digital Twin Platform.

## Purpose

This package centralizes shared tooling configurations:

- ESLint presets (base, frontend, backend)
- TypeScript base configurations
- Prettier configuration
- Other shared tool configs

## Usage

Extend configurations in app-level config files:

```json
{
  "extends": "@adt/config/tsconfig.base.json"
}
```

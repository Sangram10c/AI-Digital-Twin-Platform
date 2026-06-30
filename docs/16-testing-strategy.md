# Testing Strategy

## Testing Pyramid

```
        /  E2E  \
       / Integration \
      /    Unit Tests   \
```

## Unit Tests (Jest)

- **Target**: 80%+ code coverage
- **Location**: Co-located with source files
- **Naming**: `*.spec.ts`

## Integration Tests (Supertest)

- **Target**: All API endpoints
- **Location**: `backend/test/`
- **Naming**: `*.e2e-spec.ts`

## E2E Tests (Playwright)

- **Target**: Critical user flows
- **Location**: `frontend/tests/e2e/`
- **Browsers**: Chromium, Firefox, WebKit

## Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test -- --coverage
```

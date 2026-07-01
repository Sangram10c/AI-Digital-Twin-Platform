# Coding Standards

## Naming Conventions

| Element    | Convention               | Example           |
| ---------- | ------------------------ | ----------------- |
| Files      | kebab-case               | `user-service.ts` |
| Classes    | PascalCase               | `UserService`     |
| Interfaces | PascalCase (no I prefix) | `UserResponse`    |
| Functions  | camelCase                | `getUserById`     |
| Constants  | UPPER_SNAKE_CASE         | `MAX_PAGE_SIZE`   |
| Enums      | PascalCase               | `UserRole`        |
| DTOs       | PascalCase + Dto         | `CreateUserDto`   |
| Components | PascalCase               | `UserProfile`     |
| Hooks      | camelCase (use prefix)   | `useAuth`         |
| Stores     | camelCase (use suffix)   | `useAuthStore`    |

## Architecture Patterns

- **Clean Architecture**: Separate concerns into layers
- **SOLID Principles**: Single responsibility, open-closed, etc.
- **Feature-First**: Group by feature, not by type
- **Repository Pattern**: Abstract data access
- **Service Layer**: Business logic in services
- **DTO Pattern**: Validate and transform input/output

## TypeScript Rules

- **Strict mode**: Always enabled
- **No `any`**: Use `unknown` or proper types
- **No unused imports**: ESLint enforced
- **Explicit return types**: On public methods
- **Readonly**: Use where appropriate

## Git Conventions

- **Commits**: Conventional Commits format
- **Branches**: `feature/`, `bugfix/`, `hotfix/`, `chore/`
- **PRs**: Use the PR template, require reviews

# Contributing

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Submit a pull request

## Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/ai-digital-twin.git
cd ai-digital-twin

# Run setup script
bash scripts/setup.sh

# Start infrastructure
docker-compose up -d

# Start development servers
npm run dev
```

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add user authentication
fix: resolve login redirect issue
docs: update API documentation
chore: upgrade dependencies
```

## Pull Request Process

1. Update documentation for any changed functionality
2. Add tests for new features
3. Ensure CI passes
4. Get at least one code review approval
5. Squash and merge

## Code Review Guidelines

- Be constructive and kind
- Focus on logic, not style (automated by Prettier)
- Check for security implications
- Verify test coverage

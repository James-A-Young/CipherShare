# Contributing to CipherShare

Thank you for considering contributing to CipherShare! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help create a welcoming environment

## Getting Started

1. **Fork the repository**

   ```bash
   git clone https://github.com/yourusername/ciphershare.git
   cd ciphershare
   ```

2. **Set up development environment**

   ```bash
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running the Application

```bash
# Start Redis
docker-compose up -d

# Start development servers (frontend + backend)
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Code Style

We use TypeScript with strict mode enabled. Please ensure:

- All code is properly typed
- No `any` types unless absolutely necessary
- Use functional components for React
- Follow existing code patterns

### Commit Messages

Use conventional commit format:

```
feat: add new feature
fix: fix bug in component
docs: update README
style: format code
refactor: refactor crypto service
test: add tests for API
chore: update dependencies
```

## Testing

### Writing Tests

- Add tests for all new features
- Maintain or improve code coverage
- Test both success and error cases

### Running Tests

This project uses a dual testing setup:

```bash
# Run all tests (Vitest + Jest in parallel)
npm test

# Run frontend tests only (Vitest)
npm run test:frontend

# Run backend tests only (Jest)
npm run test:unit

# Run in watch mode (Vitest)
npm run test:watch

# Run specific test file (Vitest)
npm run test:frontend -- RequestGeneration.test.tsx

# Run specific test file (Jest)
npm run test:unit -- crypto.service.test.ts
```

## Pull Request Process

1. **Update documentation** if you're changing functionality
2. **Add tests** for new features
3. **Ensure all tests pass** locally
4. **Update README.md** if needed
5. **Create a pull request** with a clear description

### PR Checklist

- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] Code follows project style
- [ ] No console.log statements (use proper logging)
- [ ] Commit messages follow convention
- [ ] Branch is up to date with main

## Areas for Contribution

### High Priority

- [ ] Rate limiting for API endpoints
- [ ] Additional encryption algorithms support
- [ ] Audit logging for security events
- [ ] Multi-language support (i18n)
- [ ] Password strength meter
- [ ] Backup and restore functionality

### Medium Priority

- [ ] Dark/light theme toggle
- [ ] Export secrets in encrypted format
- [ ] Admin dashboard
- [ ] Metrics and monitoring
- [ ] File attachment support
- [ ] QR code generation for URLs

### Documentation

- [ ] API documentation improvements
- [ ] Deployment guides for various platforms
- [ ] Security best practices guide
- [ ] Architecture diagrams
- [ ] Video tutorials

## Security

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email security concerns to: security@ciphershare.app
3. Include detailed information about the vulnerability
4. Allow time for the issue to be addressed before public disclosure

## Questions?

- Open an issue for bugs or feature requests
- Tag issues appropriately
- Search existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to CipherShare! 🔐

# GitHub Copilot Instructions

This directory contains comprehensive instructions for GitHub Copilot coding agent to help maintain code quality, security, and consistency across the CipherShare project.

## Instruction Files

### `.instructions.md` (General)
- **Scope**: All files in the repository
- **Purpose**: Provides general coding standards, testing requirements, and project overview
- **Key Topics**:
  - Tech stack overview
  - TypeScript and coding standards
  - Security best practices
  - Testing requirements
  - Development workflow
  - Commit message conventions

### `frontend.md`
- **Scope**: `src/**/*.{ts,tsx}` (Frontend React components)
- **Excluded**: Code review agent
- **Purpose**: React-specific development guidelines
- **Key Topics**:
  - React component structure and patterns
  - State management with hooks
  - Form handling and validation
  - Tailwind CSS styling guidelines
  - Component testing with Vitest
  - Performance optimization

### `backend.md`
- **Scope**: `server/**/*.ts` (Backend Express server)
- **Excluded**: Code review agent
- **Purpose**: Backend API and service development guidelines
- **Key Topics**:
  - Express server setup and middleware
  - Service layer architecture (CryptoService, RedisService, EmailService)
  - API endpoint conventions
  - Rate limiting strategies
  - Error handling and logging
  - Environment configuration

### `testing.md`
- **Scope**: `**/__tests__/**/*.{ts,tsx}` (All test files)
- **Excluded**: Coding agent (only for code review)
- **Purpose**: Testing standards and best practices
- **Key Topics**:
  - Dual testing setup (Vitest + Jest)
  - Test structure and organization
  - Frontend component testing patterns
  - Backend service testing patterns
  - Mocking strategies
  - Async testing patterns

### `security.md`
- **Scope**: `{server/crypto.service.ts,server/email.service.ts,server/redis.service.ts}`
- **Purpose**: Critical security and cryptography guidelines
- **Key Topics**:
  - AES-256-GCM encryption requirements
  - PBKDF2 password hashing standards
  - Dual-layer encryption architecture
  - Timing attack prevention
  - Secure logging practices
  - Data retention and expiration policies

### `documentation.md`
- **Scope**: `{README.md,ARCHITECTURE.md,CONTRIBUTING.md,*.md,docs/**/*.md}`
- **Excluded**: Coding agent (only for documentation updates)
- **Purpose**: Documentation writing standards and maintenance
- **Key Topics**:
  - Writing style and formatting guidelines
  - Document-specific requirements
  - API documentation format
  - Markdown best practices
  - Documentation maintenance procedures

## How Copilot Uses These Instructions

1. **Context-Aware**: Copilot automatically applies the appropriate instructions based on which files you're working on
2. **Layered Approach**: General instructions apply to all files, while specific files get additional targeted guidance
3. **Agent-Specific**: Some instructions are only for coding agent or code review agent
4. **Best Practices**: Instructions encode project-specific patterns, security requirements, and quality standards

## File Scoping

The `applyTo` property in each instruction file uses glob patterns to specify which files the instructions apply to:

- `src/**/*.{ts,tsx}` - All TypeScript files in src directory
- `server/**/*.ts` - All TypeScript files in server directory
- `**/__tests__/**/*.{ts,tsx}` - All test files
- `{file1.ts,file2.ts}` - Specific files only

## Maintaining These Instructions

### When to Update

- New coding patterns are established
- Security requirements change
- Technology stack is updated
- New best practices are adopted
- Testing strategies evolve

### Update Guidelines

1. Keep instructions clear and actionable
2. Provide code examples for complex concepts
3. Explain "why" behind requirements
4. Keep security instructions strictly enforced
5. Update all affected files when project structure changes

## Benefits

✅ **Consistency**: Enforces coding standards across the entire codebase
✅ **Security**: Embeds critical security requirements in development workflow
✅ **Quality**: Ensures tests and documentation are maintained
✅ **Onboarding**: New contributors (and Copilot) understand project patterns
✅ **Efficiency**: Reduces back-and-forth in code reviews

## Learn More

- [Best practices for Copilot coding agent](https://docs.github.com/en/copilot/tutorials/coding-agent/get-the-best-results)
- [GitHub Copilot documentation](https://docs.github.com/en/copilot)
- [Copilot agent concepts](https://docs.github.com/en/copilot/concepts/agents/coding-agent)

---

**Note**: These instructions are designed to work with GitHub Copilot coding agent and code review features. They help maintain code quality while allowing Copilot to be an effective development partner.

---
applyTo: "**/__tests__/**/*.{ts,tsx}"
excludeAgent: "coding-agent"
---

# Testing Instructions

## Testing Philosophy

CipherShare uses a dual testing setup:
- **Vitest** for frontend React component tests
- **Jest** for backend service tests

All new code must include comprehensive tests covering success paths, error handling, and edge cases.

## Test Structure

### Naming Conventions

```
src/__tests__/ComponentName.test.tsx
server/__tests__/service-name.test.ts
```

### Test Organization

```typescript
describe('ComponentName or ServiceName', () => {
  // Setup
  beforeEach(() => {
    // Common setup for all tests
  });
  
  afterEach(() => {
    // Cleanup
  });
  
  describe('Feature or Method', () => {
    it('should do something specific', () => {
      // Test implementation
    });
    
    it('should handle error case', () => {
      // Error test
    });
  });
});
```

## Frontend Testing (Vitest)

### Component Testing

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';

describe('RequestGeneration', () => {
  it('should render form elements', () => {
    render(<RequestGeneration />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument();
  });
  
  it('should submit form with valid data', async () => {
    const mockApi = vi.spyOn(api, 'createRequest');
    render(<RequestGeneration />);
    
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: /generate/i }));
    
    await waitFor(() => {
      expect(mockApi).toHaveBeenCalledWith(expect.objectContaining({
        email: 'test@example.com'
      }));
    });
  });
});
```

### Mocking API Calls

```typescript
import { vi } from 'vitest';
import * as api from '../api';

vi.mock('../api', () => ({
  createRequest: vi.fn(),
  submitSecret: vi.fn(),
  retrieveSecret: vi.fn()
}));
```

### Testing User Interactions

- Use `userEvent` for realistic user interactions
- Use `fireEvent` only when necessary
- Wait for async operations with `waitFor`
- Query elements by role, label, or text (not by class or id)

## Backend Testing (Jest)

### Service Testing

```typescript
import { CryptoService } from '../../server/crypto.service';

describe('CryptoService', () => {
  let cryptoService: CryptoService;
  const testKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  
  beforeEach(() => {
    cryptoService = new CryptoService(testKey);
  });
  
  describe('Encryption', () => {
    it('should encrypt and decrypt data', () => {
      const data = 'secret message';
      const encrypted = cryptoService.encryptWithSystemKey(data);
      const decrypted = cryptoService.decryptWithSystemKey(encrypted);
      expect(decrypted).toBe(data);
    });
    
    it('should produce different ciphertext each time', () => {
      const data = 'secret message';
      const encrypted1 = cryptoService.encryptWithSystemKey(data);
      const encrypted2 = cryptoService.encryptWithSystemKey(data);
      expect(encrypted1).not.toBe(encrypted2);
    });
  });
});
```

### Mocking Dependencies

```typescript
// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn()
  }))
}));

// Mock environment variables
process.env.SYSTEM_SECRET_KEY = 'test-key-64-characters';
```

## Test Coverage Requirements

### What to Test

- **Success Paths**: Normal operation with valid inputs
- **Error Handling**: Invalid inputs, missing data, API failures
- **Edge Cases**: Boundary conditions, empty inputs, special characters
- **Security**: Authentication, authorization, rate limiting
- **State Changes**: Component state updates, data persistence

### What Not to Test

- External library implementations
- Simple getters/setters without logic
- Third-party API behavior (mock instead)

## Assertions and Matchers

### Common Matchers

```typescript
// Equality
expect(value).toBe(expected);
expect(object).toEqual(expectedObject);

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();

// Numbers
expect(number).toBeGreaterThan(3);
expect(number).toBeLessThanOrEqual(5);

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Objects
expect(object).toHaveProperty('key', value);

// Exceptions
expect(() => fn()).toThrow();
expect(() => fn()).toThrow('error message');

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();
```

### Testing Library Queries

```typescript
// Preferred queries (in order of preference)
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText(/email/i);
screen.getByPlaceholderText(/enter email/i);
screen.getByText(/welcome/i);
screen.getByDisplayValue('current value');

// Query variants
getBy*   // Throws error if not found
queryBy* // Returns null if not found
findBy*  // Returns promise, waits for element
```

## Async Testing

### Frontend Async Tests

```typescript
it('should handle API call', async () => {
  const mockData = { id: '123', url: 'http://example.com' };
  vi.mocked(api.createRequest).mockResolvedValue(mockData);
  
  render(<RequestGeneration />);
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));
  
  await waitFor(() => {
    expect(screen.getByText(/success/i)).toBeInTheDocument();
  });
});
```

### Backend Async Tests

```typescript
it('should handle async operations', async () => {
  const result = await cryptoService.encryptWithPasswordAsync(data, password);
  expect(result).toBeDefined();
  expect(result.encrypted).toBeTruthy();
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run frontend tests only
npm run test:frontend

# Run backend tests only
npm run test:unit

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test:frontend -- RequestGeneration.test.tsx
npm run test:unit -- crypto.service.test.ts

# Run with coverage
npm run test:frontend -- --coverage
npm run test:unit -- --coverage
```

## Test Maintenance

### When to Update Tests

- When adding new features
- When fixing bugs
- When refactoring code
- When changing component/service behavior

### Test Quality Guidelines

- Tests should be independent and isolated
- Tests should be deterministic (no randomness)
- Tests should be fast
- Tests should be readable and maintainable
- Mock external dependencies
- Clean up after tests (clear mocks, reset state)

## Debugging Tests

```typescript
// Frontend debugging
screen.debug(); // Print entire DOM
screen.debug(element); // Print specific element

// Backend debugging
console.log(result); // Log test values
debugger; // Use Node debugger
```

## Common Testing Patterns

### Testing Form Submissions

```typescript
it('should submit form', async () => {
  render(<FormComponent />);
  await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));
  await waitFor(() => {
    expect(mockApi).toHaveBeenCalled();
  });
});
```

### Testing Error States

```typescript
it('should display error message', async () => {
  vi.mocked(api.createRequest).mockRejectedValue(new Error('API Error'));
  render(<FormComponent />);
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));
  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

### Testing Loading States

```typescript
it('should show loading state', async () => {
  const delayedPromise = new Promise(resolve => setTimeout(resolve, 100));
  vi.mocked(api.createRequest).mockReturnValue(delayedPromise);
  
  render(<FormComponent />);
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
});
```

---
applyTo: "src/**/*.{ts,tsx}"
excludeAgent: "code-review"
---

# Frontend Development Instructions

## React Components

### Component Structure

- Use functional components with React Hooks
- Keep components focused on a single responsibility
- Extract reusable logic into custom hooks
- Use TypeScript interfaces for props

### State Management

- Use `useState` for local component state
- Use `useEffect` for side effects
- Avoid prop drilling - consider lifting state when needed
- Keep state as close to where it's used as possible

### Form Handling

- Implement proper form validation
- Show clear error messages to users
- Disable submit buttons during API calls
- Reset forms after successful submission

### API Integration

- Use the centralized `api.ts` module for all API calls
- Implement proper loading states
- Handle errors gracefully with user-friendly messages
- Never expose sensitive data in API calls or responses

## Styling Guidelines

### Tailwind CSS

- Use Tailwind CSS utility classes for styling
- Follow the existing dark theme design
- Maintain consistent spacing and sizing
- Use responsive design classes for mobile support

### Common Patterns

```tsx
// Loading state
{loading && <div>Loading...</div>}

// Error display
{error && <div className="text-red-500">{error}</div>}

// Button styling
<button className="bg-cyan-500 text-black px-6 py-3 rounded-lg hover:bg-cyan-400 transition-colors">
```

## Component-Specific Guidelines

### RequestGeneration Component

- Validate email format before submission
- Provide clear instructions for retention policy selection
- Implement clipboard copy functionality
- Show success state with the generated URL

### SecretSubmission Component

- Validate request ID exists before allowing submission
- Ensure password meets minimum requirements
- Confirm successful submission before showing completion state
- Clear sensitive data from state after submission

### SecretRetrieval Component

- Implement secure password input
- Handle decryption errors gracefully
- Display secrets only after successful password verification
- Clear decrypted data when component unmounts

## Testing Guidelines

### Component Tests

- Test component rendering and initial state
- Test user interactions (clicks, form inputs)
- Test API integration with mocked responses
- Test error handling scenarios

### Testing Best Practices

```tsx
// Use Testing Library best practices
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Use semantic queries
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText(/email/i);

// Test user interactions
await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
await userEvent.click(screen.getByRole('button', { name: /submit/i }));

// Wait for async operations
await waitFor(() => {
  expect(screen.getByText(/success/i)).toBeInTheDocument();
});
```

## Performance Optimization

- Use React.memo() for expensive components
- Implement proper dependency arrays in useEffect
- Avoid unnecessary re-renders
- Lazy load routes if needed

## Accessibility

- Use semantic HTML elements (button, nav, form)
- Provide appropriate ARIA labels
- Ensure keyboard navigation works
- Maintain sufficient color contrast (dark theme)

## Router Setup

- Use React Router 7.1 for navigation
- Define clear route paths
- Implement proper error boundaries
- Handle 404 pages gracefully

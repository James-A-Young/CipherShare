---
applyTo: "{README.md,ARCHITECTURE.md,CONTRIBUTING.md,*.md,docs/**/*.md}"
excludeAgent: "coding-agent"
---

# Documentation Instructions

## Documentation Philosophy

CipherShare maintains comprehensive, clear, and up-to-date documentation to help developers, contributors, and users understand and use the application effectively.

## Documentation Structure

### Core Documents

1. **README.md**: Project overview, quick start, features
2. **ARCHITECTURE.md**: Technical architecture, design decisions
3. **CONTRIBUTING.md**: Contribution guidelines and workflow
4. **QUICKSTART.md**: Step-by-step getting started guide
5. **DEPLOYMENT.md**: Deployment instructions for various platforms
6. **DOCKER.md**: Docker-specific documentation

## Writing Style Guidelines

### Tone and Voice

- Be clear, concise, and professional
- Use active voice
- Write in present tense
- Be friendly and welcoming to contributors
- Use "we" and "you" appropriately

### Formatting Standards

#### Headers

- Use descriptive headers that explain content
- Use emoji icons for visual appeal (sparingly)
- Maintain consistent header hierarchy

```markdown
# Main Title (H1) - One per document
## Major Section (H2)
### Subsection (H3)
#### Detail Level (H4)
```

#### Code Blocks

- Always specify language for syntax highlighting
- Include comments for complex code
- Show complete, runnable examples

```markdown
\`\`\`typescript
// Good example with context
const result = await cryptoService.encrypt(data);
\`\`\`

\`\`\`bash
# Include comments for clarity
npm install
npm run dev
\`\`\`
```

#### Lists

- Use bullet points for unordered lists
- Use numbered lists for sequential steps
- Keep list items parallel in structure
- Use sub-bullets for nested information

```markdown
- Feature one
  - Sub-feature details
- Feature two
- Feature three

1. First step
2. Second step
3. Third step
```

#### Links

- Use descriptive link text (not "click here")
- Link to specific sections with anchors
- Keep external links up to date

```markdown
Good: See [deployment guide](DEPLOYMENT.md)
Bad: Click [here](DEPLOYMENT.md)
```

## Document-Specific Guidelines

### README.md

**Purpose**: Primary entry point for the repository

**Must Include**:
- Project name and description
- Key features with icons/badges
- Tech stack overview
- Prerequisites
- Quick start instructions
- Links to detailed documentation
- License information
- Contribution links

**Style**:
- Use badges for build status, version, etc.
- Include screenshots or demos if UI-related
- Keep installation steps simple
- Highlight security features

### ARCHITECTURE.md

**Purpose**: Technical deep dive for developers

**Must Include**:
- System architecture diagrams
- Component descriptions
- Data flow explanations
- Technology choices and rationale
- Security architecture
- API endpoints and contracts
- Database schema (if applicable)

**Style**:
- Use ASCII diagrams or links to diagrams
- Explain "why" not just "what"
- Include code examples for key patterns
- Reference source files

### CONTRIBUTING.md

**Purpose**: Guide contributors through the process

**Must Include**:
- Code of conduct
- Development setup instructions
- Code style guidelines
- Testing requirements
- Commit message format
- Pull request process
- Areas needing contribution

**Style**:
- Step-by-step instructions
- Checklist format for requirements
- Examples of good practices
- Encourage questions

## Code Comments vs Documentation

### When to Use Code Comments

- Complex algorithms that aren't self-evident
- Security-critical sections
- Workarounds for specific issues
- TODOs with context

### When to Use Documentation

- Public API descriptions
- Architecture decisions
- User-facing features
- Setup and configuration

## Keeping Documentation Updated

### Update Documentation When:

- Adding new features
- Changing APIs or interfaces
- Modifying configuration requirements
- Updating dependencies
- Changing deployment procedures
- Fixing significant bugs

### Documentation Update Checklist

- [ ] README.md reflects new features/changes
- [ ] ARCHITECTURE.md updated if design changed
- [ ] CONTRIBUTING.md updated if workflow changed
- [ ] Code comments added for complex sections
- [ ] API documentation reflects endpoint changes
- [ ] Environment variable docs updated if changed

## Technical Writing Best Practices

### Clarity

- Use simple, direct language
- Define technical terms on first use
- Avoid jargon when possible
- Break complex topics into smaller sections

### Completeness

- Include all necessary information
- Don't assume prior knowledge
- Provide examples for complex concepts
- Link to related documentation

### Accuracy

- Test all code examples
- Verify all commands work
- Keep version numbers current
- Update screenshots when UI changes

### Accessibility

- Use proper heading hierarchy
- Add alt text for images
- Ensure code blocks are properly formatted
- Use descriptive link text

## Diagrams and Visual Aids

### ASCII Diagrams

```markdown
┌──────────────┐
│   Frontend   │
└──────┬───────┘
       │ HTTP
       ▼
┌──────────────┐
│   Backend    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Redis     │
└──────────────┘
```

### When to Use Diagrams

- System architecture overview
- Data flow visualization
- Component relationships
- Deployment topology

## API Documentation

### Endpoint Documentation Format

```markdown
### POST /api/requests

Create a new secret request.

**Request Body:**
\`\`\`json
{
  "email": "user@example.com",
  "description": "Please share your SSH key",
  "retentionPolicy": {
    "type": "views",
    "value": 1
  },
  "reference": "SSH-KEY-001"
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "requestId": "abc123",
  "submissionUrl": "https://app/submit/abc123",
  "retrievalUrl": "https://app/retrieve/xyz789"
}
\`\`\`

**Error Responses:**
- 400: Invalid request data
- 429: Rate limit exceeded
```

## Examples and Tutorials

### Example Quality

- Use realistic, practical examples
- Show both success and error cases
- Include complete context
- Explain what each part does

### Tutorial Structure

1. **Goal**: What will be accomplished
2. **Prerequisites**: What's needed
3. **Steps**: Clear, numbered instructions
4. **Verification**: How to check it worked
5. **Troubleshooting**: Common issues

## Documentation Maintenance

### Regular Reviews

- Review documentation quarterly
- Check for outdated information
- Test all examples and commands
- Update version numbers

### Community Feedback

- Welcome documentation issues
- Respond to unclear sections
- Accept documentation PRs
- Thank contributors

## Markdown Best Practices

### Formatting

```markdown
# Use consistent spacing
## Around headers

- And between sections
- For better readability

\`\`\`typescript
// Always specify language
const example = true;
\`\`\`
```

### Tables

```markdown
| Feature | Description | Status |
|---------|-------------|--------|
| Encryption | AES-256-GCM | ✅ |
| Rate Limiting | Express middleware | ✅ |
```

### Badges

```markdown
![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
```

## Documentation Testing

### Checklist Before Committing

- [ ] All code examples tested
- [ ] All commands verified
- [ ] Links work correctly
- [ ] Spelling and grammar checked
- [ ] Formatting renders correctly
- [ ] Version numbers accurate
- [ ] No sensitive information included

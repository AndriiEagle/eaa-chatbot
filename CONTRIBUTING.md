# Contributing to EAA ChatBot

Thank you for considering contributing to the EAA ChatBot project! This document provides guidelines and information for contributors.

## 🌟 How to Contribute

### Reporting Issues

Before creating an issue, please:

1. **Search existing issues** to avoid duplicates
2. **Use the issue templates** when available
3. **Provide detailed information** including:
   - Steps to reproduce the problem
   - Expected vs actual behavior
   - Environment details (OS, Node.js version, etc.)
   - Screenshots or logs if applicable

### Suggesting Features

We welcome feature suggestions! Please:

1. **Check existing feature requests** first
2. **Create a detailed proposal** including:
   - Use case and problem it solves
   - Proposed solution
   - Alternative approaches considered
   - Potential impact on existing functionality

## 🚀 Development Setup

### Prerequisites

- Node.js 18.0.0+
- npm 8.0.0+
- Git
- Supabase account
- OpenAI API key

### Getting Started

1. **Fork the repository**
```bash
git clone https://github.com/your-username/eaa-chatbot.git
cd eaa-chatbot/ParserForChuncks
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Run tests to ensure everything works**
```bash
npm test
```

5. **Start development server**
```bash
npm run dev
```

## 📝 Development Guidelines

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### TypeScript Guidelines

- **Use strict typing** - avoid `any` when possible
- **Define interfaces** for complex objects
- **Use proper error handling** with try-catch blocks
- **Document complex functions** with JSDoc comments

```typescript
/**
 * Processes user query and generates AI response
 * @param query - User's question
 * @param userId - Unique user identifier
 * @param sessionId - Chat session identifier
 * @returns Promise with AI response and metadata
 */
async function processQuery(
  query: string,
  userId: string,
  sessionId: string
): Promise<QueryResponse> {
  // Implementation
}
```

### Testing Requirements

- **Write tests** for new functionality
- **Maintain 100% test coverage** for critical paths
- **Use descriptive test names**
- **Test both success and error scenarios**

```typescript
describe('SuggestionService', () => {
  it('should generate context-appropriate suggestions for business users', async () => {
    // Test implementation
  });

  it('should handle API failures gracefully', async () => {
    // Test implementation
  });
});
```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(ai): add frustration detection agent
fix(api): resolve memory leak in session management
docs(readme): update installation instructions
test(suggestions): add comprehensive test suite
```

## 🏗️ Architecture Guidelines

### File Structure

```
src/
├── controllers/          # HTTP request handlers
├── services/            # Business logic
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
├── schemas/             # Validation schemas
├── repositories/        # Data access layer
├── hooks/               # Custom hooks
└── client/              # React frontend
    ├── src/
    │   ├── components/  # React components
    │   ├── types/       # Frontend types
    │   ├── utils/       # Frontend utilities
    │   └── constants/   # Configuration constants
    └── public/          # Static assets
```

### Design Principles

1. **Separation of Concerns** - Keep business logic separate from HTTP handling
2. **Single Responsibility** - Each function/class should have one clear purpose
3. **Dependency Injection** - Use dependency injection for testability
4. **Error Handling** - Implement comprehensive error handling
5. **Logging** - Add appropriate logging for debugging and monitoring

### AI Agent Development

When creating new AI agents:

1. **Follow the existing pattern** in `src/services/suggestionService/analyzers/`
2. **Use proper error handling** for OpenAI API calls
3. **Implement fallback mechanisms** for API failures
4. **Add comprehensive tests** with mocked responses
5. **Document the agent's purpose** and expected inputs/outputs

```typescript
export class NewAIAnalyzer {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async analyze(input: AnalysisInput): Promise<AnalysisResult> {
    try {
      // Implementation with proper error handling
    } catch (error) {
      // Fallback mechanism
    }
  }
}
```

## 🧪 Testing Guidelines

### Test Categories

1. **Unit Tests** - Test individual functions/classes
2. **Integration Tests** - Test component interactions
3. **AI Tests** - Test AI agent responses (with mocking)
4. **API Tests** - Test HTTP endpoints

### Writing Good Tests

```typescript
// ✅ Good test
describe('FrustrationAnalyzer', () => {
  beforeEach(() => {
    // Setup test environment
  });

  it('should detect high frustration level from angry messages', async () => {
    const analyzer = new FrustrationAnalyzer();
    const result = await analyzer.analyze({
      messages: ['This is terrible!', 'Nothing works!'],
      userId: 'test-user'
    });

    expect(result.frustrationLevel).toBeGreaterThan(0.7);
    expect(result.shouldEscalate).toBe(true);
  });
});

// ❌ Bad test
it('should work', async () => {
  const result = await someFunction();
  expect(result).toBeTruthy();
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- suggestion.service.test.ts

# Run tests with coverage
npm run test:coverage
```

## 🔄 Pull Request Process

### Before Submitting

1. **Create a feature branch** from `main`
```bash
git checkout -b feature/amazing-feature
```

2. **Make your changes** following the guidelines above

3. **Write/update tests** for your changes

4. **Run the full test suite**
```bash
npm test
npm run lint
npm run type-check
```

5. **Update documentation** if needed

6. **Commit your changes** using conventional commits

### PR Requirements

- [ ] **Descriptive title** and detailed description
- [ ] **All tests pass** (including new tests for new features)
- [ ] **No linting errors**
- [ ] **TypeScript compilation succeeds**
- [ ] **Documentation updated** (if applicable)
- [ ] **Breaking changes documented** (if applicable)

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests pass locally

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is commented where necessary
- [ ] Documentation updated
- [ ] No new warnings introduced
```

## 🎯 Areas for Contribution

We especially welcome contributions in these areas:

### High Priority
- **Performance optimization** - Improve response times
- **Test coverage** - Expand test suites
- **Documentation** - API docs, tutorials, examples
- **Accessibility** - Improve UI accessibility features
- **Security** - Security audits and improvements

### Medium Priority
- **Internationalization** - Multi-language support
- **Mobile responsiveness** - Better mobile experience
- **Analytics** - Enhanced monitoring and metrics
- **Integration** - Third-party service integrations

### Low Priority
- **UI/UX improvements** - Design enhancements
- **Code refactoring** - Code quality improvements
- **Performance monitoring** - Advanced monitoring tools

## 🆘 Getting Help

- **Documentation**: Check the [README](README.md) and [API docs](docs/api/)
- **Issues**: Search [existing issues](https://github.com/your-username/eaa-chatbot/issues)
- **Discussions**: Use [GitHub Discussions](https://github.com/your-username/eaa-chatbot/discussions)
- **Email**: Contact us at dev@eaa-chatbot.com

## 🏆 Recognition

Contributors will be:
- **Listed in CONTRIBUTORS.md**
- **Mentioned in release notes** for significant contributions
- **Invited to join** the core contributor team (for regular contributors)

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

Thank you for helping make EAA ChatBot better for everyone! 🚀 
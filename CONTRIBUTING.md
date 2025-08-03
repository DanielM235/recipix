# Contributing to Recipix

Thank you for your interest in contributing to Recipix! This document provides guidelines for contributing to the project.

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/recipix.git`
3. Run the setup script: `./setup.sh`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## Code Standards

### General Guidelines
- All code and comments must be in English
- Use TypeScript strict mode
- Follow the existing code patterns and architecture
- Write tests for new features
- Update documentation when needed

### Frontend (React TypeScript)
- Use functional components with hooks
- Implement proper TypeScript interfaces for props
- Use React.memo() for performance when needed
- Follow the component structure in existing files
- Use Tailwind CSS for styling
- Implement i18n for all user-facing text

### Backend (Node.js Express)
- Use TypeScript strict mode
- Implement proper error handling
- Use structured logging with Winston
- Follow RESTful API patterns
- Validate inputs with Joi
- Write unit tests for services and controllers

### Testing Requirements
- Maintain >70% code coverage
- Write unit tests for components and services
- Test i18n functionality
- Mock external dependencies

## Pull Request Process

1. **Before submitting:**
   - Run tests: `npm test`
   - Check linting: `npm run lint`
   - Test build: `npm run build`
   - Update documentation if needed

2. **Pull Request Guidelines:**
   - Use descriptive titles and descriptions
   - Reference related issues
   - Include screenshots for UI changes
   - Ensure all checks pass

3. **Review Process:**
   - Code review by maintainers
   - Automated tests must pass
   - Documentation review if applicable

## Adding New Financial Connectors

When adding support for new financial systems:

1. **Create connector class:**
   ```typescript
   export class NewSystemConnector implements ExpenseConnector {
     name = 'New System'
     type = 'newsystem'
     config: ConnectorConfig

     constructor(config: ConnectorConfig) {
       this.config = config
     }

     async testConnection(): Promise<{ connected: boolean; message: string }> {
       // Implement connection test
     }

     async submitExpense(expenseData: ExpenseData): Promise<{ transactionId: string; success: boolean }> {
       // Implement expense submission
     }
   }
   ```

2. **Add to connector factory**
3. **Update route handlers**
4. **Add tests**
5. **Update documentation**

## Issue Reporting

When reporting issues:

1. **Bug Reports:**
   - Use the bug report template
   - Include steps to reproduce
   - Provide system information
   - Include error messages/logs

2. **Feature Requests:**
   - Use the feature request template
   - Describe the use case
   - Explain expected behavior
   - Consider implementation impact

## Development Workflow

1. **Feature Development:**
   - Start with shared types if needed
   - Implement backend API with tests
   - Create frontend components with tests
   - Add i18n translations
   - Update documentation

2. **Testing:**
   - Test API endpoints
   - Verify frontend/backend integration
   - Test file upload and processing
   - Validate connector functionality

## Code Review Checklist

- [ ] TypeScript strict mode compliance
- [ ] Test coverage maintained
- [ ] Error handling implemented
- [ ] Internationalization support
- [ ] Security considerations addressed
- [ ] Documentation updated
- [ ] Performance considerations
- [ ] Accessibility compliance

## Release Process

1. Update version numbers
2. Update CHANGELOG.md
3. Create release notes
4. Tag release
5. Deploy to staging
6. Run integration tests
7. Deploy to production

## Getting Help

- Check existing issues and documentation
- Join discussions in GitHub Issues
- Follow the project for updates

## Recognition

Contributors will be acknowledged in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to Recipix!

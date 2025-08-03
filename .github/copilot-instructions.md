# Recipix - GitHub Copilot Instructions

## Project Overview

Recipix is a Progressive Web App (PWA) designed to capture, process, and send payment receipts to financial management systems via their APIs. The app features a React TypeScript frontend with i18n support and a Node.js Express TypeScript backend with modular connector architecture.

## Architecture Guidelines

### Frontend (React TypeScript PWA)
- **Framework**: React 18 with TypeScript in strict mode
- **Styling**: Tailwind CSS with dark/light theme support
- **Internationalization**: react-i18next with pt-BR (default) and en fallback
- **State Management**: React Context API for theme and auth
- **PWA Features**: Service Worker, Web App Manifest, offline support
- **Testing**: Jest + React Testing Library with >70% coverage

### Backend (Node.js Express TypeScript)
- **Framework**: Express with TypeScript in strict mode
- **Architecture**: Modular connector system for financial integrations
- **File Processing**: OCR with Tesseract.js, PDF parsing with pdf-parse
- **Security**: Helmet, CORS, rate limiting, input validation with Joi
- **Logging**: Winston with structured logging
- **Testing**: Jest with >70% coverage

### Shared Components
- **Types**: Shared TypeScript interfaces in `/shared/types.ts`
- **API Contracts**: RESTful API with consistent response format
- **Error Handling**: Centralized error handling with proper HTTP status codes

## Code Standards

### General Rules
1. **Language**: All code and comments must be in English
2. **TypeScript**: Use strict mode, avoid `any` types
3. **Functional Components**: Use React hooks, avoid class components
4. **Modern Syntax**: Use ES6+ features, async/await over Promises
5. **Error Handling**: Always handle errors gracefully with user-friendly messages

### File Organization
```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page-level components
│   ├── contexts/       # React Context providers
│   ├── services/       # API and external service calls
│   ├── utils/          # Utility functions
│   ├── i18n/           # Internationalization config and translations
│   └── __tests__/      # Test files

backend/
├── src/
│   ├── routes/         # Express route handlers
│   ├── middleware/     # Custom middleware
│   ├── connectors/     # Financial system integrations
│   ├── utils/          # Utility functions
│   └── __tests__/      # Test files

shared/
└── types.ts           # Shared TypeScript interfaces
```

### Component Guidelines
- Use functional components with TypeScript interfaces for props
- Implement proper prop validation and default values
- Use React.memo() for performance optimization when needed
- Keep components small and focused on single responsibility

### API Guidelines
- RESTful endpoints with consistent response format:
  ```typescript
  {
    success: boolean
    data?: T
    error?: string
    message?: string
  }
  ```
- Proper HTTP status codes (200, 201, 400, 401, 404, 500)
- Input validation with Joi schemas
- Rate limiting and security headers

### Connector Architecture
- Implement `ExpenseConnector` interface for all financial system integrations
- Support modular addition of new connectors without core changes
- Provide connection testing and status endpoints
- Handle OAuth2 flows for secure API access

### Testing Requirements
- Unit tests for all components and services
- Integration tests for API endpoints
- Test i18n functionality with different locales
- Mock external dependencies (APIs, file system)
- Maintain >70% code coverage

### Performance Considerations
- Implement lazy loading for large components
- Optimize images with Sharp for OCR processing
- Use React.Suspense for code splitting
- Implement proper caching strategies

### Security Best Practices
- Validate all inputs on both frontend and backend
- Use environment variables for sensitive configuration
- Implement proper CORS policies
- Secure file upload handling with type validation
- Use HTTPS in production

### Deployment
- Docker containerization with multi-stage builds
- Environment-specific configuration
- Health checks and monitoring
- Graceful error handling and logging

## Development Workflow

1. **Feature Development**:
   - Start with shared types definition
   - Implement backend API with tests
   - Create frontend components with tests
   - Add i18n translations for new strings

2. **Integration Testing**:
   - Test API endpoints with different scenarios
   - Verify frontend/backend integration
   - Test file upload and processing flows
   - Validate connector functionality

3. **Code Review Checklist**:
   - TypeScript strict mode compliance
   - Test coverage maintained
   - Error handling implemented
   - Internationalization support
   - Security considerations addressed

## Specific Technologies

### Frontend Dependencies
- React 18 + TypeScript
- Tailwind CSS + PostCSS
- react-i18next for internationalization
- react-router-dom for routing
- react-dropzone for file uploads
- axios for API calls
- react-hot-toast for notifications

### Backend Dependencies
- Express + TypeScript
- multer for file uploads
- sharp for image processing
- tesseract.js for OCR
- pdf-parse for PDF processing
- winston for logging
- joi for validation
- helmet for security

### Development Tools
- Vite for frontend build
- Jest for testing
- ESLint + TypeScript ESLint
- Prettier for code formatting
- Nodemon for backend development

## Connector Implementation Example

When adding new financial system connectors:

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

## Common Patterns

### API Error Handling
```typescript
try {
  const result = await apiCall()
  return { success: true, data: result }
} catch (error) {
  logger.error('Operation failed:', error)
  return { success: false, error: error.message }
}
```

### React Component Structure
```typescript
interface Props {
  readonly title: string
  readonly onSubmit: (data: FormData) => void
}

const Component: React.FC<Props> = ({ title, onSubmit }) => {
  const { t } = useTranslation()
  
  return (
    <div className="component-container">
      <h1>{t('title')}</h1>
      {/* Component content */}
    </div>
  )
}

export default Component
```

## Troubleshooting

### Common Issues
1. **CORS Errors**: Check CORS_ORIGIN environment variable
2. **File Upload Issues**: Verify UPLOAD_DIR permissions and MAX_FILE_SIZE
3. **OCR Processing**: Ensure Tesseract dependencies are installed
4. **Firefly III Connection**: Validate API URL and personal access token

### Debug Tips
- Use structured logging with Winston
- Check browser developer tools for frontend issues
- Verify API responses in network tab
- Test file uploads with different file types and sizes

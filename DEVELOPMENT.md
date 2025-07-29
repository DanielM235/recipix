# Recipix Development Guide

## Quick Start

1. **Prerequisites**
   ```bash
   node --version  # Should be 18+
   npm --version   # Should be 8+
   ```

2. **Setup**
   ```bash
   ./setup.sh
   # OR manually:
   npm run install:all
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Development**
   ```bash
   npm run dev  # Starts both frontend (3000) and backend (3001)
   ```

## Project Structure

```
recipix/
├── frontend/           # React TypeScript PWA
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── pages/      # Page components
│   │   ├── contexts/   # React contexts
│   │   ├── services/   # API services
│   │   ├── utils/      # Utility functions
│   │   └── i18n/       # Internationalization
│   ├── public/         # Static assets
│   └── dist/           # Build output
├── backend/            # Node.js Express API
│   ├── src/
│   │   ├── routes/     # API routes
│   │   ├── middleware/ # Express middleware
│   │   ├── connectors/ # Financial system connectors
│   │   └── utils/      # Utility functions
│   ├── uploads/        # File uploads
│   └── dist/           # Build output
├── shared/             # Shared TypeScript types
└── docker/             # Docker configuration
```

## Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend
- `npm run build` - Build both for production
- `npm test` - Run all tests
- `npm run install:all` - Install all dependencies

### Frontend
- `npm run dev:frontend` - Start frontend dev server
- `npm run build:frontend` - Build frontend
- `npm run test:frontend` - Run frontend tests

### Backend
- `npm run dev:backend` - Start backend dev server
- `npm run build:backend` - Build backend
- `npm run test:backend` - Run backend tests

## Configuration

### Environment Variables (.env)
```bash
# Backend
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Firefly III
FIREFLY_III_URL=https://your-firefly-instance.com
FIREFLY_III_TOKEN=your-personal-access-token

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=uploads

# Security
JWT_SECRET=your-jwt-secret
```

## API Endpoints

### Health
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health with dependencies

### Receipts
- `POST /api/receipts/upload` - Upload receipt file
- `GET /api/receipts` - List receipts with pagination
- `GET /api/receipts/:id` - Get specific receipt
- `POST /api/receipts/:id/process` - Process receipt with OCR
- `POST /api/receipts/:id/submit` - Submit expense to financial system

### Connectors
- `POST /api/connectors/test` - Test connector connection
- `GET /api/connectors/:type/status` - Get connector status

## Adding New Financial Connectors

1. **Create connector class**:
   ```typescript
   export class NewConnector implements ExpenseConnector {
     name = 'New System'
     type = 'newsystem'
     
     async testConnection() { /* ... */ }
     async submitExpense(data) { /* ... */ }
   }
   ```

2. **Register in factory**:
   ```typescript
   export function createConnector(config: ConnectorConfig) {
     switch (config.type) {
       case 'newsystem':
         return new NewConnector(config)
       // ...
     }
   }
   ```

3. **Add to route handler** in `connectors.ts`

## Testing

### Frontend Tests
```bash
cd frontend
npm test                    # Run tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage
```

### Backend Tests
```bash
cd backend
npm test                    # Run tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage
```

## Deployment

### Docker
```bash
docker build -t recipix .
docker run -p 3000:3000 -p 3001:3001 recipix
```

### Docker Compose
```bash
docker-compose up -d
```

### Platform Specific
- **Render**: Uses `render.yaml`
- **Fly.io**: Uses `fly.toml`
- **Vercel**: Uses `vercel.json`

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `CORS_ORIGIN` in `.env`
   - Ensure frontend URL matches backend CORS config

2. **File Upload Issues**
   - Check `MAX_FILE_SIZE` and `UPLOAD_DIR` settings
   - Verify directory permissions

3. **OCR Processing Fails**
   - Ensure Tesseract is installed in production
   - Check file format and size

4. **Firefly III Connection**
   - Verify URL format (https://domain.com)
   - Check personal access token validity
   - Test connection in Settings page

### Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload
2. **Logging**: Check browser console and backend logs
3. **API Testing**: Use browser network tab or tools like Postman
4. **Type Safety**: TypeScript strict mode is enabled

## Contributing

1. Follow the established patterns in existing code
2. Write tests for new features
3. Update documentation
4. Use English for all code and comments
5. Follow TypeScript strict mode guidelines

## Architecture Decisions

- **PWA**: For offline capability and mobile experience
- **TypeScript**: For type safety and better development experience
- **Modular Connectors**: For easy integration of new financial systems
- **Shared Types**: For consistency between frontend and backend
- **i18n**: For international users (pt-BR primary, en fallback)

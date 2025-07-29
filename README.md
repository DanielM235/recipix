# Recipix - Financial Receipt Processing PWA

A Progressive Web App (PWA) for capturing, processing, and sending payment receipts to financial management systems via their APIs.

## Features

- 📱 Progressive Web App with offline support
- 🌍 Multilingual support (pt-BR, en)
- 🎨 Dark/Light theme support
- 📸 Image and PDF upload with preview
- 🤖 OCR text extraction
- 🔌 Modular connector system for financial systems
- 🏦 Firefly III integration (default)
- 🔐 OAuth2 authentication
- 🧪 Comprehensive test coverage

## Architecture

```
recipix/
├── frontend/          # React TypeScript PWA
├── backend/           # Node.js Express API
├── shared/            # Shared types and utilities
├── docker/            # Docker configuration
└── docs/              # Documentation
```

## Quick Start

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development:**
   ```bash
   npm run dev
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `FIREFLY_III_URL` - Your Firefly III instance URL
- `FIREFLY_III_TOKEN` - Personal Access Token
- `OCR_API_KEY` - OCR service API key
- `JWT_SECRET` - JWT signing secret

## Deployment

### Docker
```bash
npm run docker:build
npm run docker:run
```

### Platform Deployment
- **Render**: Use `render.yaml`
- **Fly.io**: Use `fly.toml`
- **Vercel**: Use `vercel.json`

## Contributing

1. Follow TypeScript strict mode
2. Write tests for all features
3. Use English for all code and comments
4. Follow the established component patterns

## License

MIT

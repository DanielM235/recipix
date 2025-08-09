# Path Configuration Summary

This document summarizes the standardized path configurations across the Recipix application.

## Environment Variables

### Database Configuration
- **`DATABASE_PATH`**: Path to the SQLite database file
  - Development: `backend/data/recipix.db` (relative to backend directory)
  - Production: `/app/data/recipix.db` (inside Docker container)
  - Tests: Uses `TEST_DATABASE_PATH` (defaults to `:memory:`)

### File Storage Configuration
- **`UPLOAD_DIR`**: Directory for uploaded receipt files
  - Development: `backend/uploads` (relative to backend directory)  
  - Production: `/app/uploads` (inside Docker container)
  - Tests: `backend/uploads` (relative to backend directory)

## Directory Structure

```
recipix/
├── backend/
│   ├── data/           # Database files (development)
│   │   └── recipix.db
│   ├── uploads/        # Uploaded files (development)
│   └── src/
│       ├── database/
│       │   └── knexfile.ts  # Database configuration
│       └── routes/
│           └── receipts.ts  # File upload handling
├── docker-compose.yml       # Production Docker configuration
├── docker-compose.local.yml # Local testing Docker configuration
└── .env files              # Environment configurations
```

## Docker Path Mapping

### Production (`docker-compose.yml`)
- Host `./data/uploads` → Container `/app/uploads`
- Host `./data/logs` → Container `/app/logs`  
- Host `./data/database` → Container `/app/data`

### Local Testing (`docker-compose.local.yml`)
- Named volumes for data persistence
- Uses same container paths as production

## Configuration Files Updated

1. **`backend/src/database/knexfile.ts`**
   - Now uses `DATABASE_PATH` env var for all environments
   - Added `TEST_DATABASE_PATH` for test configuration
   - Safe fallbacks to `backend/data/recipix.db`

2. **`backend/src/routes/receipts.ts`**
   - Upload directory now uses absolute paths
   - Consistent with other path configurations

3. **`backend/src/testEnv.ts`**
   - Added proper path imports
   - Uses absolute paths for test uploads
   - Added `TEST_DATABASE_PATH` configuration

4. **`docker-compose.yml`**
   - Changed `DB_FILE_PATH` → `DATABASE_PATH` for consistency

5. **`.env.example`** and **`.env.production`**
   - Updated to use `DATABASE_PATH` consistently

## Testing

All path configurations have been tested:
- ✅ Development mode uses correct relative paths
- ✅ Docker configurations use correct container paths
- ✅ Tests use safe isolated paths
- ✅ All 46 backend tests passing
- ✅ Environment variable substitution working

## Security Notes

- Test databases use `:memory:` by default (no file persistence)
- Development paths are relative to backend directory
- Production paths are absolute within Docker container
- All paths support environment variable override for flexibility

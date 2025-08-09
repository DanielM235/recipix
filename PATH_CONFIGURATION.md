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

### Logging Configuration
- **`LOG_DIR`**: Directory for application log files
  - Development: `logs` (relative to backend directory)
  - Production: `/app/logs` (inside Docker container)
  - Tests: `logs` (relative to backend directory)
  - Files: `combined.log` (all logs), `error.log` (error level only)

## Directory Structure

```
recipix/
├── backend/
│   ├── data/           # Database files (development)
│   │   └── recipix.db
│   ├── uploads/        # Uploaded files (development)
│   ├── logs/           # Log files (development)
│   │   ├── combined.log
│   │   └── error.log
│   └── src/
│       ├── database/
│       │   └── knexfile.ts  # Database configuration
│       ├── utils/
│       │   └── logger.ts    # Logging configuration
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

5. **`backend/src/utils/logger.ts`**
   - Added `LOG_DIR` environment variable support
   - Enabled file logging for production environments
   - Log files: `combined.log` and `error.log`

6. **`.env.test.custom`** and **`.env.example`**
   - Added `LOG_DIR` configuration for custom logging paths

## Testing

All path configurations have been tested:
- ✅ Development mode uses correct relative paths
- ✅ Docker configurations use correct container paths
- ✅ Tests use safe isolated paths
- ✅ All 46 backend tests passing
- ✅ Environment variable substitution working

### Custom Path Testing Results

**✅ Environment Variable Binding Verified**
- Custom environment files (`.env.test.custom`) correctly loaded by Docker Compose
- Database paths dynamically configured via `DATABASE_PATH` environment variable
- Upload paths dynamically configured via `UPLOAD_DIR` environment variable
- All path changes reflected in container logs and actual file locations

**✅ Volume Mount Testing**
- Host directory `./test-data/custom-database` ↔ Container `/app/data`
- Host directory `./test-data/custom-uploads` ↔ Container `/app/uploads/custom`
- Files created in container appear immediately in host directories
- Database files created with custom names (e.g., `custom-recipix.db`, `totally-different-database.db`)

**✅ Path Isolation Testing**
- Different environment configurations create separate database files
- Upload directories can be completely customized through environment variables
- No cross-contamination between different configurations
- Container restart with new environment variables creates new file structures

**Test Scenarios Completed:**
1. **Default configuration** → `recipix.db` in `backend/data/`
2. **Custom configuration v1** → `custom-recipix.db` in `test-data/custom-database/`
3. **Custom configuration v2** → `totally-different-database.db` in `test-data/different-database/`

All tests confirmed that environment variables are properly passed from `.env` files through Docker Compose to the running container, and that volume mounts correctly bind host paths to container paths.

## Security Notes

- Test databases use `:memory:` by default (no file persistence)
- Development paths are relative to backend directory
- Production paths are absolute within Docker container
- All paths support environment variable override for flexibility

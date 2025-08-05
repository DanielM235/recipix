const path = require('path')

// Use require to load the TypeScript config
require('ts-node/register/transpile-only')

const config = require('./src/database/knexfile.ts').default

module.exports = config

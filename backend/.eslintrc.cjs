module.exports = {
  root: true,
  env: { 
    node: true, 
    es2020: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // General JavaScript/Node.js rules
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': 'off',
    'no-unused-vars': 'off',
    'no-undef': 'off',
    'eqeqeq': 'error',
    'curly': 'error'
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        // TypeScript-specific overrides
      }
    },
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      env: {
        jest: true
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ]
}

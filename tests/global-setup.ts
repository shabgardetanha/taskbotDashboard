import { chromium } from '@playwright/test';

// Environment safety check - prevent tests from running in production
const isProduction = process.env.NODE_ENV === 'production' ||
                    process.env.VERCEL_ENV === 'production' ||
                    process.env.RAILWAY_ENVIRONMENT === 'production';

if (isProduction) {
  console.error('🚫 Global setup: Tests are disabled in production environment!');
  console.error('Tests should only run in development or testing environments.');
  process.exit(1);
}

async function globalSetup() {
  console.log('🚀 Setting up test environment...');

  // You can add global setup logic here
  // For example: database setup, test data creation, etc.

  console.log('✅ Test environment setup complete');
}

export default globalSetup;

async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');

  // You can add global cleanup logic here
  // For example: database cleanup, removing test data, etc.

  console.log('✅ Test environment cleanup complete');
}

export default globalTeardown;

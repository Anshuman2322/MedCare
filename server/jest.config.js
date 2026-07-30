export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  // mongodb-memory-server downloads/boots a real mongod; give it room on slow CI.
  testTimeout: 30000,
};

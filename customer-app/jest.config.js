// Jest is scoped to the pure, framework-free logic (validation, role
// resolution, error mapping) that the login system rests on. Those modules
// import no React Native or Firebase runtime, so they run in a plain Node
// environment without a device or the Expo native layer — fast and
// deterministic in CI. Component/integration tests would add the `jest-expo`
// preset and jsdom; this config deliberately keeps the unit tier lean.
module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/src/auth/__tests__/**/*.test.js',
    '<rootDir>/src/vendor/__tests__/**/*.test.js',
    '<rootDir>/src/shop/__tests__/**/*.test.js',
  ],
  transform: {
    '^.+\\.js$': ['babel-jest', { presets: ['babel-preset-expo'] }],
  },
  clearMocks: true,
};

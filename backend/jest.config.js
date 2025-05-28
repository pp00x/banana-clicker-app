module.exports = {
  preset: '@shelf/jest-mongodb',
  testEnvironment: 'node',
  clearMocks: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.js', '!src/config/**', '!src/models/**'],
  // setupFilesAfterEnv: ['./jest.setup.js'],
};

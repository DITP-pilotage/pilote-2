const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'jest-environment-jsdom',
  modulePathIgnorePatterns: ['<rootDir>/db'],
  testPathIgnorePatterns: ['<rootDir>/db'],
  watchPathIgnorePatterns: ['<rootDir>/db'],
  setupFilesAfterEnv: ['<rootDir>/src/server/infrastructure/test/integrationTestSetup.ts'],
}

module.exports = createJestConfig(customJestConfig)

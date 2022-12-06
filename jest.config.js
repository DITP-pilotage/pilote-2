const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  moduleDirectories: ['node_modules', '<rootDir>/'],
  modulePathIgnorePatterns: ['<rootDir>/db'],
  testPathIgnorePatterns: ['<rootDir>/db'],
  watchPathIgnorePatterns: ['<rootDir>/db'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    "@/server/(.*)": "<rootDir>/src/server/$1",
    "@/client/(.*)":"<rootDir>/src/client/$1",
    "@/fixtures/(.*)":"<rootDir>/src/fixtures/$1",
    "@/components/(.*)": "<rootDir>/src/client/components/$1",
    "@/stores/(.*)": "<rootDir>/src/client/stores/$1",
  }
}

module.exports = createJestConfig(customJestConfig)

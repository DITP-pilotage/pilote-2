const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const globalConf = {
  moduleNameMapper: {
    "d3-(.*)$": `<rootDir>/node_modules/d3-$1/dist/d3-$1.min.js`, // (voir https://github.com/facebook/jest/issues/12036)
    "@/components/(.*)": "<rootDir>/src/client/components/$1",
    "@/client/(.*)": "<rootDir>/src/client/$1",
    "@/hooks/(.*)": "<rootDir>/src/hooks/$1",
    "@/server/(.*)": "<rootDir>/src/server/$1",
    "@/stores/(.*)": "<rootDir>/src/client/stores/$1",
    "@/validation/(.*)": "<rootDir>/src/validation/$1",
  },
};

const nextJSGlobalConfAsync = createJestConfig(globalConf)

module.exports = async () => {
  const nextJSGlobalConf = await nextJSGlobalConfAsync()

  return {
    projects: [
      {
        ...nextJSGlobalConf,
        displayName: 'Node - server integration tests',
        testEnvironment: 'node',
        setupFilesAfterEnv: ['<rootDir>/src/server/infrastructure/test/integrationTestSetup.ts'],
        roots: ['<rootDir>/src/server'],
        testMatch: ['**/*.integration.test.*', '**/__tests__/**/*.integration.test.ts'],
        maxWorkers: 1,
        transform: {
          "\\.yml$": "jest-transform-yaml",
          '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
        },
        transformIgnorePatterns: [
          '/node_modules/',
          '^.+\\.module\\.(css|sass|scss)$',
        ],
      },
      {
        ...nextJSGlobalConf,
        displayName: 'Node - server & scripts unit tests',
        testEnvironment: 'node',
        roots: ['<rootDir>/src/server', '<rootDir>/scripts'],
        testMatch: ['**/*.unit.test.*'],
        transform: {
          "\\.yml$": "jest-transform-yaml",
          '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
        },
        transformIgnorePatterns: [
          '/node_modules/',
          '^.+\\.module\\.(css|sass|scss)$',
        ],
      },
      {
        ...nextJSGlobalConf,
        displayName: 'JsDom - client tests',
        testEnvironment: 'jest-environment-jsdom',
        setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
        testMatch: ['**/*.unit.test.*', '**/*.integration.test.*'],
        roots: ['<rootDir>/src/client'],
      },
    ]
  }
}

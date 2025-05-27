import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  clearMocks: true,
  restoreMocks: true,
  verbose: true,
  errorOnDeprecated: true,
  maxWorkers: '50%',
  bail: process.env.CI ? 1 : false,
  testMatch: ['**/app/lib/**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)'],
  testPathIgnorePatterns: ['<rootDir>/e2e/', '<rootDir>/node_modules/', '<rootDir>/coverage/'],
  collectCoverageFrom: [
    'app/lib/utils/**/*.{js,jsx,ts,tsx}',
    'app/lib/hooks/**/*.{js,jsx,ts,tsx}',
    'app/lib/contexts/**/*.{js,jsx,ts,tsx}',
    '!app/lib/utils/cn.ts',
    '!app/**/*.d.ts',
    '!app/**/__tests__/**',
    '!app/**/*.test.*',
    '!app/**/*.spec.*',
  ],
  coverageThreshold: {
    global: {
      lines: 90,
      branches: 85,
    },
    'app/lib/utils/**': {
      lines: 95,
      branches: 90,
    },
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);

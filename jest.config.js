export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Only run server-side tests with Jest. Frontend tests use Vitest.
  testMatch: ['<rootDir>/server/**/?(*.)+(spec|test).[tj]s?(x)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'server/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!server/**/*.d.ts',
  ],
};

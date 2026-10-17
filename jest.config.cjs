/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'node',
          allowJs: true,
          esModuleInterop: true,
          isolatedModules: true,
        },
      },
    ],
  },
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  collectCoverageFrom: [
    'src/agents/orquestrador/index.ts',
    'src/agents/memoria/index.ts',
    'src/agents/cache/index.ts',
    'src/agents/auditoria/index.ts',
    'src/agents/seguranca/AgenteSeguranca.ts',
  ],
  coverageReporters: ['text', 'lcov', 'text-summary'],
};

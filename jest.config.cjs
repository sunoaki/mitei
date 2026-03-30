/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    extensionsToTreatAsEsm: ['.ts'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
        '^.+\\.m?js$': 'babel-jest',
    },
    transformIgnorePatterns: ['/node_modules/(?!(typebox)/)'],
    moduleNameMapper: {
        '^src/irrd-client/index$': '<rootDir>/src/test-utils/irrd-client.mock.ts',
        '^src/(.*)$': '<rootDir>/src/$1',
        '^uuid$': '<rootDir>/src/test-utils/uuid.mock.ts',
    },
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/index.ts',
        '!src/**/*.d.ts',
        '!src/**/manual.ts',
        '!src/**/example.ts',
        '!src/**/__tests__/**',
    ],
    coverageThreshold: {
        global: {
            branches: 20,
            functions: 30,
            lines: 35,
            statements: 35,
        },
    },
};

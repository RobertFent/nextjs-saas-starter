import nextJest from 'next/jest';

const createJestConfig = nextJest({
	dir: './'
});

const customJestConfig = {
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
	moduleNameMapper: {
		'^@app/(.*)$': '<rootDir>/app/$1',
		'^@lib/(.*)$': '<rootDir>/lib/$1',
		'^@components/(.*)$': '<rootDir>/components/$1'
	},
	moduleDirectories: ['node_modules', '<rootDir>/'],
	testEnvironment: 'jest-environment-jsdom',
	modulePathIgnorePatterns: ['<rootDir>/cypress', '<rootDir>/.next/'],
	collectCoverageFrom: [
		'<rootDir>/app/**/*.{ts,tsx}',
		'<rootDir>/lib/**/*.{ts,tsx}',
		'<rootDir>/components/**/*.{ts,tsx}'
	],
	coverageProvider: 'v8',
	coverageReporters: [
		'text' as const,
		'lcov' as const,
		'json' as const,
		'clover' as const
	]
};

module.exports = createJestConfig(customJestConfig);

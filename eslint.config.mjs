import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import cypress from 'eslint-plugin-cypress';

export default defineConfig([
	// Next.js rules (includes react & react-hooks)
	...nextVitals,

	{
		plugins: {
			'@typescript-eslint': tseslint,
			prettier,
			cypress
		},
		languageOptions: {
			parser: tsParser
		},
		rules: {
			// cy
			'cypress/unsafe-to-chain-command': 'error',
			'cypress/no-unnecessary-waiting': 'error',

			// ts
			'@typescript-eslint/explicit-function-return-type': 'error',
			'@typescript-eslint/indent': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			],

			// prettier
			'prettier/prettier': ['error', { useTabs: true, tabWidth: 4 }],

			// core
			'array-callback-return': 'warn',
			'arrow-body-style': ['error', 'always'],
			curly: 'error',
			eqeqeq: ['error', 'always'],
			indent: 'off',
			'no-case-declarations': 'off',
			'no-console': 'error',
			'no-unused-vars': 'off', // handled by TS rule
			'prefer-arrow-callback': 'error',
			'no-constant-binary-expression': 'off'
		}
	},

	globalIgnores([
		'.next/**',
		'next-env.d.ts',
		'**/node_modules',
		'**/*.js',
		'**/*.d.ts'
	])
]);

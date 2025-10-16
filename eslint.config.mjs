import { defineConfig, globalIgnores } from 'eslint/config';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import pluginNext from '@next/eslint-plugin-next';
import prettier from 'eslint-plugin-prettier';
import pluginCypress from 'eslint-plugin-cypress';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all
});

export default defineConfig([
	globalIgnores([
		'**/node_modules',
		'**/.next',
		'**/*.js',
		'**/next-env.d.ts'
	]),
	{
		extends: compat.extends(
			'next',
			'eslint:recommended',
			'plugin:prettier/recommended',
			'plugin:@typescript-eslint/eslint-recommended',
			'plugin:@typescript-eslint/strict',
			'plugin:@typescript-eslint/stylistic',
			'prettier',
			'plugin:@next/next/recommended'
		),

		plugins: {
			'@typescript-eslint': typescriptEslint,
			'@next/next': pluginNext,
			prettier,
			cypress: pluginCypress
		},

		languageOptions: {
			parser: tsParser
		},

		rules: {
			'cypress/unsafe-to-chain-command': 'error',
			'cypress/no-unnecessary-waiting': 'error',
			'@typescript-eslint/explicit-function-return-type': 'error',
			'@typescript-eslint/indent': 'off',
			'array-callback-return': 'warn',
			'arrow-body-style': ['error', 'always'],
			curly: 'error',
			eqeqeq: ['error', 'always'],
			indent: 'off',
			'no-case-declarations': 'off',
			// 'no-console': 'error',
			'no-unused-vars': 'off',
			'prefer-arrow-callback': 'error',
			'no-constant-binary-expression': 'off',
			'prettier/prettier': [
				'error',
				{
					useTabs: true,
					tabWidth: 4
				}
			],
			'@typescript-eslint/no-non-null-assertion': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			],
			...pluginNext.configs.recommended.rules
		}
	}
]);

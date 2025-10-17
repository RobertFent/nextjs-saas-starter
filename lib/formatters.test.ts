import { formatError } from './formatters';

describe('formatError', () => {
	it('should return the error message if error is an Error instance', () => {
		const err = new Error('Something went wrong');
		expect(formatError(err)).toBe('Something went wrong');
	});

	it('should convert a string to itself', () => {
		expect(formatError('A string error')).toBe('A string error');
	});

	it('should convert a number to a string', () => {
		expect(formatError(404)).toBe('404');
	});

	it('should convert null to "null"', () => {
		expect(formatError(null)).toBe('null');
	});

	it('should convert undefined to "undefined"', () => {
		expect(formatError(undefined)).toBe('undefined');
	});

	it('should convert an object to "[object Object]"', () => {
		expect(formatError({ foo: 'bar' })).toBe('{"foo":"bar"}');
	});

	it('should convert an array to its string representation', () => {
		expect(formatError([1, 2, 3])).toBe('[1,2,3]');
	});
});

// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'; // this statement imports proper types for tests -> some functions would fail if not imported

const OLD_ENV = process.env;

beforeAll(() => {
	jest.resetModules(); // also clears cache
	jest.useFakeTimers().setSystemTime(new Date('2025-01-01T00:00:00Z'));
});

beforeEach(() => {
	jest.clearAllMocks(); // clears mock history so that .toHaveBeenCalledTimes etc. are independent between tests
});

afterAll(() => {
	process.env = OLD_ENV; // restore process.env to original state
	jest.useRealTimers();
});

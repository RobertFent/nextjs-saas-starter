export const formatError = (error: unknown): string => {
	return error instanceof Error
		? error.message
		: error instanceof Object
			? JSON.stringify(error)
			: String(error);
};

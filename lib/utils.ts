import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatError } from './formatters';

/**
 * Returns single, cleaned-up Tailwind class string usable in JSX components
 * Example:
 * 			cn("p-2 text-sm", { "bg-red-500": true, "bg-blue-500": false }, "p-4 text-lg")
 * 			clsx() → "p-2 text-sm bg-red-500 p-4 text-lg"
 * 			twMerge() → "p-4 text-lg bg-red-500"
 * 			Final output: "p-4 text-lg bg-red-500"
 */
export const cn = (...inputs: ClassValue[]): string => {
	return twMerge(clsx(inputs));
};

/**
 * Fetches and parses JSON, blob or text from the given URL asynchronously with proper error handling.
 * This fetcher is used as a callback function for the useSWR hook
 */
export const fetcher = async <T>(url: string): Promise<T> => {
	try {
		const res = await fetch(url);

		// default should be json but also accept blob or text in any case
		const contentType = res.headers.get('content-type');
		const data = contentType?.includes('application/json')
			? await res.json()
			: contentType?.includes(
						'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
				  )
				? await res.blob()
				: await res.text();

		if (!res.ok) {
			throw new Error(
				typeof data === 'string' ? data : data?.error || res.status
			);
		}
		return data as T;
	} catch (error) {
		throw new Error(`Fetch failed: ${formatError(error)}`);
	}
};

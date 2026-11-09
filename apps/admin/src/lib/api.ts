import type { z } from 'zod';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
	constructor(
		readonly status: number,
		message: string,
	) {
		super(message);
	}
}

export async function apiGet<T extends z.ZodType>(
	path: string,
	schema: T,
	init?: RequestInit,
): Promise<z.output<T>> {
	const res = await fetch(`${API_URL}${path}`, {
		credentials: 'include',
		...init,
	});
	if (!res.ok) {
		throw new ApiError(res.status, `GET ${path} ${res.status}`);
	}
	return schema.parse(await res.json());
}

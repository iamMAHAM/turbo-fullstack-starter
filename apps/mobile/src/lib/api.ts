import type { z } from 'zod';
import { authClient } from './auth-client';
import { API_URL } from './config';

export async function apiGet<T extends z.ZodType>(
	path: string,
	schema: T,
	init?: RequestInit,
): Promise<z.output<T>> {
	const headers = new Headers(init?.headers);
	const cookie = await authClient.getCookie();
	if (cookie) headers.set('Cookie', cookie);

	// Native fetch has no cookie jar: the session cookie is sent by hand.
	const res = await fetch(`${API_URL}${path}`, {
		...init,
		headers,
		credentials: 'omit',
	});
	if (!res.ok) {
		throw new Error(`GET ${path} failed (${res.status})`);
	}
	return schema.parse(await res.json());
}

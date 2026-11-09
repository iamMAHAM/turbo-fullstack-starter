'use client';

import type { User } from '@app/schemas';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApiError } from '../lib/api';
import { authClient } from '../lib/auth-client';
import { getMe } from '../lib/users';

export default function HomePage() {
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		getMe()
			.then(setUser)
			.catch((error: unknown) => {
				if (error instanceof ApiError && error.status === 401) {
					router.replace('/login');
				}
			});
	}, [router]);

	const signOut = async () => {
		await authClient.signOut();
		router.replace('/login');
	};

	if (!user) return null;

	return (
		<main>
			<h1>Admin</h1>
			<p>Signed in as {user.email}</p>
			<button type="button" onClick={signOut}>
				Sign out
			</button>
		</main>
	);
}

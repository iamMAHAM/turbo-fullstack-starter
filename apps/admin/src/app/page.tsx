'use client';

import type { User } from '@app/schemas';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../lib/api';
import { authClient } from '../lib/auth-client';
import { getMe } from '../lib/users';

export default function HomePage() {
	const { t } = useTranslation();
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
			<h1>{t('admin.title')}</h1>
			<p>{t('auth.signedInAs', { email: user.email })}</p>
			<button type="button" onClick={signOut}>
				{t('auth.signOut')}
			</button>
		</main>
	);
}

'use client';

import { signInSchema } from '@app/schemas';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authClient } from '../../lib/auth-client';

export default function LoginPage() {
	const { t } = useTranslation();
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		const parsed = signInSchema.safeParse({
			email: form.get('email'),
			password: form.get('password'),
		});
		if (!parsed.success) {
			setError(t('errors.invalidForm'));
			return;
		}

		setPending(true);
		const { error } = await authClient.signIn.email(parsed.data);
		setPending(false);
		if (error) {
			setError(
				error.status && error.message ? error.message : t('errors.network'),
			);
			return;
		}
		router.replace('/');
	};

	return (
		<main>
			<h1>{t('auth.signIn.title')}</h1>
			<form onSubmit={onSubmit}>
				<label>
					{t('auth.email')}
					<input name="email" type="email" autoComplete="email" required />
				</label>
				<label>
					{t('auth.password')}
					<input
						name="password"
						type="password"
						autoComplete="current-password"
						required
					/>
				</label>
				{error && <p role="alert">{error}</p>}
				<button type="submit" disabled={pending}>
					{t('auth.signIn.submit')}
				</button>
			</form>
		</main>
	);
}

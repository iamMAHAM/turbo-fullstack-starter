'use client';

import { signInSchema } from '@app/schemas';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { authClient } from '../../lib/auth-client';

export default function LoginPage() {
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
			setError('Invalid email or password.');
			return;
		}

		setPending(true);
		const { error } = await authClient.signIn.email(parsed.data);
		setPending(false);
		if (error) {
			setError(error.message ?? 'Sign-in failed.');
			return;
		}
		router.replace('/');
	};

	return (
		<main>
			<h1>Sign in</h1>
			<form onSubmit={onSubmit}>
				<label>
					Email
					<input name="email" type="email" autoComplete="email" required />
				</label>
				<label>
					Password
					<input
						name="password"
						type="password"
						autoComplete="current-password"
						required
					/>
				</label>
				{error && <p role="alert">{error}</p>}
				<button type="submit" disabled={pending}>
					Sign in
				</button>
			</form>
		</main>
	);
}

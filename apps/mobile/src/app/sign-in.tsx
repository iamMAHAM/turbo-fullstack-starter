import { signInSchema } from '@app/schemas';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { authClient } from '../lib/auth-client';

export default function SignInScreen() {
	const { t } = useTranslation();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	const onSubmit = async () => {
		const parsed = signInSchema.safeParse({ email, password });
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
		<View style={styles.container}>
			<Text style={styles.title}>{t('auth.signIn.title')}</Text>
			<TextInput
				style={styles.input}
				placeholder={t('auth.email')}
				autoCapitalize="none"
				autoComplete="email"
				keyboardType="email-address"
				value={email}
				onChangeText={setEmail}
			/>
			<TextInput
				style={styles.input}
				placeholder={t('auth.password')}
				autoComplete="current-password"
				secureTextEntry
				value={password}
				onChangeText={setPassword}
			/>
			{error && <Text style={styles.error}>{error}</Text>}
			<Button
				title={t('auth.signIn.submit')}
				onPress={onSubmit}
				disabled={pending}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		gap: 12,
		padding: 24,
	},
	title: {
		fontSize: 24,
		fontWeight: '700',
	},
	input: {
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 8,
		padding: 12,
	},
	error: {
		color: '#b00020',
	},
});

import { signInSchema } from '@app/schemas';
import { router } from 'expo-router';
import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { authClient } from '../lib/auth-client';

export default function SignInScreen() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	const onSubmit = async () => {
		const parsed = signInSchema.safeParse({ email, password });
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
		<View style={styles.container}>
			<Text style={styles.title}>Sign in</Text>
			<TextInput
				style={styles.input}
				placeholder="Email"
				autoCapitalize="none"
				autoComplete="email"
				keyboardType="email-address"
				value={email}
				onChangeText={setEmail}
			/>
			<TextInput
				style={styles.input}
				placeholder="Password"
				autoComplete="current-password"
				secureTextEntry
				value={password}
				onChangeText={setPassword}
			/>
			{error && <Text style={styles.error}>{error}</Text>}
			<Button title="Sign in" onPress={onSubmit} disabled={pending} />
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

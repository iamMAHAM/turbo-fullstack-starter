import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
	ActivityIndicator,
	Button,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import { authClient } from '../lib/auth-client';

export default function HomeScreen() {
	const { t } = useTranslation();
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return (
			<View style={styles.container}>
				<ActivityIndicator />
			</View>
		);
	}
	if (!session) return <Redirect href="/sign-in" />;

	return (
		<View style={styles.container}>
			<Text style={styles.title}>
				{t('home.greeting', { name: session.user.name })}
			</Text>
			<Button title={t('auth.signOut')} onPress={() => authClient.signOut()} />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 16,
		padding: 24,
	},
	title: {
		fontSize: 24,
		fontWeight: '700',
	},
});

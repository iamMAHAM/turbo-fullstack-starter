import { createI18n } from '@app/i18n';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getLocale } from '../lib/locale';
import { Providers } from './providers';

export async function generateMetadata(): Promise<Metadata> {
	const { t } = createI18n(await getLocale());
	return { title: t('admin.title') };
}

export default async function RootLayout({
	children,
}: {
	children: ReactNode;
}) {
	const locale = await getLocale();
	return (
		<html lang={locale}>
			<body>
				<Providers locale={locale}>{children}</Providers>
			</body>
		</html>
	);
}

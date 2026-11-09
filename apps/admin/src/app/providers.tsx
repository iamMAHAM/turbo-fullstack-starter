'use client';

import { createI18n, type Locale } from '@app/i18n';
import { type ReactNode, useState } from 'react';
import { I18nextProvider } from 'react-i18next';

export function Providers({
	locale,
	children,
}: {
	locale: Locale;
	children: ReactNode;
}) {
	const [i18n] = useState(() => createI18n(locale));
	return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

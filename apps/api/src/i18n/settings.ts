import { type Locale, SUPPORTED_LOCALES } from '@app/schemas';

export type { Locale };
export { SUPPORTED_LOCALES };

export const DEFAULT_LOCALE: Locale = 'en';
export const FALLBACK_LOCALE: Locale = 'en';
export const LOCALE_HEADER = 'x-locale';

export const NAMESPACES = ['api', 'errors', 'auth', 'users'] as const;
export type Namespace = (typeof NAMESPACES)[number];
export const DEFAULT_NAMESPACE: Namespace = 'errors';

export const isSupportedLocale = (value: unknown): value is Locale =>
	typeof value === 'string' &&
	(SUPPORTED_LOCALES as readonly string[]).includes(value);

export const resolveLocale = (
	explicit: string | null | undefined,
	acceptLanguage: string | null | undefined,
): Locale => {
	if (isSupportedLocale(explicit)) return explicit;
	const preferred = (acceptLanguage ?? '')
		.split(',')
		.map((entry) => entry.trim().split(';')[0]?.toLowerCase().split('-')[0])
		.find(isSupportedLocale);
	return preferred ?? DEFAULT_LOCALE;
};

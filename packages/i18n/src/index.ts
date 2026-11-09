import { type Locale, SUPPORTED_LOCALES } from '@app/schemas';
import i18next, { type i18n } from 'i18next';
import { en, type Translations } from './locales/en.js';
import { fr } from './locales/fr.js';

export type { Locale, Translations };

export const DEFAULT_LOCALE: Locale = 'en';

export const resources = {
	en: { translation: en },
	fr: { translation: fr },
} as const;

const isLocale = (value: string | undefined): value is Locale =>
	(SUPPORTED_LOCALES as readonly string[]).includes(value ?? '');

export const resolveLocale = (
	tags: readonly (string | null | undefined)[],
): Locale =>
	tags.map((tag) => tag?.toLowerCase().split(/[-_]/)[0]).find(isLocale) ??
	DEFAULT_LOCALE;

export const parseAcceptLanguage = (header: string | null | undefined) =>
	(header ?? '').split(',').map((entry) => entry.trim().split(';')[0]);

export const createI18n = (locale: Locale): i18n => {
	const instance = i18next.createInstance();
	instance.init({
		lng: locale,
		fallbackLng: DEFAULT_LOCALE,
		resources,
		initAsync: false,
		interpolation: { escapeValue: false },
	});
	return instance;
};

declare module 'i18next' {
	interface CustomTypeOptions {
		resources: { translation: Translations };
	}
}

import { createI18n, resolveLocale } from '@app/i18n';
import { getLocales } from 'expo-localization';

export const locale = resolveLocale(getLocales().map((l) => l.languageTag));
export const i18n = createI18n(locale);

import { describe, expect, it } from 'vitest';
import { createI18n, parseAcceptLanguage, resolveLocale } from './index.js';

describe('resolveLocale', () => {
	it('picks the first supported language', () => {
		expect(resolveLocale(parseAcceptLanguage('de-DE,fr-FR;q=0.8'))).toBe('fr');
	});

	it('falls back to English', () => {
		expect(resolveLocale(['de', undefined])).toBe('en');
	});
});

describe('createI18n', () => {
	it('translates synchronously with interpolation', () => {
		const i18n = createI18n('fr');
		expect(i18n.t('auth.signedInAs', { email: 'a@b.c' })).toBe(
			'Connecté en tant que a@b.c',
		);
	});
});

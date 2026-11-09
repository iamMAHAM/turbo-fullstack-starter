import { parseAcceptLanguage, resolveLocale } from '@app/i18n';
import { headers } from 'next/headers';

export const getLocale = async () =>
	resolveLocale(parseAcceptLanguage((await headers()).get('accept-language')));

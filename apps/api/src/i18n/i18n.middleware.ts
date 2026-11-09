import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { localeContext } from './locale-context.js';
import { LOCALE_HEADER, resolveLocale } from './settings.js';

@Injectable()
export class I18nMiddleware implements NestMiddleware {
	use(req: Request, _res: Response, next: NextFunction) {
		const locale = resolveLocale(
			req.header(LOCALE_HEADER),
			req.header('accept-language'),
		);
		localeContext.run({ locale }, () => next());
	}
}

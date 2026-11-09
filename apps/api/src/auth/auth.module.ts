import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import type { AppConfigService } from '../env.js';
import { I18nService } from '../i18n/i18n.service.js';
import { createAuth } from './auth.config.js';

/**
 * Mounts Better Auth's handler under `/api/auth/*` and exposes `AuthGuard`,
 * `@Session()`, `@Public()` and friends to the rest of the app.
 */
@Module({
	imports: [
		BetterAuthModule.forRootAsync({
			inject: [ConfigService, I18nService],
			useFactory: (config: AppConfigService, i18n: I18nService) => ({
				auth: createAuth(
					{
						NODE_ENV: config.get('NODE_ENV', { infer: true }),
						DATABASE_URL: config.get('DATABASE_URL', { infer: true }),
						BETTER_AUTH_SECRET: config.get('BETTER_AUTH_SECRET', {
							infer: true,
						}),
						BETTER_AUTH_URL: config.get('BETTER_AUTH_URL', { infer: true }),
						BETTER_AUTH_TRUSTED_ORIGINS: config.get(
							'BETTER_AUTH_TRUSTED_ORIGINS',
							{ infer: true },
						),
						AUTH_COOKIE_SAME_SITE: config.get('AUTH_COOKIE_SAME_SITE', {
							infer: true,
						}),
					},
					(locale, code) => i18n.tLooseFor(locale, code),
				),
				// CORS is configured once, from CORS_ORIGINS, in `configureApp`.
				disableTrustedOriginsCors: true,
			}),
		}),
	],
	exports: [BetterAuthModule],
})
export class AuthModule {}

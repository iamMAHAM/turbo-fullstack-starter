import { E, type ErrorCode, isHttpsUrl } from '@app/schemas';
import { expo } from '@better-auth/expo';
import { PrismaPg } from '@prisma/adapter-pg';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError, createAuthMiddleware, isAPIError } from 'better-auth/api';
import { CLIENT_IP_HEADER } from '../common/http/client-ip.js';
import type { Env } from '../env.js';
import { PrismaClient } from '../generated/prisma/client.js';
import { LOCALE_HEADER, type Locale, resolveLocale } from '../i18n/settings.js';

// Better Auth's sign-up and update-user routes accept any string as `image`.
const assertHttpsImage = async (user: { image?: unknown }) => {
	if (user.image != null && !isHttpsUrl(user.image)) {
		throw new APIError('BAD_REQUEST', { code: E.IMAGE_URL_INVALID });
	}
};

const BETTER_AUTH_CODES: Record<string, ErrorCode> = {
	INVALID_EMAIL_OR_PASSWORD: E.INVALID_CREDENTIALS,
	INVALID_PASSWORD: E.INVALID_CREDENTIALS,
	CREDENTIAL_ACCOUNT_NOT_FOUND: E.INVALID_CREDENTIALS,
	USER_ALREADY_EXISTS: E.EMAIL_TAKEN,
	USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: E.EMAIL_TAKEN,
	INVALID_EMAIL: E.EMAIL_INVALID,
	PASSWORD_TOO_SHORT: E.PASSWORD_TOO_SHORT,
	PASSWORD_TOO_LONG: E.PASSWORD_TOO_LONG,
	SESSION_EXPIRED: E.SESSION_EXPIRED,
	VALIDATION_ERROR: E.VALIDATION_FAILED,
	MISSING_FIELD: E.VALIDATION_FAILED,
	INVALID_ORIGIN: E.FORBIDDEN,
	MISSING_OR_NULL_ORIGIN: E.FORBIDDEN,
};

const toErrorCode = (code: unknown): ErrorCode => {
	if (typeof code !== 'string') return E.AUTH_FAILED;
	if ((Object.values(E) as string[]).includes(code)) return code as ErrorCode;
	return BETTER_AUTH_CODES[code] ?? E.AUTH_FAILED;
};

export type TranslateError = (locale: Locale, code: ErrorCode) => string;

/** Only the slice of the environment Better Auth actually needs. */
export type AuthEnv = Pick<
	Env,
	| 'NODE_ENV'
	| 'DATABASE_URL'
	| 'BETTER_AUTH_SECRET'
	| 'BETTER_AUTH_URL'
	| 'BETTER_AUTH_TRUSTED_ORIGINS'
	| 'AUTH_COOKIE_SAME_SITE'
>;

/**
 * Better Auth needs its own Prisma client: the instance is built before Nest's
 * lifecycle hooks run, so it cannot reuse the connection `PrismaService` opens.
 */
export const createAuth = (env: AuthEnv, translate?: TranslateError) => {
	const prisma = new PrismaClient({
		adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
	});
	const isProduction = env.NODE_ENV === 'production';
	const devOrigins =
		env.NODE_ENV === 'development' ? ['exp://', 'exp://**'] : [];

	return betterAuth({
		baseURL: env.BETTER_AUTH_URL,
		secret: env.BETTER_AUTH_SECRET,
		trustedOrigins: [...env.BETTER_AUTH_TRUSTED_ORIGINS, ...devOrigins],
		plugins: [expo()],
		database: prismaAdapter(prisma, { provider: 'postgresql' }),
		emailAndPassword: {
			enabled: true,
			minPasswordLength: 8,
			maxPasswordLength: 128,
		},
		session: {
			expiresIn: 60 * 60 * 24 * 7, // 7 days
			updateAge: 60 * 60 * 24, // refresh the cookie once a day
		},
		hooks: {
			after: createAuthMiddleware(async (ctx) => {
				const error = ctx.context.returned;
				if (!translate || !isAPIError(error)) return;
				const code = toErrorCode(error.body?.code);
				const locale = resolveLocale(
					ctx.headers?.get(LOCALE_HEADER),
					ctx.headers?.get('accept-language'),
				);
				throw new APIError(
					error.status,
					{ code, message: translate(locale, code) },
					error.headers,
					error.statusCode,
				);
			}),
		},
		databaseHooks: {
			user: {
				create: { before: assertHttpsImage },
				update: { before: assertHttpsImage },
			},
		},
		advanced: {
			defaultCookieAttributes: {
				httpOnly: true,
				sameSite: env.AUTH_COOKIE_SAME_SITE,
				secure: isProduction || env.AUTH_COOKIE_SAME_SITE === 'none',
			},
			ipAddress: { ipAddressHeaders: [CLIENT_IP_HEADER] },
		},
	});
};

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth['$Infer']['Session'];
export type AuthUser = Session['user'];

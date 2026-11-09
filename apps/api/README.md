# @app/api

REST API serving the back-office (`apps/admin`) and the mobile app
(`apps/mobile`). Commands on this page run from `apps/api` unless stated
otherwise.

## Stack

| Area          | Choice                                                   |
| ------------- | -------------------------------------------------------- |
| Runtime       | Node 24 or later, native ESM, NestJS 12                  |
| Database      | PostgreSQL 18, Prisma 7 (`@prisma/adapter-pg`)           |
| Auth          | Better Auth, `@thallesp/nestjs-better-auth`, Expo plugin |
| Validation    | Zod 4 (`@app/schemas`), NestJS Standard Schema support   |
| Configuration | `@nestjs/config`, Zod-validated at boot                  |
| i18n          | i18next, English by default, French available            |
| API docs      | Swagger, generated from the Zod schemas                  |
| Logging       | Pino (`nestjs-pino`), correlated by `x-request-id`       |
| Tests         | Vitest (unit and e2e)                                    |
| Security      | Helmet, CORS, `@nestjs/throttler`, proxy-aware client IP |

## Getting started

From the repository root, after `bun install`:

```bash
cp apps/api/.env.example apps/api/.env
openssl rand -base64 32          # value for BETTER_AUTH_SECRET
docker compose up -d             # PostgreSQL 18
cd apps/api
bun run db:migrate
bun run dev                      # http://localhost:4000, Swagger on /docs
```

## Scripts

| Script                                                                       | Purpose                                              |
| ---------------------------------------------------------------------------- | ---------------------------------------------------- |
| `bun run dev`                                                                | Watch mode (tsc)                                     |
| `bun run build` / `start`                                                    | Build, then run `dist/main.js`                       |
| `bun run check-types`                                                        | `tsc --noEmit`                                       |
| `bun run test` / `test:e2e` / `test:cov`                                     | Vitest                                               |
| `bun run db:generate` / `db:push` / `db:migrate` / `db:deploy` / `db:studio` | Prisma                                               |
| `bun run auth:generate`                                                      | Regenerate the Better Auth models in `schema.prisma` |
| `bun run i18n:gen-types`                                                     | Regenerate the translation types                     |
| `bun run i18n:check`                                                         | Check key parity across locales                      |

The e2e tests need PostgreSQL and the variables from `.env`.

## Layout

```
.
├── prisma/
│   ├── schema.prisma          models (Better Auth and your own)
│   └── migrations/            versioned migrations
├── prisma.config.ts           Prisma CLI configuration
├── src/
│   ├── main.ts                bootstrap: logger, Swagger, listen
│   ├── app.setup.ts           proxy, Helmet, CORS, prefix
│   ├── app.module.ts          config, global pipe, guard and filters
│   ├── env.ts                 Zod schema of the environment
│   ├── auth/                  Better Auth configuration and Nest module
│   ├── prisma/                PrismaService (global)
│   ├── i18n/                  service, middleware, en/fr translations
│   ├── common/                errors, filters, HTTP helpers, validation pipe
│   ├── modules/
│   │   ├── health/            liveness and database probe
│   │   └── users/             reference module
│   └── generated/prisma/      Prisma client (gitignored)
├── test/                      e2e tests
└── Dockerfile                 API image and migration target
```

Unit tests sit next to the code (`*.spec.ts`); only e2e tests live in
`test/`. A new module follows `src/modules/users`: schemas in
`@app/schemas`, then service, controller and tests.

## Conventions

**Errors.** Throw a `BusinessError` with a `namespace:CODE` code (the `E`
catalogue in `@app/schemas`, shared with the clients). The code doubles as
the translation key. Clients always get the same envelope and can branch on
`code`:

```json
{
	"statusCode": 404,
	"code": "users:USER_NOT_FOUND",
	"message": "No user found with id nope."
}
```

**Locale.** Resolved from the `x-locale` header, then `Accept-Language`,
then English. Zod's built-in validation messages are translated into the
same locale. Change `DEFAULT_LOCALE` in `src/i18n/settings.ts` for another
default.

**Validation.** Request and response schemas live in `packages/schemas`,
never in the API. Pass the schema to the decorator: `@Body({ schema })`,
`@Query({ schema })`, `@Param('id', { schema })`, and type the parameter
with `z.output<typeof schema>`. Responses go through
`@SchemaResponse(schema)`, which strips undeclared fields and documents the
response in Swagger.

**Translations.** Edit `src/i18n/locales/<locale>/<namespace>.json`, then
run `bun run i18n:gen-types`. The pre-commit hook rejects a commit where the
locales have drifted apart.

**Auth.** A global guard protects every route. `@Public()` opens a route,
`@Session()` reads the session. Better Auth serves `/api/auth/*`, outside the
`/v1` prefix, like `/health`. A user's email is only returned by
`/v1/users/me`. Email verification is not enabled: wire a mailer and set
`requireEmailVerification` before opening sign-up in production.

**Mobile clients.** The `expo()` Better Auth plugin accepts requests from the
app scheme listed in `BETTER_AUTH_TRUSTED_ORIGINS` (`app://`). With
`NODE_ENV=development`, `exp://` origins are trusted too, for Expo Go.

**Configuration.** A missing or invalid variable stops the boot and is named
in the error. Type `ConfigService` with `AppConfigService` to get the parsed
values (`PORT` as a number, `CORS_ORIGINS` as an array). Only
`src/auth/auth.cli.ts`, used by the Better Auth CLI, reads the environment
outside Nest.

**Proxy.** Behind a reverse proxy, set `TRUST_PROXY` (hop count or IPs/CIDRs)
so `req.ip` is the real client. It feeds both Nest's rate limiter and Better
Auth's. Leave it `false` when the API is exposed directly.

**Cookies.** `AUTH_COOKIE_SAME_SITE=lax` suits a client on the same site
(`admin.example.com` and `api.example.com`). Use `none` only for a client on
another site; it requires HTTPS.

## Pitfalls

- **No `import type` for an injected service.** NestJS injection relies on
  the metadata emitted by `emitDecoratorMetadata`, which needs a value
  import. Biome's `useImportType` rule is turned off for that reason.
- **No `tsx` to run the app.** `tsx` does not emit decorator metadata: the
  app boots but injected dependencies are `undefined`. `bun run dev` uses
  `nest start` (tsc), and Vitest uses `unplugin-swc`.
- **Native ESM.** Relative imports carry the `.js` extension, even from a
  `.ts` file. No path aliases.

## Docker

`docker-compose.yml`, at the repository root, provides PostgreSQL for
development, bound to localhost. The `Dockerfile` builds the API with Bun and
runs it on `node:26-alpine` as a non-root user, with a `HEALTHCHECK` on
`/health`. The build context is the repository root, so that `@app/schemas`
is included:

```bash
docker build -f apps/api/Dockerfile -t app-api .
docker build -f apps/api/Dockerfile --target migrate -t app-migrate .
docker run --rm -e DATABASE_URL=… app-migrate
```

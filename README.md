# turbo-fullstack-starter

Turborepo template for a product with a REST API, a back-office and a mobile
app, sharing their contracts through Zod schemas. Sign-in works end to end out
of the box: the back-office and the mobile app both authenticate against the
API with Better Auth.

| Path               | Package        | Role                                          |
| ------------------ | -------------- | --------------------------------------------- |
| `apps/api`         | `@app/api`     | REST API (NestJS 12, Prisma 7, PostgreSQL 18) |
| `apps/admin`       | `@app/admin`   | Back-office (Next.js 16)                      |
| `apps/mobile`      | `@app/mobile`  | Mobile app (Expo SDK 58, React Native)        |
| `packages/schemas` | `@app/schemas` | Zod schemas and types shared by all three     |
| `packages/i18n`    | `@app/i18n`    | Back-office and mobile app translations       |

`apps/api` follows the
[`nestjs-api-starter`](https://github.com/iamMAHAM/nestjs-api-starter)
template; changes to the API itself land there first.

## Getting started

Requirements: Node 24 or later, Bun 1.4, Docker. For the mobile app: Expo Go
on a phone, or an Android emulator.

```bash
bun install
cp apps/api/.env.example apps/api/.env
cp apps/admin/.env.example apps/admin/.env.local
cp apps/mobile/.env.example apps/mobile/.env
openssl rand -base64 32              # value for BETTER_AUTH_SECRET
docker compose up -d                 # PostgreSQL 18
bun run --cwd apps/api db:migrate
bun run dev                          # API, back-office and Metro in parallel
```

| Service     | Address                    |
| ----------- | -------------------------- |
| API         | http://localhost:4000      |
| Swagger     | http://localhost:4000/docs |
| Back-office | http://localhost:3000      |
| Mobile      | QR code printed by Expo    |

To run a single app: `bunx turbo run dev --filter=@app/api`.

On a physical phone, `localhost` is the phone itself: set
`EXPO_PUBLIC_API_URL` in `apps/mobile/.env` to the machine's LAN address
(`http://192.168.x.x:4000`).

## Starting a new project

1. Create a repository from this template.
2. Replace the `@app/` scope with your own across the repository (package
   names and imports).
3. In `apps/mobile/app.json`, set `name`, `slug` and `scheme`. Use the same
   scheme in `apps/mobile/src/lib/auth-client.ts` and in
   `BETTER_AUTH_TRUSTED_ORIGINS` (`myapp://`).
4. Rename the database in `docker-compose.yml` and `DATABASE_URL`.
5. Set the Swagger title in `apps/api/src/main.ts`.
6. Pick the default locale: `DEFAULT_LOCALE` in `apps/api/src/i18n/settings.ts`
   and in `packages/i18n/src/index.ts`.

## Commands

| Command               | Effect                                        |
| --------------------- | --------------------------------------------- |
| `bun run dev`         | Every app in development mode                 |
| `bun run build`       | Builds `schemas`, the API and the back-office |
| `bun run check`       | Lint and format (Biome) across the repo       |
| `bun run check:fix`   | Applies Biome fixes                           |
| `bun run check-types` | TypeScript check of every package             |
| `bun run test`        | Unit tests                                    |
| `bun run test:e2e`    | API e2e tests (needs PostgreSQL)              |

Turborepo builds `@app/schemas` before the apps that depend on it and caches
the results.

## Shared schemas

`@app/schemas` is the single source for API contracts: request bodies,
responses, enums, error codes. The API validates with these schemas; the
back-office and the mobile app reuse them for forms and to parse responses.

```ts
import { type User, userSchema } from '@app/schemas';
```

The package holds Zod and types only. Nothing that depends on Prisma, NestJS
or the server: it is bundled into the mobile app. It is compiled to `dist/`;
after a change, `bun run build` or `bun run dev` rebuilds it.

Zod and React exist in a single version across the repo. The React version is
the one pinned by the Expo SDK; the back-office follows it.

## Translations

No user-facing text is hardcoded, in the apps or in API responses. English is
the default locale, French is available.

- **Back-office and mobile.** Texts live in `packages/i18n/src/locales`
  (`en.ts`, `fr.ts`) and are rendered with `useTranslation()` from
  `react-i18next`. The type of `fr.ts` derives from `en.ts`, so a missing key
  fails the type check.
- **API.** Messages live in `apps/api/src/i18n/locales`. Every error carries a
  code (`auth:INVALID_CREDENTIALS`) and a translated message, Better Auth
  errors included.
- **Locale.** The back-office follows the browser language, the mobile app
  the device language and sends it to the API in the `x-locale` header.

## Authentication

Better Auth runs inside the API and serves `/api/auth/*`.

- **Back-office.** The session is a cookie set by the API. It works as long
  as the back-office and the API share a site (`localhost`, or
  `admin.example.com` and `api.example.com`). See `AUTH_COOKIE_SAME_SITE` in
  the API README for other setups.
- **Mobile.** React Native has no cookie jar. The `@better-auth/expo` client
  stores the session in `expo-secure-store`, and `apiGet` sends it in the
  `Cookie` header. The API trusts the app scheme listed in
  `BETTER_AUTH_TRUSTED_ORIGINS`, and `exp://` origins in development for
  Expo Go.

## Quality

- Biome for lint and format, configured at the root.
- Lefthook: Biome and type check on commit, tests on push.
- GitHub Actions CI: lint, types, unit tests, builds, dependency audit, e2e
  tests on PostgreSQL, build and boot of the API Docker image.
- Dependabot: weekly updates. Packages managed by the Expo SDK are excluded
  and updated with `bunx expo install --fix`.

## Per-app documentation

- [API](apps/api/README.md): conventions, configuration, Docker.

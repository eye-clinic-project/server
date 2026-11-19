# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Read `AGENTS.md` too: it covers the NestJS 12 specifics (first-party `@nestjs/*` packages to prefer over third-party libraries, ESM rules, Standard Schema validation, NestJS Observe). One correction to it: this project's source root is `source/`, not `src/`, so the app module is `source/app.module.ts`.

## Project

RetinaCare backend: a NestJS 12 API for diabetic-retinopathy (DR) screening. Admins, doctors and patients use it to upload fundus images, run AI analysis on them (an external AI service configured through `AI_*` env vars), have doctors review the results and write reports, book appointments, chat and get notifications. The full domain model is already defined as TypeScript interfaces in `source/dependencies/interface/database.interface.ts`, with its enums in `source/dependencies/enum/database.enum.ts`. Only `User` has a Mongoose schema so far. Most feature modules are still scaffolds.

## Commands

```bash
npm run start:dev          # watch mode (loads .env.<NODE_ENV>, then .env)
npm run build              # nest build → distribution/
npm run lint               # oxlint --type-aware over source/ and test/
npm run format             # prettier (single quotes, printWidth 160, trailing commas)
npm test                   # vitest run, all **/*.spec.ts
npx vitest run source/application/user/user.service.spec.ts   # one file
npx vitest run -t "should be defined"                         # by test name
npm run test:e2e           # **/*.e2e-spec.ts (test/ is empty for now)
npm run generate:secret    # random base64 key for the token/encryption secrets
npm run docs:generate      # rebuild public/documentation/swagger.json and postman.json from scripts/documentation/generate.mjs
```

The app needs a local MongoDB and a Redis to boot, because the cache factory pings Redis at startup.

## Conventions and gotchas

- **ESM + NodeNext**: relative imports must end in `.js`. Use `import.meta.dirname`, not `__dirname`. `main.ts` uses top-level `await`.
- **Build output is `distribution/`, not `dist/`**: `start:prod` and the Dockerfile run `node distribution/main.js`. `nest-cli.json` copies `i18n/**/*.json` into the build.
- **Config**: `source/app.configuration.ts` registers everything under the `app` namespace. Read it with `configService.get('app.auth.accessToken.expiresIn')` and similar keys. Some places in `app.module.ts` still read `process.env` directly (throttler, `REDIS_URL`), and the Mongo URI is hard-coded to `mongodb://localhost/test` instead of `app.database.uri`.
- **Port**: `main.ts` listens on `process.env.PORT ?? 3000`, while the config default is 9090.
- Vitest runs with `globals: true`, so use `vi.fn()` for mocks.

## Architecture

```
source/
  app.module.ts        root wiring: Config, Throttler, I18n, Cache (memory + Redis), Mongoose, @nestjs/authentication
  application/<feature>/   feature modules (authentication, user, me): module/controller/service, dto/, entities/, cqrs/
  database/
    model/             @nestjs/mongoose schemas (class + SchemaFactory), typed against the I* interfaces
    repository/        DatabaseRepository<T> base + per-model repositories
    mapper/            (empty) document → response mapping
  dependencies/        cross-cutting code: decorators, guards, pipes, interceptors, middleware, exception filters,
                       auth providers, enums, interfaces, cache keys, i18n helpers, shared services
  i18n/{en,ar}/        errors.json, validation.json
```

### Data access

Feature services are expected to go through repositories rather than inject Mongoose models directly. `DatabaseRepository<T>` (`source/database/repository/base.repository.ts`) wraps the common queries and takes object arguments (`{ filter, projection, options }`). Its overloads return lean objects when `options.lean` is true and hydrated documents otherwise. It also provides `paginate()`. All `update*`/`findOneAnd*`/`findByIdAndUpdate` helpers bump `__v` and turn on `runValidators`. A model-specific repository (e.g. `UserRepository`) extends it with `@InjectModel(Model.name)` and adds domain queries. Sensitive fields (`passwordHash`, `googleId`) use `select: false` and are only selected on purpose (`findByEmail`).

To add a collection:
1. Define the `I<Name>` interface in `database.interface.ts`, if it isn't there already.
2. Write the schema in `database/model/`.
3. Write a repository extending `DatabaseRepository<I<Name>>`.
4. Register the schema in `MongooseModule.forFeature` in `source/database/database.module.ts`, and add the repository to that module's `providers` and `exports`.

Feature modules that need a repository import `DatabaseModule`.

Shared services from `dependencies/service` are provided the same way, through `ServiceModule` (`dependencies/module/service.module.ts`). It must not import feature modules: the files would import each other, and under ESM that fails at startup with "Cannot access X before initialization".

### Authentication

This uses `@nestjs/authentication`, not Passport. It is configured with `AuthenticationModule.forRootAsync` in `app.module.ts`, with access and refresh token keys, issuer, audience `['doctor','patient']` and TTLs all taken from `app.auth.*`. The local feature module is imported under the alias `AuthModule` to avoid a name clash. The auth strategies live in `dependencies/provider/`: `JwtAuth` extends `JwtBearerProvider` and `SessionAuth` extends `SessionCookieProvider`. Each one registers itself with `AuthenticationRegistry` in its constructor and resolves the user from the repository in `validate()`. Roles come from `SystemRoleEnum` (admin/doctor/patient), and `@Role([...])` sets `ROLES_OPTION` metadata for a guard to read.

### i18n

`@nestjs/i18n` loads JSON from `source/i18n`, supports `en` and `ar`, and resolves the locale in this order: `?language=`, then the `x-language` header, then `Accept-Language`. `Localize` (`dependencies/language/localize.ts`) maps an English message back to its `errors.*` key, including `{placeholder}` templates, and translates it. This means exceptions can be thrown with plain English text taken from `i18n/en/errors.json`. The static `Localize.text()` works outside DI once the module has initialised. Any user-facing error text you add must go in both `en` and `ar`.

### Caching

`CACHE_MANAGER` is global and uses two tiers: an in-memory LRU (60s TTL, 5k entries) in front of Redis through Keyv. Cache key builders live in `dependencies/key/cache.key.ts`.

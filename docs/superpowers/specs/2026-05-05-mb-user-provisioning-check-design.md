# Vérification de provisionnement utilisateur (mb-api / mb-webapp)

## Contexte

L'authentification OIDC (Keycloak) est en place dans `mb-api` et `mb-webapp` :
- `mb-api/src/authentication/jwks.ts` valide les access tokens et expose `{ providerSub, providerType: 'keycloak' }`.
- `mb-api/src/framework/auth/authContext.ts` injecte cette info dans un ALS, exposée via `requireUser()`.
- `mb-webapp/src/server/auth/router.ts` gère le flow login/callback/refresh/logout côté serveur.
- Une route `GET /me` existe déjà sur `mb-api` et retourne `{ userId, source: 'jwt' }` — actuellement `userId` = `providerSub` (pas un id interne).

À ce stade, n'importe quel utilisateur Keycloak ayant un token valide pour notre client OIDC peut accéder à l'API. On veut restreindre l'accès aux comptes explicitement provisionnés dans une table `User` côté `mb-api`.

## Objectif

1. Introduire une table `User` côté `mb-api` avec un identifiant interne (UUID v7) lié au couple `(providerSub, providerType)`.
2. Bloquer l'accès API pour tout token valide dont le `sub` n'est pas en base → 401.
3. Côté webapp, vérifier ce provisionnement à la fin du callback OAuth ; rediriger vers une page d'erreur dédiée si l'utilisateur n'est pas provisionné, sans créer de session.

## Hors-scope

- Provisionnement automatique (création de l'utilisateur en base à la volée).
- UI d'administration des utilisateurs.
- Multi-providers (`france_connect`, `pro_connect`, …) — l'enum `ProviderType` est dimensionné pour mais ne contient que `keycloak`.
- Tests d'intégration de la query Prisma — en attente d'un socle de tests DB avec rollback transactionnel (ticket dédié).

## Architecture

### Modèle de données

Nouvelle table `user` (Prisma) :

```prisma
enum ProviderType {
  keycloak
}

model User {
  id           String       @id @db.Uuid
  providerSub  String       @map("provider_sub")
  providerType ProviderType @map("provider_type")
  createdAt    DateTime     @default(now()) @map("created_at")
  updatedAt    DateTime     @updatedAt      @map("updated_at")

  @@unique([providerSub, providerType], name: "user_provider_sub_type_unique")
  @@map("user")
}
```

Décisions :
- `id` est un UUID v7 généré côté application via la lib `uuidv7` ; pas de `@default` côté Prisma. La colonne est typée `@db.Uuid`.
- Index unique composé sur `(providerSub, providerType)` : c'est la clé de lookup et garantit l'unicité fonctionnelle.
- `ProviderType` modélisé en enum Prisma : ajouter un provider est de toute façon un changement applicatif (nouveau JWKS, nouveau issuer), une migration en plus est cheap.
- Convention du repo : snake_case en DB (`@map`), camelCase côté TS.
- Pas de colonne `email`/`name` : non nécessaire pour l'autorisation, dispo dans le JWT à l'usage.

### Query `getUserByProvider`

Fichier : `apps/mb-api/src/authentication/queries/getUserByProvider.ts`

```ts
import { ResultAsync } from 'neverthrow'

import { prisma } from '@/framework/persistence/prisma'

export type AuthenticatedUser = {
  id: string
  providerSub: string
  providerType: 'keycloak'
}

export const getUserByProvider = (params: {
  providerSub: string
  providerType: 'keycloak'
}): ResultAsync<AuthenticatedUser | null, never> =>
  ResultAsync.fromSafePromise(
    prisma.user.findUnique({
      where: {
        user_provider_sub_type_unique: {
          providerSub: params.providerSub,
          providerType: params.providerType,
        },
      },
      select: { id: true, providerSub: true, providerType: true },
    }),
  )
```

Décisions :
- `fromSafePromise` (pas `fromPromise`) : les erreurs Prisma deviennent des exceptions, captées globalement par `errorHandler` (cf. plus bas). On ne pollue pas le code applicatif avec des `mapErr` boilerplate.
- Retour `Ok(AuthenticatedUser | null)` : `null` = pas trouvé (cas fonctionnel attendu, pas une erreur).
- `select` explicite — on ne renvoie que ce dont l'authContext a besoin.

### `errorHandler.ts` : gestion du 404 Prisma

Ajout d'un handler dédié à `Prisma.PrismaClientKnownRequestError` code `P2025` (record not found), pour les futurs `findUniqueOrThrow`/`update`/`delete` sur record manquant. Notre query actuelle ne le déclenche jamais (`findUnique` retourne `null`), mais le handler pose la convention.

```ts
import { Prisma } from '@/generated/prisma/client'

// dans app.onError, après le ZodError handler :
if (
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === 'P2025'
) {
  console.warn(`[${method} ${url}] Prisma not found: ${error.message}`)
  return context.json(
    {
      code: 'ENTITY_NOT_FOUND',
      message: 'Ressource introuvable',
    },
    404,
  )
}
```

Les autres erreurs Prisma tombent dans le fallback 500 générique (comportement actuel inchangé).

### `authContext` : DB lookup après vérification du token

`apps/mb-api/src/framework/auth/authContext.ts` :

```ts
import { createMiddleware } from 'hono/factory'
import { okAsync } from 'neverthrow'

import { verifyAccessToken } from '@/authentication/jwks'
import { getUserByProvider } from '@/authentication/queries/getUserByProvider'
import { runWithUser } from '@/framework/auth/userContext'
import { logger } from '@/framework/logger/logger'

const BEARER_REGEX = /^Bearer\s+(.+)$/i

const extractBearerToken = (header: string | undefined): string | null => {
  if (!header) return null
  const match = BEARER_REGEX.exec(header)
  if (!match) return null
  const token = match[1]?.trim()
  return token && token.length > 0 ? token : null
}

const resolveUser = async (authorization: string | undefined) => {
  const token = extractBearerToken(authorization)
  if (!token) return okAsync(null)

  let verifiedTokenInfo
  try {
    verifiedTokenInfo = await verifyAccessToken(token)
  } catch (error) {
    logger.warn(
      { event: 'auth.jwt.invalid', reason: error instanceof Error ? error.message : 'unknown' },
      'JWT verification failed',
    )
    return okAsync(null)
  }

  return getUserByProvider(verifiedTokenInfo).orTee((error) =>
    logger.warn(
      { event: 'auth.user.lookup_failed', err: error },
      'User lookup failed during authentication',
    ),
  )
}

export const authContext = createMiddleware(async (context, next) => {
  const user = await resolveUser(context.req.header('Authorization'))
  await runWithUser(user.unwrapOr(null), next)
})
```

Et `userContext.ts` : remplacement de `VerifiedTokenInfo` par `AuthenticatedUser`, et passage de `undefined` à `null` pour la valeur "pas d'utilisateur" :

```ts
import { AsyncLocalStorage } from 'node:async_hooks'

import type { AuthenticatedUser } from '@/authentication/queries/getUserByProvider'
import { UnauthorizedError } from '@/framework/auth/UnauthorizedError'

type UserStore = { user: AuthenticatedUser | null }

const storage = new AsyncLocalStorage<UserStore>()

export const runWithUser = <T>(user: AuthenticatedUser | null, fn: () => T): T =>
  storage.run({ user }, fn)

export const getCurrentUser = (): AuthenticatedUser | null =>
  storage.getStore()?.user ?? null

export const requireUser = (): AuthenticatedUser => {
  const user = getCurrentUser()
  if (!user) throw new UnauthorizedError('Authentification requise')
  return user
}
```

Note : si la méthode `orTee` n'est pas disponible dans `neverthrow@8.2`, on fallback sur `mapErr` qui log puis retourne l'erreur (équivalent fonctionnel).

### Route `GET /me`

Le contrat (`{ userId: string, source: 'jwt' }`) reste inchangé, mais `userId` devient désormais l'UUID interne :

```ts
me.openapi(meRoute, (context) => {
  const user = requireUser()
  return jsonResponseOk({
    context,
    data: { userId: user.id, source: 'jwt' as const },
    schema: MeOkSchema,
    status: 200,
  })
})
```

### Webapp : vérification dans le callback OAuth

`apps/mb-webapp/src/server/auth/router.ts`. Nouveau helper :

```ts
import ky, { HTTPError } from 'ky'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

const checkUserProvisioned = (accessToken: string) =>
  ResultAsync.fromPromise(
    ky.get(`${serverEnv.API_BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      retry: 0,
      timeout: 5000,
    }),
    (error) => error,
  )
    .map(() => true)
    .orElse((error) =>
      error instanceof HTTPError && error.response.status === 401
        ? okAsync(false)
        : errAsync(error),
    )
```

Modification du callback `/auth/callback` (remplace l'écriture inconditionnelle de la session) :

```ts
return checkUserProvisioned(tokens.access_token).match(
  async (provisioned) => {
    if (!provisioned) {
      logger.warn(
        { event: 'auth.login.user_not_found', sub: claims.sub },
        'PMB user not found',
      )
      return context.redirect('/auth/login-error')
    }

    await writeSession(
      context,
      { refreshToken: tokens.refresh_token, sub: claims.sub },
      sessionTtlSeconds(tokens.refresh_expires_in),
    )

    logger.debug({ event: 'auth.login.success' }, 'PMB login completed')

    const target = pkce.redirect
      ? new URL(pkce.redirect, serverEnv.PUBLIC_BASE_URL).toString()
      : serverEnv.PUBLIC_BASE_URL
    return context.redirect(target)
  },
  (error) => {
    logger.error(
      { event: 'auth.callback.me_failed', err: error },
      'Failed to verify user provisioning',
    )
    return context.text('Authentication failed', 502)
  },
)
```

Décisions :
- Pas d'écriture de session si pas provisionné — sinon l'utilisateur aurait une session valide sans accès, source de confusion.
- 401 sur `/me` = cas fonctionnel attendu → `Ok(false)` → redirect login-error.
- Toute autre erreur (network, 5xx, timeout) → `Err` → 502 + log error.
- `retry: 0` : on ne veut pas masquer le 401 fonctionnel par un retry.
- `timeout: 5000` : on est dans le path critique du login.
- Nouvelle variable `serverEnv.API_BASE_URL` : URL de mb-api côté serveur (peut différer de l'URL exposée au browser).

### Page d'erreur de login

Nouvelle route TanStack file-based : `apps/mb-webapp/src/routes/auth/login-error.tsx`.

```tsx
import { createFileRoute } from '@tanstack/react-router'

import { Button } from '@/shared/components/Button'
import { logout } from '@/auth'

export const Route = createFileRoute('/auth/login-error')({
  component: LoginErrorPage,
})

function LoginErrorPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Accès refusé</h1>
      <p className="text-gray-700">
        Votre compte n'est pas autorisé à accéder à cette application.
        Contactez votre administrateur si vous pensez qu'il s'agit d'une erreur.
      </p>
      <Button onClick={() => logout()}>Se déconnecter</Button>
    </main>
  )
}
```

Décisions :
- Page publique (pas de garde d'auth) — sinon boucle infinie.
- Tailwind + composant `Button` partagé (conventions du repo).
- Bouton "Se déconnecter" qui appelle l'helper `logout()` existant (`POST /auth/logout` puis redirect IdP) — permet de re-tenter avec un autre compte.
- Les imports exacts (`@/shared/components/Button`, `@/auth`) seront ajustés à l'implémentation selon ce qui existe.

## Tests

### Couverture

- `authContext.test.ts` étendu avec :
  - Mock additionnel de `@/authentication/queries/getUserByProvider`.
  - Cas existants adaptés au nouveau type retourné (`AuthenticatedUser` au lieu de `VerifiedTokenInfo`).
  - Nouveau cas : token valide mais `getUserByProvider` retourne `Ok(null)` → 401 sur `/protected`, `null` sur `/anonymous`.
  - Nouveau cas : token valide + user trouvé → réponse contient `userId` = id interne (UUID), pas `providerSub`.

### En attente

- Tests Prisma de `getUserByProvider` : skippés en attendant le socle de tests DB avec rollback transactionnel (ticket dédié à venir).
- Tests E2E du flow callback / login-error : non couverts par ce ticket.

## Migration et déploiement

- `prisma migrate dev --name add_user_table` génère la migration SQL.
- Aucune donnée à migrer (table neuve).
- En recette/prod, un script de provisionnement manuel (ou des `INSERT` ad-hoc) sera nécessaire pour activer l'accès au moins pour `ditp.admin@example.com` (le compte de dev visible dans le JWT exemple). Ce script n'est pas dans le scope de ce ticket — sans utilisateur en base, plus personne ne peut accéder à l'API après merge.

## Variables d'environnement

- `mb-webapp` : ajout de `API_BASE_URL` dans `serverEnv` (URL de mb-api côté serveur).
- Mettre à jour `.env.example` du webapp.

## Dépendances à ajouter

- `mb-api` : `uuidv7`
- `mb-webapp` : `neverthrow`

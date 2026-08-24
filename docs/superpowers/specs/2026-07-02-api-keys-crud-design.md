# Design — CRUD clés API (mb-api) + IHM d'administration (mb-admin)

Date : 2026-07-02
Branche : `feat/mb-api-keys-crud`

## Contexte

Le modèle `ApiKey` existe déjà côté mb-api mais aucun endpoint ne permet de gérer
les clés : leur création est manuelle en base (script `scripts/generate-api-key.ts`
qui imprime une transaction SQL à exécuter à la main). On veut :

1. Ajouter le CRUD (créer / lister / révoquer) côté **mb-api**, en réutilisant la
   logique de génération de clé existante (`buildApiKey`).
2. Ajouter une **IHM dans mb-admin** pour administrer les clés.

Contrainte forte : **les routes de gestion des clés sont réservées aux clés API de
rôle ADMIN** (les utilisateurs OIDC et les clés CONTRIBUTOR sont rejetés).

### Éléments existants réutilisés

- Modèle Prisma `ApiKey` (`apps/mb-api/prisma/schema.prisma`) : `id` (= FK partagée
  vers `Principal`), `label`, `keyHash` (unique), `prefix`, `role`
  (`ApiKeyRole` = `CONTRIBUTOR | ADMIN`, défaut `CONTRIBUTOR`), `createdAt`,
  `expiresAt?`, `revokedAt?`, `lastUsedAt?`. Une clé est un `Principal` (PK partagée
  1:1) : la créer implique d'insérer un `Principal` puis l'`ApiKey` de même `id`.
- `buildApiKey(secret)` (`apps/mb-api/src/framework/auth/apiKey.ts`) : génère
  `{ id, rawKey, keyHash, prefix }`. `rawKey = pilote_live_<base64url(32 octets)>`.
  Seul le `keyHash` (HMAC-SHA256 via `env.API_KEY_HMAC_SECRET`) est stocké : la
  clé en clair n'est **connaissable qu'à la création**.
- `verifyApiKey` : rejette une clé révoquée (`revokedAt`) ou expirée (`expiresAt`).
- Contexte principal (`framework/auth/userContext.ts`) :
  `Principal = { kind:'user', user } | { kind:'apiKey', apiKey:{ id, label, role } }`,
  `requirePrincipal()`, `requireCurrentPrincipalId()`.
- Pattern feature mb-api : `OpenAPIHono`, dossier `src/<feature>/` avec `routes.ts`,
  `commands/`, `queries/`, `utils.ts` ; écritures dans `withTransaction` ; erreurs
  domaine (`ForbiddenError`→403, `ConflictError`→409, `NotFoundError`→404) mappées
  par le error handler ; `.match(ok, never)` sur les `ResultAsync`. Schémas partagés
  dans `packages/mb-shared/src/`.
- Pattern feature mb-admin : SPA Vite + TanStack Router/Query, BFF Hono qui
  proxifie `/api/*` vers mb-api avec la clé de session en `Bearer` (allowlist
  `SAFE_PATH`). Feature de référence : Indicateurs (`src/api`, `src/queries`,
  `src/routes/_authed/indicateurs`, `src/components/IndicateurForm.tsx`).

## Décisions

- **Périmètre v1** : cycle de vie de la clé uniquement (label / rôle / expiration).
  Pas de gestion des permissions ressources (indicateur/panier) — hors scope.
- **Enforcement** : primitives composables (prédicats purs + `ensurePrincipal`),
  pas de guard monolithique. Gestion des clés = `isApiKeyAdmin` strict.
- **Path URL** : `/api-keys` (ressource technique très commune, anglais). Le code
  reste en anglais (`apiKey`, `createApiKey`, …).
- **Révocation** : soft-delete via `POST /api-keys/{id}/revoke` (action explicite),
  pas de hard delete ni de `DELETE`.

## 1. Auth / guards (mb-api)

Nouvelles primitives, remplaçant `ensureApiKeyAdmin` (nom trompeur : laissait passer
les utilisateurs OIDC).

`framework/auth/principalPredicates.ts` — prédicats purs :

```ts
export const isOidcUser          = (p: Principal) => p.kind === 'user'
export const isApiKey            = (p: Principal) => p.kind === 'apiKey'
export const isApiKeyAdmin       = (p: Principal) =>
  p.kind === 'apiKey' && p.apiKey.role === ApiKeyRole.ADMIN
export const isApiKeyContributor = (p: Principal) =>
  p.kind === 'apiKey' && p.apiKey.role === ApiKeyRole.CONTRIBUTOR
```

`framework/auth/ensurePrincipal.ts` — transforme un prédicat en guard :

```ts
export const ensurePrincipal = (
  predicate: (p: Principal) => boolean,
  message: string,
): void => {
  const principal = requirePrincipal()
  if (!predicate(principal)) throw new ForbiddenError(message)
}
```

**Suppression** de `framework/auth/ensureApiKeyAdmin.ts` (+ `.test.ts`). Migration des
2 call sites existants (`commands/upsertIndicateur.ts`, `commands/upsertReferentiel.ts`)
et de leurs tests vers la règle laxiste explicite au call site :

```ts
ensurePrincipal(
  (p) => isApiKeyAdmin(p) || isOidcUser(p),
  'Cette opération requiert un rôle ADMIN',
)
```

## 2. Endpoints mb-api — feature `src/apiKey/`

Arborescence (convention feature singulier camelCase, cf. `indicateur/`, `referentiel/`) :

```
apps/mb-api/src/apiKey/
├── routes.ts            # OpenAPIHono : POST /api-keys, GET /api-keys, POST /api-keys/{id}/revoke
├── commands/
│   ├── createApiKey.ts  (+ createApiKey.test.ts)
│   └── revokeApiKey.ts  (+ revokeApiKey.test.ts)
├── queries/
│   └── listApiKeys.ts   (+ listApiKeys.test.ts)
└── utils.ts             # mappers DB row -> apiKeyApiModel (+ calcul du status)
```

Enregistrement dans `src/app.ts` : `import { apiKeyRoutes }` + `app.route('/', apiKeyRoutes)`.

Chaque handler appelle en tête :

```ts
ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
```

→ **clé API ADMIN uniquement** (OIDC et CONTRIBUTOR → 403).

| Méthode | Path | Description |
|---|---|---|
| `POST` | `/api-keys` | Crée la clé. |
| `GET` | `/api-keys` | Liste les clés. |
| `POST` | `/api-keys/{id}/revoke` | Révoque (soft-delete). |

### POST /api-keys
- Body : `{ label: string (min 1), role?: ApiKeyRole (défaut CONTRIBUTOR), expiresAt?: string date-time }`.
- Dans `withTransaction` : `buildApiKey(env.API_KEY_HMAC_SECRET)` →
  `db().principal.create({ data: { id } })` puis
  `db().apiKey.create({ data: { id, label, keyHash, prefix, role, expiresAt } })`.
- **201** → `createdApiKeyApiModel` = métadonnées + `rawKey` (affichée **une seule fois**).

### GET /api-keys
- Tri `createdAt` desc, **sans pagination** (volume faible).
- Ne renvoie **jamais** `keyHash` ni `rawKey`.
- Chaque item (`apiKeyApiModel`) : `id, label, prefix, role, createdAt, expiresAt,
  revokedAt, lastUsedAt, status`.

### POST /api-keys/{id}/revoke
- Positionne `revokedAt = now`.
- **404** si la clé n'existe pas.
- **409** si déjà révoquée.
- **409** si `id === requireCurrentPrincipalId()` (interdiction de révoquer la clé
  utilisée pour la requête → anti-lockout).
- **200** → `apiKeyApiModel` à jour.

### Statut dérivé
`status` calculé (pas stocké), priorité : `revoked` (revokedAt présent) > `expired`
(expiresAt dans le passé) > `active`.

## 3. Schémas partagés — `packages/mb-shared/src/apiKey.ts`

- `apiKeyRoleSchema` : `z.enum(['CONTRIBUTOR', 'ADMIN'])`.
- `apiKeyStatusSchema` : `z.enum(['active', 'expired', 'revoked'])`.
- `createApiKeyBodySchema` : `{ label, role?, expiresAt? }`.
- `apiKeyApiModelSchema` : métadonnées (sans secret) + `status`.
- `createdApiKeyApiModelSchema` : `apiKeyApiModelSchema` + `rawKey`.
- Types inférés exportés.

## 4. IHM mb-admin — feature `api-keys`

Convention de routes file-based confirmée : `_authed/<feature>/{index,nouveau,$id}.tsx`
(cf. `indicateurs/`, `referentiels/`). On nomme la feature `api-keys` (cohérent avec
l'URL `/api-keys` et le nommage anglais ; évite la collision avec le flux de login
`src/routes/cle.$environment.tsx`).

- **BFF** : étendre `SAFE_PATH` (`src/server/api/router.ts`) pour autoriser le
  segment `api-keys` (le proxy transmet la méthode verbatim, `POST /revoke` passe).
- `src/api/apiKeys.ts` : `fetchApiKeys`, `createApiKey`, `revokeApiKey` (via
  `bffClient`, réponses parsées avec les schémas mb-shared).
- `src/queries/apiKeys.ts` : `apiKeysQueryOptions`.
- `src/routes/_authed/api-keys/index.tsx` : liste (`Table`), badge `status`, bouton
  **Révoquer** avec confirmation inline (pas de `window.confirm`), styling
  prod-aware. Affiche proprement un 403 (clé de session non-ADMIN).
- `src/routes/_authed/api-keys/nouveau.tsx` : formulaire (`label`, select `role`,
  `expiresAt` optionnelle) → au succès, panneau `CreatedApiKeyResult` affichant la
  `rawKey` une seule fois + bouton copier + avertissement « ne sera plus affichée ».
- `src/components/ApiKeyForm.tsx` : formulaire contrôlé (`useState`, pattern
  `IndicateurForm`).
- Entrée `BarCard` dans `src/routes/_authed/fonctionnalites.tsx`.

## 5. Tests

### mb-api
- Unit (commands/queries) via `runAsAdmin/runAsContributor/runAsUser` :
  - guard strict : CONTRIBUTOR → `ForbiddenError`, OIDC user → `ForbiddenError`,
    ADMIN → OK.
  - création : renvoie `rawKey`, persiste un `keyHash` (pas la clé en clair),
    applique `role`/`expiresAt`.
  - liste : ne renvoie aucun secret, `status` correct (active/expired/revoked).
  - révocation : positionne `revokedAt` ; déjà-révoquée → 409 ; self-revoke → 409 ;
    clé inconnue → 404.
- Intégration routes (`buildTestApp`) : codes HTTP et payloads.
- Tests des call sites migrés (`upsertIndicateur`, `upsertReferentiel`) adaptés à
  `ensurePrincipal`.

### mb-admin
- Pas de tests front (conforme à la convention projet).

## Hors scope

- Gestion des permissions ressources (indicateur/panier) à la création/édition.
- Édition d'une clé existante (label/rôle/expiration) : v1 = create / list / revoke.
- Hard delete d'une clé (on conserve pour l'audit via soft-delete).
- Pagination de la liste (volume faible).

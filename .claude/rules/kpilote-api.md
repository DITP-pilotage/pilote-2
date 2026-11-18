---
paths:
  - "apps/kpilote-api/**"
---

# kpilote-api

Hono + `@hono/zod-openapi`, Prisma 7, neverthrow, Vitest. L'API est une API pure, pas un BFF : elle reste agnostique de l'UI. Les règles communes (`kpilote-common.md`) s'appliquent aussi.

## Structure

### Un module par ressource
`src/<module>/` contient `routes.ts`, `queries/`, `commands/`, `permissions.ts`, `utils.ts` (mappers `toXApiModel`, constantes `xInclude`), et des fichiers de logique pure nommés par ce qu'ils font (`combinaison.ts`, `resolveSelection.ts`). Le socle transverse est dans `src/framework/`, les helpers de test dans `src/test/`.
Pourquoi : CQS lite ; on trouve une lecture ou une écriture par son nom de fichier.
- Exemple : `src/axe/` (`routes.ts`, `queries/getAxeByPublicId.ts`, `commands/deleteModalite.ts`, `utils.ts`).

### Alias `@/` déclaré dossier par dossier
Tout nouveau module ajoute son entrée dans `tsconfig.json` (`"@/axe/*": ["./src/axe/*"]`). Pas d'import relatif hors tests.
Pourquoi : les alias sont explicites par module ; sans entrée, l'import ne se résout pas.

### Pas de framework sans discussion
Un nouveau helper transverse, middleware ou abstraction dans `src/framework/` se discute avant d'être écrit : on présente l'approche, on attend l'accord.
Pourquoi : ce code engage l'architecture de toute l'API.

## Routes

### Tout dans `routes.ts`
Schémas (`xApiModelSchema.openapi('XApiModel')`), `createRoute` et handlers dans le même fichier ; pas de `.schema.ts` / `.route.ts`. Les schémas de body, query et modèle viennent de `@pilote/kpilote-shared` ; seuls les schémas de params restent locaux.
Pourquoi : une route se lit d'un bloc ; la séparation par fichier n'apporte que du bruit.

### Le handler appelle une query ou une command et fait `.match`
`requireAuthentication` en middleware, réponses par `jsonResponseOk` / `jsonResponseError`, `never` comme branche d'erreur quand le type d'erreur est `never`. Les erreurs métier se traduisent par une fonction `describeXError(error)` avec un `switch (error.type)`.
- À faire :
  ```ts
  axeRoutes.openapi(getAxeRoute, async (context) =>
    getAxeByPublicId({ publicId: context.req.valid('param').id }).match(
      (data) => jsonResponseOk({ context, data, schema: AxeApiModelSchema, status: 200 }),
      never,
    ),
  )
  ```

### Les écritures passent par `withTransaction` dans la route, et s'enchaînent par `.andThen`
On enchaîne la command puis la query de relecture avec `.andThen`, sans `if (isErr())` ni `_unsafeUnwrap`.
- À faire : `withTransaction(async () => upsertAxe({ publicId: id, body }).andThen(() => getAxeByPublicId({ publicId: id })))`

### API agnostique de l'UI
Pas de champ ni de route qui matérialise un choix de présentation (`estParDefaut`, `GET /default-individu`). L'API expose des primitives métier ; le défaut d'écran se décide dans la webapp.
Pourquoi : l'API sert d'autres consommateurs que la webapp ; une décision d'écran n'a rien à faire dans le contrat.

## Queries et commands

L'usage de neverthrow dans la codebase sera retravaillé (notamment le rollback des transactions sur une erreur métier). En attendant, les règles ci-dessous décrivent la forme à suivre pour le nouveau code.

### Une query renvoie `ResultAsync<T, never>`
`ResultAsync.fromSafePromise(db()...)` puis `.map(toXApiModel)`. Pour un objet introuvable, `findUniqueOrThrow` / `findFirstOrThrow` : P2025 devient un 404 dans le gestionnaire d'erreurs global. Si la lecture a plusieurs étapes, même forme qu'une command (fonction `async` interne, un seul `fromSafePromise`).
- À faire : `src/axe/queries/getAxeByPublicId.ts`

### Une command est une fonction `async` linéaire, avec un seul passage en `ResultAsync` à la sortie
La fonction interne `perform…` `await` chaque étape, renvoie `err({ type })` sur un refus métier et `ok(...)` à la fin ; l'export l'enveloppe une seule fois : `ResultAsync.fromSafePromise(perform(params)).andThen((result) => result)`. Pas d'IIFE, pas de chaînes de `.andThen` / `fromSafePromise` imbriquées.
Pourquoi : une command se lit de haut en bas comme un script ; les chaînes imbriquées cachent l'ordre des étapes et l'endroit où l'erreur naît.
- À faire : `src/axe/commands/deleteModalite.ts`
  ```ts
  const performDelete = async ({ axePublicId, publicId }: {...}): Promise<Result<void, DeleteModaliteError>> => {
    ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)
    const modalite = await db().modalite.findFirst({ ... })
    if (!modalite) throw new NotFoundError('Modalité introuvable dans cet axe.', { ... })
    if (modalite.enfants.length > 0) return err({ type: 'MODALITE_A_DES_ENFANTS', enfants: ... })
    ...
    return ok()
  }

  export const deleteModalite = (params: {...}): ResultAsync<void, DeleteModaliteError> =>
    ResultAsync.fromSafePromise(performDelete(params)).andThen((result) => result)
  ```
- À éviter : `config.resoudreCibleEcriture(params).andThen((cible) => ensureBrouillonUnique(...).andThen(() => ResultAsync.fromSafePromise(db().commentaire.create(...)).map(...)))` (`src/commentaire/commands/creerCommentaire.ts`)

### Tous les `err(...)` avant la première écriture
Une command vérifie d'abord, écrit ensuite : aucun `return err(...)` après un `create`, `update`, `delete` ou `upsert`.
Pourquoi : `withTransaction` ne rollback que sur une exception ; un `err` est un retour normal, donc les écritures déjà faites sont committées.
- À faire : `deleteModalite.ts` renvoie ses deux `err` avant `deleteMany` / `delete`.

### `throw` seulement pour l'introuvable et l'accès refusé
`throw new NotFoundError(...)` (404) et `ensurePrincipal(...)` (403) ; tout autre refus métier (conflit, validation, règle de gestion) passe par `err(...)`. Pas de nouveau `throw new ConflictError` / `ValidationError` dans une command.
Pourquoi : un refus métier fait partie du contrat de la command ; l'appelant doit le voir dans le type.

### Les erreurs métier sont une union discriminée exportée
`export type DeleteModaliteError = { type: 'MODALITE_A_DES_ENFANTS'; enfants: string[] } | { type: 'MODALITE_UTILISEE'; valeurs: number }`. Code en SCREAMING_SNAKE_CASE, payload utile qui liste **tous** les cas fautifs (pas seulement le premier).
Pourquoi : l'appelant traite chaque cas par `switch`, et le client corrige tout en un aller-retour.

### Le principal se lit dans le contexte, pas en paramètre
`ensurePrincipal(...)` / `requireCurrentPrincipalId()` en tête de la fonction ; les permissions de ressource passent par `with{Ressource}ReadPermission(where, principalId)` et `ensure{Ressource}WritePermission({ principalId, ... })` (`docs/architecture/permissions-design.md`).

## Prisma

### `db()`, jamais `prisma`, hors `src/framework/persistence`
`db()` renvoie le client de la transaction courante (AsyncLocalStorage).

### Pas de `$transaction` imbriqué
Dans une query, une command ou une fixture, on enchaîne des `await` séquentiels ; l'atomicité vient de `withTransaction` (route) ou `integrationTest` (test). `prisma.$transaction([...])` ne sert que hors transaction (seed).
Pourquoi : `db().$transaction([...])` dans une transaction existante commit à part et contourne le rollback des tests.

### `include` plutôt que des `select` imbriqués
`findMany({ where, include: xInclude })` puis mapping TS (`toXApiModel`) ; les constantes `xInclude` vivent dans `utils.ts` (`satisfies Prisma.XInclude`).
Pourquoi : les `select` imbriqués sont illisibles et donnent des types inférés lourds ; le sur-fetch est marginal.

### Enums Prisma via une constante typée
`import { PermissionAction } from '@/generated/prisma/enums'` puis `const READ_ACTIONS: PermissionAction[] = [...]` ; pas de `[...] as const` dans un filtre `in`.
Pourquoi : un tuple readonly n'est pas assignable au tableau mutable attendu par Prisma 7.

### Migrations simples
Pas de prod réelle : pas d'expand/contract, pas de DEFAULT ni d'index conservés « pour l'ancien code ». On migre proprement les données locales et de recette.

## Tests

### Les tests de comportement vivent au niveau de la query ou de la command
`queries/<query>.test.ts` / `commands/<command>.test.ts` appellent la fonction directement, sous `runAsPrincipal` / `runAsAdmin`, et vérifient `_unsafeUnwrap()` / `_unsafeUnwrapErr()`. Les tests de route (`buildTestApp`) ne couvrent que le câblage HTTP (statut, sérialisation).
Pourquoi : un test de query est rapide, ciblé, et ne dépend pas du transport.

### `describe.concurrent` + `integrationTest`
Chaque `it` est enveloppé dans `integrationTest(async () => ...)` (transaction annulée en fin de test), et le `describe` est `concurrent`. Noms de tests en français (« renvoie… », « rejette… »).
- À faire : `src/axe/queries/getAxeByPublicId.test.ts`

### Données de test : fixtures, ids de test, valeurs en dur
`fixtures.<entity>(...)` (variadique, upsert sur la clé naturelle, défauts en dur, pas de compteur) plutôt que `db().x.create`. Ids publics via `@/test/randomIds` (`testAxeId()`, `const [ind1, ind2] = testIndicateurIds(2)` quand il en faut plusieurs). UUID internes via `uuidv7`, jamais `randomUUID`. Le reste en dur (`nom: 'Indicateur de test'`).
Pourquoi : chaque test est isolé par sa transaction ; des valeurs explicites rendent les assertions lisibles.
- Nouvelle entité testable : ajouter sa fonction dans `src/test/fixtures.ts` sur le même modèle.

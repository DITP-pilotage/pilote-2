---
paths:
  - "apps/kpilote-api/**"
---

# kpilote-api

Hono + `@hono/zod-openapi`, Prisma 7, neverthrow, Vitest. L'API est une API pure, pas un BFF : elle reste agnostique de l'UI. Les règles communes (`kpilote-common.md`) s'appliquent aussi.

## Structure

### Un module par ressource
`src/<module>/` contient `routes.ts`, `queries/`, `commands/`, `permissions.ts` (gardes d'accès), `rules.ts` (règles métier), `utils.ts` (mappers `toXApiModel`, constantes `xInclude`), et des fichiers de logique pure nommés par ce qu'ils font (`combinaison.ts`, `resolveSelection.ts`). Le socle transverse est dans `src/framework/`, les helpers de test dans `src/test/`.
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
`requireAuthentication` en middleware, réponses par `jsonResponseOk` / `jsonResponseError`, `never` comme branche d'erreur quand le type d'erreur est `never` (son paramètre est typé `never` : la route ne compile plus si la command gagne une erreur).
- À faire :
  ```ts
  axeRoutes.openapi(getAxeRoute, async (context) =>
    getAxeByPublicId({ publicId: context.req.valid('param').id }).match(
      (data) => jsonResponseOk({ context, data, schema: AxeApiModelSchema, status: 200 }),
      never,
    ),
  )
  ```

### Les erreurs métier se traduisent par `describeXError`
Une fonction `describeXError(error)` par union d'erreur, avec un `switch (error.type)` qui renvoie toujours `{ status, message, details }`, même quand tous les cas ont le même statut. La route répond `jsonResponseError({ context, error: { code: error.type, message, details }, schema: ErrorApiModelSchema, status })`.
Pourquoi : toutes les routes traduisent leurs erreurs de la même façon ; le statut se décide cas par cas, au même endroit que le message.

### Les écritures passent par `withTransaction` dans la route, la relecture se fait après
`withTransaction(() => …)` prend et renvoie un `ResultAsync` : il commit sur `ok`, et annule la transaction sur `err` comme sur une exception. La transaction n'enveloppe que la command ; la query de relecture s'enchaîne **après**, par `.andThen`, une fois la transaction committée. Pas de `if (isErr())` ni de `_unsafeUnwrap`, pas d'`await` d'une command dont on jette le `Result`. La transaction s'ouvre dans la route (ou un job), jamais dans une command.
Pourquoi : la transaction reste aussi courte que l'écriture ; la relecture voit l'état committé, comme n'importe quel client.
- À faire :
  ```ts
  withTransaction(() => upsertAxe({ publicId: id, body }))
    .andThen(() => getAxeByPublicId({ publicId: id }))
    .match(
      (data) => jsonResponseOk({ context, data, schema: AxeApiModelSchema, status: 200 }),
      (error) => {
        const { status, message, details } = describeUpsertAxeError(error)
        return jsonResponseError({ context, error: { code: error.type, message, details }, schema: ErrorApiModelSchema, status })
      },
    )
  ```
- À éviter : `withTransaction(() => command().andThen(() => query()))` (la relecture tient la transaction ouverte) et `withTransaction(async () => { await command(); return query() })` (le `Result` de la command est perdu).

### API agnostique de l'UI
Pas de champ ni de route qui matérialise un choix de présentation (`estParDefaut`, `GET /default-individu`). L'API expose des primitives métier ; le défaut d'écran se décide dans la webapp.
Pourquoi : l'API sert d'autres consommateurs que la webapp ; une décision d'écran n'a rien à faire dans le contrat.

## Queries et commands

### Une query renvoie `ResultAsync<T, never>`
`ResultAsync.fromSafePromise(db()...)` puis `.map(toXApiModel)`. Pour un objet introuvable, `findUniqueOrThrow` / `findFirstOrThrow` : P2025 devient un 404 dans le gestionnaire d'erreurs global. Une query n'a d'erreur dans son type que si un paramètre client peut être refusé (modalités de `listValeursRemarquablesForIndicateur`). Si la lecture a plusieurs étapes, même forme qu'une command (fonction `async` interne, un seul `fromSafePromise`).
- À faire : `src/axe/queries/getAxeByPublicId.ts`

### `ResultAsync` seulement à la frontière
Seule la fonction exportée d'une command ou d'une query renvoie un `ResultAsync`. Un helper interne renvoie `Promise<T>` s'il ne peut que lever une exception (404, 403), et `Promise<Result<T, E>>` s'il porte une erreur métier ; la command fait `await` puis `if (x.isErr()) return err(x.error)`.
Pourquoi : un `ResultAsync<T, never>` intermédiaire n'apporte rien et pousse à chaîner des `.andThen`.
- À faire : `validateAndResolveCellules` (`Promise<Result<ResolvedCellule[], BatchInvalidError>>`), consommé par `performBatch` dans `upsertValeursAvancementBatch.ts`.
- À éviter : `resolveIndicateurForWriteData` qui renvoie `ResultAsync<ResolvedIndicateur, never>` et enchaîne `.andThen` (`src/indicateur/resolveIndicateurForWrite.ts`).

### Une command est une fonction `async` linéaire, avec un seul passage en `ResultAsync` à la sortie
La fonction interne `perform…` `await` chaque étape, renvoie `err({ type })` sur un refus métier et `ok(...)` à la fin ; l'export l'enveloppe une seule fois : `new ResultAsync(perform(params))`. Sans erreur métier, `perform` renvoie `Promise<T>` et l'export fait `ResultAsync.fromSafePromise(perform(params))`. `perform` est annoté `Promise<Result<T, E>>` : le constructeur ne vérifie rien à l'exécution, le typage est le seul garde-fou. Pas d'IIFE, pas de chaînes de `.andThen` / `fromSafePromise` imbriquées.
Pourquoi : une command se lit de haut en bas comme un script ; les chaînes imbriquées cachent l'ordre des étapes et l'endroit où l'erreur naît.
- À faire : `src/apiKey/commands/revokeApiKey.ts`
  ```ts
  const performRevoke = async (id: string): Promise<Result<ApiKeyApiModel, RevokeApiKeyError>> => {
    ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
    if (id === requireCurrentPrincipalId()) return err({ type: 'CLE_API_COURANTE' })
    const existing = await db().apiKey.findUniqueOrThrow({ where: { id } })
    if (existing.revokedAt) return err({ type: 'CLE_API_DEJA_REVOQUEE' })
    const revoked = await db().apiKey.update({ ... })
    return ok(toApiKeyApiModel(revoked))
  }

  export const revokeApiKey = (id: string): ResultAsync<ApiKeyApiModel, RevokeApiKeyError> =>
    new ResultAsync(performRevoke(id))
  ```
- À éviter : `ResultAsync.fromSafePromise(perform(params)).andThen((result) => result)` (même effet, en plus long).
- À éviter : `resolveIndicateurAndIndividuForWriteData(...).andThen(({ indicateur, individu }) => ResultAsync.fromSafePromise(db().objectifIndicateurIndividu.upsert(...)).map(...))` (`src/objectifIndicateurIndividu/commands/upsertObjectifIndicateurIndividu.ts`)

### Un `err` annule la transaction
`withTransaction` rollback sur `err` : un `return err(...)` après une écriture est sûr. Les règles métier s'appliquent quand même avant la première écriture (voir « Une command : gardes, chargement, règles, écriture ») ; un contrôle placé après une écriture reste l'exception, quand il dépend de ce qu'elle a produit.

### Le principal se lit dans le contexte, pas en paramètre
Les gardes (`ensureAdmin()`, `ensureAuteur(...)`, `requireCurrentPrincipalId()`) se placent en tête de la fonction ; les permissions de ressource passent par `with{Ressource}ReadPermission(where, principalId)` et `ensure{Ressource}WritePermission({ principalId, ... })` (`docs/architecture/permissions-design.md`).

## Gestion d'erreur

### `throw` seulement pour l'introuvable et l'accès refusé
`findUniqueOrThrow` / `throw new NotFoundError(...)` (404) et `ensurePrincipal(...)` / `ensure{Ressource}WritePermission` (403) ; tout autre refus métier (conflit, validation, règle de gestion) passe par `err(...)`. Pas de `throw new ConflictError` / `ValidationError` ni de sous-classe d'`AppError` dans une command ou ses helpers. Les exceptions techniques (Prisma, bug) restent des exceptions : pas de `fromPromise` avec un mapper d'erreur.
Pourquoi : un refus métier fait partie du contrat de la command ; l'appelant doit le voir dans le type. 404 et 403 concernent toutes les routes et sont traités une fois par le gestionnaire global.

### Les erreurs métier sont une union discriminée exportée
`export type DeleteModaliteError = { type: 'MODALITE_A_DES_ENFANTS'; enfants: string[] } | { type: 'MODALITE_UTILISEE'; valeurs: number }`. Le `type` est en SCREAMING_SNAKE_CASE, en français, et devient le `code` de la réponse ; le payload est utile et liste **tous** les cas fautifs (pas seulement le premier).
Pourquoi : l'appelant traite chaque cas par `switch`, et le client corrige tout en un aller-retour.

### Une règle porte son erreur, un helper technique renvoie une donnée
Une règle de `rules.ts` fabrique son `err`. Un helper technique (diff de liaisons, ids inconnus, remontée des ancêtres) renvoie une donnée, et la command ou la règle décide. Un helper partagé qui enchaîne chargement et règles peut porter leurs erreurs (`resolveCelluleForWrite`, pour l'upsert et la suppression d'une valeur).
Pourquoi : on lit dans la command, ou dans les règles qu'elle appelle, tous les refus qu'elle peut renvoyer.

### Une référence inconnue se refuse dans la command
Vérifier qu'une liste d'ids existe relève de la validation d'entrée, pas d'une règle métier : la command appelle `findUnknown({ requested, found })` puis fait `if (inconnus.length > 0) return err({ type: 'REFERENTIELS_INCONNUS', referentiels: inconnus })`. Une référence isolée passe par `findUniqueOrThrow` (404).

## Règles métier

### Une règle métier est une fonction pure, dans `<module>/rules.ts`
`check<Règle>(input): Result<T, XError>`, sans `db()` ni principal. Elle reçoit **seulement les champs dont elle a besoin**, pas l'entité Prisma entière : tout contexte qui les contient convient (typage structurel). Elle renvoie `ok()`, ou la donnée qu'elle a vérifiée (`ok(individu)`, les modalités dans l'ordre des axes) pour éviter un `!` derrière le contrôle. Chaque règle exporte son type d'erreur ; la command assemble l'union (`type UpsertAxeError = AxeUtiliseError | NiveauPorteModalitesError`). Le nom dit la règle (`checkNombreNiveauxModifiable`, `checkCleApiRevocable`) ; `ensure` reste réservé aux gardes qui lèvent une 403. Le commentaire qui explique le « pourquoi » de la règle se place au-dessus d'elle.
Pourquoi : une règle se lit, se teste et se réutilise sans base ; `rules.ts` est le catalogue des règles du module.
- À faire :
  ```ts
  export type AxeUtiliseError = { type: 'AXE_UTILISE'; indicateurs: string[] }

  // Un indicateur qui déclare l'axe calcule ses totaux sur ses niveaux : en
  // ajouter ou en retirer changerait ses résultats. Renommer reste permis.
  export const checkNombreNiveauxModifiable = ({ nombreNiveauxActuel, nombreNiveauxCible, indicateursDeclarants }: {
    nombreNiveauxActuel: number | null
    nombreNiveauxCible: number
    indicateursDeclarants: string[]
  }): Result<void, AxeUtiliseError> => {
    if (nombreNiveauxActuel === null) return ok()
    if (nombreNiveauxActuel === nombreNiveauxCible) return ok()
    if (indicateursDeclarants.length === 0) return ok()
    return err({ type: 'AXE_UTILISE', indicateurs: indicateursDeclarants })
  }
  ```

### Une règle s'écrit avec des `if` et des retours anticipés
Une condition par `if`, un `return` par cas, `return ok()` en dernier.
Pourquoi : chaque cas de la règle se lit sur sa ligne.
- À éviter : un ternaire ou des conditions enchaînées par `&&` / `||` pour décider entre `ok` et `err`.

### Une règle importée d'un autre module vient du module qui possède le concept
Pas de dossier `rules/` transverse : le rattachement d'un individu vit dans `individu/rules.ts`, et `valeurAvancement` l'importe.

### Une règle porte sur un élément ; un lot l'applique item par item
La même règle sert à l'écriture unitaire et au lot ; seul le chargement change. Le chargeur d'un lot charge tout en un nombre fixe de requêtes (`Map` par publicId, `Set` des ids liés), la command applique la règle à chaque item, puis un helper de `batchErrors.ts` regroupe les erreurs avec leurs indices.
- À faire : `checkIndividuRattache` (`individu/rules.ts`), appelé par `resolveCelluleForWrite` et par `upsertValeursAvancementBatch` sur le même chargeur `loadIndividusContext`.

### Une command : gardes, chargement, règles, écriture
`perform…` enchaîne quatre étapes :
1. **Gardes** : `ensureAdmin()`, `ensure{Ressource}{Action}Permission(...)`, `ensureAuteur(...)` (403). Une garde qui porte sur un objet chargé (`ensureAuteur({ createdBy })`) se place juste après son chargement, avant les règles.
2. **Chargement** : `load…Context(...)`, qui ne renvoie jamais d'`err` (404 par `findUniqueOrThrow`).
3. **Règles** : `const x = checkY(...); if (x.isErr()) return err(x.error)`, une règle après l'autre.
4. **Écritures** : elles réutilisent le contexte chargé, sans relire ce qu'il contient.

Le chargeur est privé dans le fichier de la command ; il devient un fichier du module dès que deux commands le partagent. Il charge ce dont les règles et l'écriture ont besoin ; une requête de plus (`count`, `EXISTS`) vaut mieux qu'un chargement qui dépend des cas de la règle.
Pourquoi : la command se lit comme un script dont chaque étape porte un nom ; les règles qu'elle applique se lisent dans l'ordre.
- À faire :
  ```ts
  const performUpsert = async ({ publicId, body }: UpsertAxeParams): Promise<Result<void, UpsertAxeError>> => {
    ensureAdmin()

    const context = await loadUpsertAxeContext({ publicId })
    const nombreNiveauxCible = body.niveaux.length

    const modifiable = checkNombreNiveauxModifiable({
      nombreNiveauxActuel: context.axe?.niveaux.length ?? null,
      nombreNiveauxCible,
      indicateursDeclarants: context.indicateursDeclarants,
    })
    if (modifiable.isErr()) return err(modifiable.error)

    const supprimables = checkNiveauxSupprimables({
      nombreNiveauxCible,
      ordresPorteursDeModalites: context.ordresPorteursDeModalites,
    })
    if (supprimables.isErr()) return err(supprimables.error)

    await saveAxe({ publicId, body, axeExistant: context.axe })
    return ok()
  }
  ```

### Les gardes d'accès lèvent une 403, sans `Result`
`ensureAdmin()`, `ensureAdminOrOidcUser()` et `ensureAuteur({ createdBy, message })` vivent dans `framework/auth/principalPredicates.ts`, avec leur message ; pas de constante `MESSAGE_ADMIN` par module. Les gardes sur une ressource (`ensureIndicateurWriteDataPermission`) vivent dans `<module>/permissions.ts`, une seule fois par action.
Pourquoi : une décision d'accès (qui a le droit, avec quel passe-droit) se prend à un seul endroit.
- À éviter : `ensurePrincipal(isApiKeyAdmin, '…')` recopié dans chaque command, une vérification de permission réécrite dans une command (`assertWritePermission`).

### Remplacer une liste de liaisons passe par `diff`
`const { toAdd, toRemove } = diff(cibles, existantes)` (`framework/collections/diff.ts`), puis un `deleteMany` sur `toRemove` et un `createMany` sur `toAdd`. Pas de helper générique au-dessus des délégués Prisma.

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

### Les cas d'une règle se testent dans `rules.test.ts`
Les cas limites d'une règle se testent en unitaire, sans base ni `integrationTest` (`describe.concurrent`, assertions sur `_unsafeUnwrapErr()`). Le test de la command vérifie seulement qu'elle applique chaque règle : un cas par `err`.
Pourquoi : la combinatoire d'une règle coûte peu en unitaire ; le test en base ne couvre que le câblage.

### `describe.concurrent` + `integrationTest`
Chaque `it` est enveloppé dans `integrationTest(async () => ...)` (transaction annulée en fin de test), et le `describe` est `concurrent`. Noms de tests en français (« renvoie… », « rejette… »).
- À faire : `src/axe/queries/getAxeByPublicId.test.ts`

### Données de test : fixtures, ids de test, valeurs en dur
`fixtures.<entity>(...)` (variadique, upsert sur la clé naturelle, défauts en dur, pas de compteur) plutôt que `db().x.create`. Ids publics via `@/test/randomIds` (`testAxeId()`, `const [ind1, ind2] = testIndicateurIds(2)` quand il en faut plusieurs). UUID internes via `uuidv7`, jamais `randomUUID`. Le reste en dur (`nom: 'Indicateur de test'`).
Pourquoi : chaque test est isolé par sa transaction ; des valeurs explicites rendent les assertions lisibles.
- Nouvelle entité testable : ajouter sa fonction dans `src/test/fixtures.ts` sur le même modèle.

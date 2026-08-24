# Génération serveur du `publicId` d'indicateur

Date : 2026-07-01
Branche : `chore/retirer-restriction-regex-public-ids`

## Contexte

Aujourd'hui le `publicId` d'un indicateur (`IND-XXX`) est **choisi par le client** :
l'endpoint unique `PUT /indicateurs/{id}` fait un upsert où `id` (= `publicId`) vient
de l'URL. La création et la mise à jour partagent ce chemin. Le seul identifiant
généré côté serveur est la clé primaire interne (`uuidv7()`).

La PR en cours avait libéralisé le format du `publicId`. On **inverse la décision** :
le `publicId` redevient strictement `IND-<n>`, n'est plus fourni par le client, et
est **généré par le serveur** en incrémentant le dernier numéro existant.

## Objectif

1. Restaurer le format `indicateurPublicIdSchema = /^IND-\d+$/`.
2. Le client ne fournit **jamais** le `publicId` à la création.
3. Le serveur génère `IND-<max+1>` (entier brut, sans zéro-padding).

## Décisions validées

| Sujet | Décision |
|-------|----------|
| Forme d'API | `POST /indicateurs` crée ; `PUT /indicateurs/{id}` devient update-only (404 si absent) |
| Concurrence | Verrou consultatif Postgres `pg_advisory_xact_lock(<clé fixe>)` en tête de création, puis `max(numéro)+1`. Sérialise les créations concurrentes ; relâché au commit/rollback de la transaction. Choisi plutôt que le retry car il colle au modèle command/route (command sur `db()` ambiant) et reste testable sous `integrationTest`. |
| Format du numéro | Entier brut : `IND-51` (pas de padding). Les seeds `IND-001..IND-050` restent valides ; le premier généré sera `IND-51`. |

## Architecture

### 1. Schéma partagé (`packages/mb-shared/src/publicIds.ts`)

Restaurer :

```ts
export const indicateurPublicIdSchema = z
  .string()
  .regex(/^IND-\d+$/, 'Identifiant public attendu au format IND-XXX')
  .describe("Identifiant public de l'indicateur (format IND-XXX).")
```

`panierPublicIdSchema` / `referentielPublicIdSchema` / `individuPublicIdSchema` /
`widgetPublicIdSchema` : **inchangés**.

Le body d'écriture (`upsertIndicateurBodySchema`, `packages/mb-shared/src/indicateur.ts`)
ne contient déjà pas d'`id` → aucun changement de champ. Renommage optionnel
`upsertIndicateurBodySchema` → `indicateurBodySchema` (le terme « upsert » n'est plus
exact) ; à trancher en implémentation pour limiter le churn. Réutilisé tel quel pour
POST et PUT.

### 2. Génération de l'identifiant (`apps/mb-api`)

Nouvelle fonction (ex. `generateIndicateurPublicId`), exécutée dans la transaction
ouverte par la route :

1. Verrou consultatif transaction-level pour sérialiser les créations concurrentes :

```ts
await db().$executeRaw`SELECT pg_advisory_xact_lock(${INDICATEUR_NUMBERING_LOCK})`
```

où `INDICATEUR_NUMBERING_LOCK` est une constante `bigint` fixe (clé arbitraire dédiée
à la numérotation des indicateurs). Le verrou est relâché automatiquement au
commit/rollback de la transaction.

2. Calcul du prochain numéro :

```sql
SELECT COALESCE(MAX(CAST(SUBSTRING(public_id FROM 5) AS INTEGER)), 0) AS max
FROM indicateur
WHERE public_id ~ '^IND-[0-9]+$';
```

via `db().$queryRaw` (Prisma). `next = max + 1`, `publicId = 'IND-' + next`.
Le filtre `~ '^IND-[0-9]+$'` ignore d'éventuels ids legacy non conformes.

### 3. Command : scinder `upsertIndicateur`

`apps/mb-api/src/indicateur/commands/upsertIndicateur.ts` est scindé :

- **`createIndicateur(body): ResultAsync<string /* publicId */, …>`**
  (utilise le `db()` ambiant ; la transaction est ouverte par la route)
  - `ensureApiKeyAdmin()` + `requireCurrentPrincipalId()`
  - `resoudreConfigurationsReferentiels(body.referentiels)` (throw `ValidationError`
    `unknownReferentielIds` si référentiel inconnu)
  - `publicId = await generateIndicateurPublicId()` (verrou consultatif + `MAX+1`)
  - `db().indicateur.create({ data: { id: uuidv7(), publicId, … } })`
  - `grantOwnerPermissions(principalId, indicateurId)`
  - `createMany` des configurations référentiels
  - Retourne le `publicId` généré.
- **`updateIndicateur(publicId, body): ResultAsync<void, …>`**
  - Reprend `updateIndicateurExistant`. Si `findUnique({ where: { publicId } })` est
    `null` → throw `NotFoundError` (→ 404). Sinon `assertWritePermission` + `update`
    + `remplacerConfigurationsReferentiels` (inchangé).

Les helpers existants (`resoudreConfigurationsReferentiels`,
`remplacerConfigurationsReferentiels`, `grantOwnerPermissions`, `metadonneesData`,
`assertWritePermission`) sont **conservés et réutilisés**.

### 4. Routes (`apps/mb-api/src/indicateur/routes.ts`)

- **`POST /indicateurs`** (nouveau, tags `Indicateur`+`Admin`) :
  - `request.body` = `UpsertIndicateurBodySchema`, pas de param `id`.
  - Handler : `withTransaction(async () => { const publicId = await createIndicateur(body); return getIndicateurByPublicId(publicId) })` ; réponse `200` (modèle créé). Le
    `withTransaction` est indispensable : le verrou consultatif de `createIndicateur`
    doit être pris dans une transaction.
  - Réponses : `200`, `400` (validation / référentiels inconnus), `403`.
- **`PUT /indicateurs/{id}`** devient update-only :
  - Handler : `updateIndicateur(id, body)` puis `getIndicateurByPublicId(id)`.
  - Réponses : `200`, `400`, `403`, **`404`** (ajout — indicateur inexistant).
  - La description OpenAPI est mise à jour (« met à jour » au lieu de « crée ou remplace »).

### 5. mb-admin (front)

- `apps/mb-admin/src/api/indicateurs.ts` : remplacer `upsertIndicateur(id, body)` par
  - `createIndicateur(body): POST 'indicateurs'`
  - `updateIndicateur(id, body): PUT 'indicateurs/${id}'`
- `apps/mb-admin/src/routes/_authed/indicateurs/nouveau.tsx` (création) : appelle
  `createIndicateur(body)` ; après succès, redirige vers l'id renvoyé.
- `apps/mb-admin/src/routes/_authed/indicateurs/$id.tsx` (édition) : appelle
  `updateIndicateur(id, body)`.
- `apps/mb-admin/src/components/IndicateurForm.tsx` :
  - En mode `create`, **retirer le champ Identifiant** (plus saisi par l'utilisateur).
  - `IndicateurFormValues` : `id` n'est plus requis à la création (conservé pour
    l'affichage read-only en mode `edit`).
  - `canSubmit` : supprimer la condition
    `mode === 'edit' || indicateurPublicIdSchema.safeParse(values.id).success`
    (l'id n'est plus une saisie). La validation référentiel via
    `referentielPublicIdSchema.safeParse` **reste**.
  - `ReferentielForm.tsx` : inchangé (dédup regex conservée).

## Gestion d'erreurs

- Référentiel inconnu à la création/update → `400 VALIDATION_ERROR` +
  `details.unknownReferentielIds` (comportement existant conservé).
- `PUT` sur indicateur inexistant → `404 ENTITY_NOT_FOUND` (nouveau), via
  `findUniqueOrThrow` (Prisma `P2025` mappé en 404 par l'errorHandler global).
- Concurrence des créations → sérialisée par le verrou consultatif ; pas de collision
  de `publicId` possible, donc pas de gestion d'erreur `P2002` nécessaire.

## Tests

- **`apps/mb-api/src/indicateur/commands/upsertIndicateur.test.ts`** (15 cas) : réécrit
  pour `createIndicateur` (sans publicId d'entrée ; on lit l'id généré via
  `result` / `getIndicateurByPublicId`) et `updateIndicateur`. Nouveaux cas :
  - `createIndicateur` génère `IND-<max+1>` (incrément sur données existantes).
  - Deux créations successives → numéros consécutifs.
  - `updateIndicateur` sur id inexistant → `NotFoundError`.
- **Test de génération** : `max+1` sur base vide (→ `IND-1`) et avec seeds
  (`IND-050` → `IND-51`).
- **Routes** : si des tests HTTP existent pour `PUT /indicateurs/{id}`, ajouter la
  couverture `POST /indicateurs` + `404` sur PUT inexistant.
- Le verrou consultatif est transparent pour les tests (créations séquentielles sous
  `integrationTest`) ; la sérialisation concurrente réelle n'est pas testée
  unitairement (documentée).

## Hors périmètre

- `seed.ts:463` (`parseInt(publicId.replace('IND-',''))`) reste valide (format numérique
  restauré).
- Pas de migration Postgres (pas de séquence dédiée).
- PAN- / REF- / WID- inchangés.

## Impact sur la PR en cours

La PR #2243 (libéralisation du format) est **annulée** par ce design pour la partie
`indicateurPublicIdSchema`. À décider : réécrire la branche vers ce nouveau
comportement (le commit de dédup des regex mb-admin reste pertinent).

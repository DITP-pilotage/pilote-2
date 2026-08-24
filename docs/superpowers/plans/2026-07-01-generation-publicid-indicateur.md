# Génération serveur du `publicId` indicateur — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Le `publicId` d'un indicateur (`IND-<n>`) est généré par le serveur (dernier numéro + 1) au lieu d'être fourni par le client ; la création passe par `POST /indicateurs` et l'update par `PUT /indicateurs/{id}`.

**Architecture:** On restaure le format strict `IND-\d+`, on scinde la command `upsertIndicateur` en `createIndicateur` (génère l'id via verrou consultatif + `MAX+1`) et `updateIndicateur` (404 si absent), on ajoute la route `POST /indicateurs`, et on adapte mb-admin (api split + form sans champ Identifiant).

**Tech Stack:** TypeScript, Hono + `@hono/zod-openapi`, Prisma (Postgres), neverthrow, Zod, Vitest (integration tests en transaction rollback), React + TanStack Query/Router (mb-admin).

## Global Constraints

- Package manager : **pnpm** (jamais npm).
- Verbes/tech en anglais, noms d'entités en français (ex. `createIndicateur`, `generateIndicateurPublicId`).
- Commands mb-api : utilisent le `db()` **ambiant** ; la transaction est ouverte par la route (`withTransaction`).
- Tests d'intégration : `integrationTest(async () => {...})` enveloppe chaque test dans une transaction qui **rollback** ; utiliser `fixtures.*`, `runAsAdmin`, `db()`.
- Format généré : **entier brut** `IND-<n>` (pas de zéro-padding).
- Ne pas ajouter de `Co-Authored-By` dans les commits. Lancer le lint avant de commit.
- `panierPublicIdSchema` / `referentielPublicIdSchema` / `individuPublicIdSchema` / `widgetPublicIdSchema` : **inchangés**.

## File Structure

- `packages/mb-shared/src/publicIds.ts` — restaure `indicateurPublicIdSchema`.
- `apps/mb-api/src/indicateur/commands/generateIndicateurPublicId.ts` — **créé** : verrou consultatif + `MAX+1`.
- `apps/mb-api/src/indicateur/commands/generateIndicateurPublicId.test.ts` — **créé**.
- `apps/mb-api/src/indicateur/commands/upsertIndicateur.ts` — **renommé/refondu** en `writeIndicateur.ts` exportant `createIndicateur` + `updateIndicateur`.
- `apps/mb-api/src/indicateur/commands/upsertIndicateur.test.ts` — **renommé/refondu** en `writeIndicateur.test.ts`.
- `apps/mb-api/src/indicateur/routes.ts` — ajoute `POST /indicateurs`, PUT update-only + 404.
- `apps/mb-admin/src/api/indicateurs.ts` — `createIndicateur` + `updateIndicateur`.
- `apps/mb-admin/src/components/IndicateurForm.tsx` — retire le champ Identifiant en création.
- `apps/mb-admin/src/routes/_authed/indicateurs/nouveau.tsx` — appelle `createIndicateur`.
- `apps/mb-admin/src/routes/_authed/indicateurs/$id.tsx` — appelle `updateIndicateur`.

---

### Task 1: Restaurer le schéma `indicateurPublicIdSchema`

**Files:**
- Modify: `packages/mb-shared/src/publicIds.ts:3-11`

**Interfaces:**
- Produces: `indicateurPublicIdSchema` (ZodString, `/^IND-\d+$/`) — inchangé de signature, resserre juste la validation.

- [ ] **Step 1: Restaurer la regex**

Remplacer le bloc `indicateurPublicIdSchema` actuel par :

```ts
export const indicateurPublicIdSchema = z
  .string()
  .regex(/^IND-\d+$/, 'Identifiant public attendu au format IND-XXX')
  .describe("Identifiant public de l'indicateur (format IND-XXX).")
```

- [ ] **Step 2: Vérifier le typecheck des conscommateurs**

Run: `pnpm -F @pilote/mb-admin lint`
Expected: PASS (eslint + `tsc --noEmit` + prettier) — aucune régression de type.

- [ ] **Step 3: Commit**

```bash
git add packages/mb-shared/src/publicIds.ts
git commit -m "revert(mb-shared): restaurer indicateurPublicIdSchema au format IND-<n>"
```

---

### Task 2: Générateur `generateIndicateurPublicId`

Génère `IND-<max+1>` en sérialisant les créations concurrentes via un verrou consultatif transaction-level.

**Files:**
- Create: `apps/mb-api/src/indicateur/commands/generateIndicateurPublicId.ts`
- Test: `apps/mb-api/src/indicateur/commands/generateIndicateurPublicId.test.ts`

**Interfaces:**
- Consumes: `db()` (ambiant), `Prisma.sql` tag via `db().$queryRaw` / `db().$executeRaw`.
- Produces: `generateIndicateurPublicId(): Promise<string>` — retourne un `publicId` `IND-<n>`.

- [ ] **Step 1: Écrire les tests (échouants)**

Créer `apps/mb-api/src/indicateur/commands/generateIndicateurPublicId.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { generateIndicateurPublicId } from '@/indicateur/commands/generateIndicateurPublicId'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

describe('generateIndicateurPublicId', () => {
  it(
    'retourne IND-<max+1> à partir du plus grand numéro existant',
    integrationTest(async () => {
      await fixtures.indicateur({ publicId: 'IND-900001' })

      const publicId = await generateIndicateurPublicId()

      expect(publicId).toBe('IND-900002')
    }),
  )

  it(
    'ignore les publicId non numériques pour le calcul du max',
    integrationTest(async () => {
      await fixtures.indicateur({ publicId: 'IND-900001' })
      await fixtures.indicateur({ publicId: 'IND-ZZZ' })

      const publicId = await generateIndicateurPublicId()

      expect(publicId).toBe('IND-900002')
    }),
  )

  it(
    'deux appels successifs (après persistance) donnent des numéros consécutifs',
    integrationTest(async () => {
      await fixtures.indicateur({ publicId: 'IND-900001' })

      const premier = await generateIndicateurPublicId()
      await fixtures.indicateur({ publicId: premier })
      const second = await generateIndicateurPublicId()

      expect(premier).toBe('IND-900002')
      expect(second).toBe('IND-900003')
    }),
  )
})
```

- [ ] **Step 2: Lancer les tests pour vérifier l'échec**

Run: `pnpm -F @pilote/mb-api test -- generateIndicateurPublicId`
Expected: FAIL — `Cannot find module '.../generateIndicateurPublicId'`.

- [ ] **Step 3: Implémenter le générateur**

Créer `apps/mb-api/src/indicateur/commands/generateIndicateurPublicId.ts` :

```ts
import { db } from '@/framework/persistence/dbStore'

// Clé arbitraire, dédiée à la numérotation des indicateurs, pour
// pg_advisory_xact_lock (sérialise les créations concurrentes). Le verrou est
// relâché automatiquement au commit/rollback de la transaction courante.
const INDICATEUR_NUMBERING_LOCK = 4815162342n

export const generateIndicateurPublicId = async (): Promise<string> => {
  await db().$executeRaw`SELECT pg_advisory_xact_lock(${INDICATEUR_NUMBERING_LOCK})`
  const rows = await db().$queryRaw<{ max: number }[]>`
    SELECT COALESCE(MAX(CAST(SUBSTRING(public_id FROM 5) AS INTEGER)), 0) AS max
    FROM indicateur
    WHERE public_id ~ '^IND-[0-9]+$'
  `
  const max = Number(rows[0]?.max ?? 0)
  return `IND-${max + 1}`
}
```

Note : `SUBSTRING(public_id FROM 5)` retire le préfixe `IND-` (4 caractères). Le filtre `~ '^IND-[0-9]+$'` garantit que seuls les ids numériques entrent dans le `CAST`.

- [ ] **Step 4: Lancer les tests pour vérifier le succès**

Run: `pnpm -F @pilote/mb-api test -- generateIndicateurPublicId`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/mb-api/src/indicateur/commands/generateIndicateurPublicId.ts apps/mb-api/src/indicateur/commands/generateIndicateurPublicId.test.ts
git commit -m "feat(mb-api): générateur de publicId indicateur (IND-<max+1>, verrou consultatif)"
```

---

### Task 3: Scinder la command en `createIndicateur` + `updateIndicateur`

Renomme `upsertIndicateur.ts` → `writeIndicateur.ts`. `createIndicateur` génère le `publicId` (ne le reçoit plus). `updateIndicateur` renvoie 404 (via `findUniqueOrThrow`) si l'indicateur n'existe pas.

**Files:**
- Create: `apps/mb-api/src/indicateur/commands/writeIndicateur.ts` (contenu repris de `upsertIndicateur.ts`)
- Delete: `apps/mb-api/src/indicateur/commands/upsertIndicateur.ts`
- Create: `apps/mb-api/src/indicateur/commands/writeIndicateur.test.ts` (repris de `upsertIndicateur.test.ts`)
- Delete: `apps/mb-api/src/indicateur/commands/upsertIndicateur.test.ts`

**Interfaces:**
- Consumes: `generateIndicateurPublicId()` (Task 2) ; helpers existants conservés (`resoudreConfigurationsReferentiels`, `remplacerConfigurationsReferentiels`, `grantOwnerPermissions`, `metadonneesData`, `assertWritePermission`).
- Produces:
  - `createIndicateur(body: UpsertIndicateurBody): ResultAsync<string, never>` — retourne le `publicId` généré.
  - `updateIndicateur(publicId: string, body: UpsertIndicateurBody): ResultAsync<void, never>` — 404 (P2025) si absent.

- [ ] **Step 1: Copier le fichier command sous le nouveau nom**

```bash
git mv apps/mb-api/src/indicateur/commands/upsertIndicateur.ts apps/mb-api/src/indicateur/commands/writeIndicateur.ts
git mv apps/mb-api/src/indicateur/commands/upsertIndicateur.test.ts apps/mb-api/src/indicateur/commands/writeIndicateur.test.ts
```

- [ ] **Step 2: Écrire les tests refondus (échouants)**

Dans `writeIndicateur.test.ts`, remplacer l'import et adapter les cas. Import :

```ts
import { createIndicateur, updateIndicateur } from '@/indicateur/commands/writeIndicateur'
```

Cas de création (remplacent les `upsertIndicateur(indId, …)` de création) — on ne passe plus de publicId, on lit l'id renvoyé :

```ts
it(
  'crée un indicateur avec ses référentiels configurés et auto-grant READ+WRITE au créateur',
  integrationTest(async () => {
    const refCreateA = testReferentielId()
    const refCreateB = testReferentielId()
    const apiKey = await fixtures.apiKey()
    const refA = await fixtures.referentiel({ publicId: refCreateA })
    const refB = await fixtures.referentiel({ publicId: refCreateB })

    const result = await runAsAdmin(apiKey.id, () =>
      createIndicateur({
        nom: 'Nouvel indicateur',
        visibilite: 'PRIVE',
        unite: null,
        ...METADONNEES_VIDES,
        referentiels: [
          { id: refA.publicId, fonctionAgregation: 'SUM' },
          { id: refB.publicId, fonctionAgregation: 'NONE' },
        ],
      }),
    )

    expect(result.isOk()).toBe(true)
    const publicId = result._unsafeUnwrap()
    expect(publicId).toMatch(/^IND-\d+$/)

    const configurationsTriees = [
      { id: refCreateA, fonctionAgregation: 'SUM' as const },
      { id: refCreateB, fonctionAgregation: 'NONE' as const },
    ].sort((a, b) => a.id.localeCompare(b.id))
    expect(await getConfigurationsReferentiels(publicId)).toEqual(configurationsTriees)
  }),
)

it(
  'génère un publicId IND-<max+1>',
  integrationTest(async () => {
    await fixtures.indicateur({ publicId: 'IND-900001' })
    const apiKey = await fixtures.apiKey()

    const result = await runAsAdmin(apiKey.id, () =>
      createIndicateur({
        nom: 'Indicateur numéroté',
        visibilite: 'PRIVE',
        unite: null,
        ...METADONNEES_VIDES,
        referentiels: [],
      }),
    )

    expect(result._unsafeUnwrap()).toBe('IND-900002')
  }),
)
```

Cas update (l'ancien « met à jour le nom d'un indicateur existant ») — on crée d'abord une fixture puis on update :

```ts
it(
  'met à jour un indicateur existant',
  integrationTest(async () => {
    const apiKey = await fixtures.apiKey()
    const principalId = apiKey.id
    const existant = await fixtures.indicateur({ publicId: 'IND-900500', nom: 'Ancien nom' })
    await db().indicateurPermission.createMany({
      data: [
        { principalId, indicateurId: existant.id, action: 'WRITE' },
        { principalId, indicateurId: existant.id, action: 'READ' },
      ],
    })

    const result = await runAsAdmin(apiKey.id, () =>
      updateIndicateur('IND-900500', {
        nom: 'Nouveau nom',
        visibilite: 'PUBLIC',
        unite: null,
        ...METADONNEES_VIDES,
        referentiels: [],
      }),
    )

    expect(result.isOk()).toBe(true)
    const maj = await db().indicateur.findUniqueOrThrow({ where: { publicId: 'IND-900500' } })
    expect(maj.nom).toBe('Nouveau nom')
  }),
)

it(
  'échoue en 404 (P2025) si l’indicateur à mettre à jour n’existe pas',
  integrationTest(async () => {
    const apiKey = await fixtures.apiKey()

    await expect(
      runAsAdmin(apiKey.id, () =>
        updateIndicateur('IND-909090', {
          nom: 'Peu importe',
          visibilite: 'PRIVE',
          unite: null,
          ...METADONNEES_VIDES,
          referentiels: [],
        }),
      ),
    ).rejects.toMatchObject({ code: 'P2025' })
  }),
)
```

**Porter les cas restants** de l'ancien fichier en suivant ce schéma : tout `upsertIndicateur(indId, body)` qui **créait** → `createIndicateur(body)` + lire `result._unsafeUnwrap()` comme publicId ; tout cas qui **mettait à jour** ou testait une permission sur un indicateur existant → fixture `fixtures.indicateur({ publicId: 'IND-9005xx' })` (+ grant si besoin) puis `updateIndicateur(publicId, body)`. Les assertions de configuration référentiel (`getConfigurationsReferentiels`) et de permissions restent identiques. Supprimer l'import `testIndicateurId` s'il n'est plus utilisé.

- [ ] **Step 3: Lancer les tests pour vérifier l'échec**

Run: `pnpm -F @pilote/mb-api test -- writeIndicateur`
Expected: FAIL — `createIndicateur` / `updateIndicateur` non exportés.

- [ ] **Step 4: Refondre la command**

Dans `writeIndicateur.ts` :

1. Ajouter l'import du générateur :

```ts
import { generateIndicateurPublicId } from '@/indicateur/commands/generateIndicateurPublicId'
```

2. Modifier `createIndicateurAvecGrants` pour générer le publicId et le retourner, et supprimer le paramètre `publicId` :

```ts
const createIndicateurAvecGrants = async (
  body: UpsertIndicateurBody,
  principalId: string,
): Promise<string> => {
  const configurations = await resoudreConfigurationsReferentiels(body.referentiels)
  const publicId = await generateIndicateurPublicId()
  const indicateurId = uuidv7()
  await db().indicateur.create({
    data: {
      id: indicateurId,
      publicId,
      nom: body.nom,
      visibilite: body.visibilite,
      unite: body.unite,
      ...metadonneesData(body),
    },
  })
  await grantOwnerPermissions(principalId, indicateurId)
  if (configurations.length > 0) {
    await db().indicateurReferentiel.createMany({
      data: configurations.map((configuration) => ({
        indicateurId,
        referentielId: configuration.referentielId,
        fonctionAgregation: configuration.fonctionAgregation,
      })),
    })
  }
  return publicId
}
```

3. Modifier `updateIndicateurExistant` pour ne plus recevoir l'`indicateurId` par param mais le résoudre via `findUniqueOrThrow` (404 si absent) :

```ts
const updateIndicateurExistant = async (
  publicId: string,
  body: UpsertIndicateurBody,
  principalId: string,
): Promise<void> => {
  const existant = await db().indicateur.findUniqueOrThrow({ where: { publicId } })
  await assertWritePermission(existant.id, principalId)
  const configurations = await resoudreConfigurationsReferentiels(body.referentiels)
  await db().indicateur.update({
    where: { publicId },
    data: {
      nom: body.nom,
      visibilite: body.visibilite,
      unite: body.unite,
      ...metadonneesData(body),
    },
  })
  await remplacerConfigurationsReferentiels(existant.id, configurations)
}
```

4. Remplacer `performUpsert` + l'export `upsertIndicateur` par deux fonctions dédiées :

```ts
const performCreate = async (body: UpsertIndicateurBody): Promise<string> => {
  ensureApiKeyAdmin()
  const principalId = requireCurrentPrincipalId()
  return createIndicateurAvecGrants(body, principalId)
}

const performUpdate = async (publicId: string, body: UpsertIndicateurBody): Promise<void> => {
  ensureApiKeyAdmin()
  const principalId = requireCurrentPrincipalId()
  await updateIndicateurExistant(publicId, body, principalId)
}

export const createIndicateur = (body: UpsertIndicateurBody): ResultAsync<string, never> =>
  ResultAsync.fromSafePromise(performCreate(body))

export const updateIndicateur = (
  publicId: string,
  body: UpsertIndicateurBody,
): ResultAsync<void, never> => ResultAsync.fromSafePromise(performUpdate(publicId, body))
```

Supprimer l'ancienne fonction `performUpsert` et l'export `upsertIndicateur`.

- [ ] **Step 5: Lancer les tests pour vérifier le succès**

Run: `pnpm -F @pilote/mb-api test -- writeIndicateur`
Expected: PASS (tous les cas portés).

- [ ] **Step 6: Commit**

```bash
git add apps/mb-api/src/indicateur/commands/
git commit -m "refactor(mb-api): scinder upsertIndicateur en createIndicateur/updateIndicateur"
```

---

### Task 4: Routes — `POST /indicateurs` (create) + `PUT` update-only

**Files:**
- Modify: `apps/mb-api/src/indicateur/routes.ts`

**Interfaces:**
- Consumes: `createIndicateur`, `updateIndicateur` (Task 3), `getIndicateurByPublicId`, `withTransaction`, `UpsertIndicateurBodySchema`, `erreur404`.

- [ ] **Step 1: Remplacer l'import de la command**

Remplacer :

```ts
import { upsertIndicateur } from '@/indicateur/commands/upsertIndicateur'
```

par :

```ts
import { createIndicateur, updateIndicateur } from '@/indicateur/commands/writeIndicateur'
```

- [ ] **Step 2: Ajouter la route `POST /indicateurs`**

Après `getIndicateursRoute` (avant/à côté des autres), ajouter :

```ts
const createIndicateurRoute = createRoute({
  method: 'post',
  path: '/indicateurs',
  tags: ['Indicateur', 'Admin'],
  summary: 'Créer un indicateur (identifiant public généré par le serveur)',
  description:
    "Réservé aux clés API de rôle `ADMIN` (les utilisateurs OIDC authentifiés restent autorisés). Crée un indicateur ; l'identifiant public (`IND-<n>`) est généré côté serveur (dernier numéro + 1). Le champ `referentiels` applique la sémantique replace-all. Si un `referentielId` n'existe pas, 400 `VALIDATION_ERROR` + `details.unknownReferentielIds`. L'opération est atomique.",
  middleware: [requireAuthentication],
  request: {
    body: {
      content: { 'application/json': { schema: UpsertIndicateurBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: IndicateurApiModelSchema } },
      description: 'Indicateur créé',
    },
    400: erreur400,
    403: erreur403,
  },
})
```

- [ ] **Step 3: Enregistrer le handler POST**

```ts
indicateurRoutes.openapi(createIndicateurRoute, async (context) => {
  const body = context.req.valid('json')

  const result = await withTransaction(async () => {
    const publicId = await createIndicateur(body).unwrapOr('')
    return getIndicateurByPublicId(publicId)
  })

  return result.match(
    (data) =>
      jsonResponseOk({ context, data, schema: IndicateurApiModelSchema, status: 200 }),
    never,
  )
})
```

Note : `createIndicateur(...)` est un `ResultAsync<string, never>` ; `await createIndicateur(body)` renvoie un `Result`. Utiliser :

```ts
const result = await withTransaction(async () => {
  const publicId = (await createIndicateur(body))._unsafeUnwrap()
  return getIndicateurByPublicId(publicId)
})
```

(le canal d'erreur est `never` : les erreurs métier — validation, forbidden — sont levées en exception et interceptées par l'errorHandler global, comme pour l'upsert actuel).

- [ ] **Step 4: Passer `PUT /indicateurs/{id}` en update-only**

Modifier le handler `upsertIndicateurRoute` existant :

```ts
indicateurRoutes.openapi(upsertIndicateurRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')

  const result = await withTransaction(async () => {
    ;(await updateIndicateur(id, body))._unsafeUnwrap()
    return getIndicateurByPublicId(id)
  })

  return result.match(
    (data) =>
      jsonResponseOk({ context, data, schema: IndicateurApiModelSchema, status: 200 }),
    never,
  )
})
```

Ajouter `404: erreur404` dans les `responses` de `upsertIndicateurRoute`, et mettre à jour son `summary`/`description` :

```ts
  summary: 'Mettre à jour un indicateur (nom + référentiels liés)',
  description:
    "Réservé aux clés API de rôle `ADMIN` (les utilisateurs OIDC authentifiés restent autorisés). Met à jour le `nom`, la visibilité, l'unité, les métadonnées et les référentiels liés (replace-all). Renvoie 404 (`ENTITY_NOT_FOUND`) si l'indicateur n'existe pas. L'opération est atomique.",
```

et dans `responses` :

```ts
    400: erreur400,
    403: erreur403,
    404: erreur404,
```

- [ ] **Step 5: Vérifier la compilation + les tests mb-api**

Run: `pnpm -F @pilote/mb-api test`
Expected: PASS (aucune régression ; le build TS des routes compile).

- [ ] **Step 6: Commit**

```bash
git add apps/mb-api/src/indicateur/routes.ts
git commit -m "feat(mb-api): POST /indicateurs (id généré) et PUT update-only (404 si absent)"
```

---

### Task 5: mb-admin — api split + form sans champ Identifiant

**Files:**
- Modify: `apps/mb-admin/src/api/indicateurs.ts:30-36`
- Modify: `apps/mb-admin/src/components/IndicateurForm.tsx`
- Modify: `apps/mb-admin/src/routes/_authed/indicateurs/nouveau.tsx:5,26-33`
- Modify: `apps/mb-admin/src/routes/_authed/indicateurs/$id.tsx:5,31-38`

**Interfaces:**
- Produces: `createIndicateur(body): Promise<IndicateurApiModel>`, `updateIndicateur(id, body): Promise<IndicateurApiModel>`.

- [ ] **Step 1: Scinder l'appel API**

Dans `apps/mb-admin/src/api/indicateurs.ts`, remplacer `upsertIndicateur` par :

```ts
export const createIndicateur = async (body: UpsertIndicateurBody): Promise<IndicateurApiModel> => {
  const json = await bffClient.post('indicateurs', { json: body }).json()
  return indicateurApiModelSchema.parse(json)
}

export const updateIndicateur = async (
  id: string,
  body: UpsertIndicateurBody,
): Promise<IndicateurApiModel> => {
  const json = await bffClient.put(`indicateurs/${id}`, { json: body }).json()
  return indicateurApiModelSchema.parse(json)
}
```

- [ ] **Step 2: Retirer le champ Identifiant en création (IndicateurForm)**

Dans `apps/mb-admin/src/components/IndicateurForm.tsx` :

- Supprimer l'import devenu inutile `indicateurPublicIdSchema` (garder `referentielPublicIdSchema`) :

```ts
import { referentielPublicIdSchema } from '@pilote/mb-shared/publicIds'
```

- Dans `canSubmit`, retirer la condition sur l'id (l'id n'est plus saisi en création) :

```ts
  const canSubmit =
    values.nom.trim().length > 0 &&
    values.referentiels.every((ref) => referentielPublicIdSchema.safeParse(ref.id).success)
```

- Dans le bloc `<div className="mb-5">` de l'Identifiant, ne rendre le champ **que** en mode `edit` (lecture seule). Remplacer :

```tsx
        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-semibold">Identifiant</label>
          {mode === 'edit' ? (
            <span className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-surface-tinted px-3 py-2 font-mono text-sm text-primary">
              {values.id}{' '}
              <span className="font-sans text-xs text-text-subtle">🔒 non modifiable</span>
            </span>
          ) : (
            <input
              value={values.id}
              onChange={(event) => update({ id: event.target.value.toUpperCase() })}
              placeholder="IND-001"
              className="w-48 rounded-md border border-border px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
            />
          )}
        </div>
```

par :

```tsx
        {mode === 'edit' ? (
          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-semibold">Identifiant</label>
            <span className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-surface-tinted px-3 py-2 font-mono text-sm text-primary">
              {values.id}{' '}
              <span className="font-sans text-xs text-text-subtle">🔒 non modifiable</span>
            </span>
          </div>
        ) : (
          <p className="mb-5 text-xs text-text-subtle">
            L'identifiant (<code>IND-…</code>) est généré automatiquement à la création.
          </p>
        )}
```

Note : `values.id` reste dans `IndicateurFormValues` (utilisé en edit + par `buildInitialValues`) ; `buildInitialValues()` sans argument renvoie déjà `id: ''`, ce qui est sans effet en création.

- [ ] **Step 3: Brancher la page de création sur `createIndicateur`**

Dans `apps/mb-admin/src/routes/_authed/indicateurs/nouveau.tsx` :

```ts
import { createIndicateur } from '@/api/indicateurs'
```

et la mutation :

```ts
  const mutation = useMutation({
    mutationFn: (values: IndicateurFormValues) =>
      createIndicateur({
        nom: values.nom,
        visibilite: values.visibilite,
        unite: values.unite,
        referentiels: values.referentiels,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['indicateurs'] })
      void navigate({ to: '/indicateurs' })
    },
    onError: (err: unknown) => {
      void extractApiError(err).then(setError)
    },
  })
```

- [ ] **Step 4: Brancher la page d'édition sur `updateIndicateur`**

Dans `apps/mb-admin/src/routes/_authed/indicateurs/$id.tsx` :

```ts
import { updateIndicateur } from '@/api/indicateurs'
```

et dans la mutation, remplacer `upsertIndicateur(id, {…})` par `updateIndicateur(id, {…})` (le reste inchangé).

- [ ] **Step 5: Vérifier le lint mb-admin (eslint + tsc + prettier)**

Run: `pnpm -F @pilote/mb-admin lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/mb-admin/src/api/indicateurs.ts apps/mb-admin/src/components/IndicateurForm.tsx apps/mb-admin/src/routes/_authed/indicateurs/nouveau.tsx apps/mb-admin/src/routes/_authed/indicateurs/\$id.tsx
git commit -m "feat(mb-admin): création via POST (id auto), champ Identifiant retiré du formulaire"
```

---

### Task 6: Finalisation — vérif globale + mise à jour PR #2243

**Files:** aucun changement de code.

- [ ] **Step 1: Vérification finale**

Run: `pnpm -F @pilote/mb-api test && pnpm -F @pilote/mb-admin lint`
Expected: PASS des deux.

- [ ] **Step 2: Push**

```bash
git push
```

- [ ] **Step 3: Mettre à jour le titre + la description de la PR #2243**

```bash
gh pr edit 2243 --title "feat(mb): génération serveur du publicId indicateur (IND-<n>)"
```

Mettre à jour le corps pour décrire le nouveau comportement (POST crée / PUT update-only + 404, id généré via verrou consultatif, mb-admin sans champ Identifiant). Conserver la mention de la dédup des regex mb-admin (toujours incluse).

---

## Self-Review

**Spec coverage :**
- §1 restauration schéma → Task 1 ✅
- §2 génération (verrou + MAX+1) → Task 2 ✅
- §3 command scindée + 404 → Task 3 ✅
- §4 routes POST/PUT + 404 → Task 4 ✅
- §5 mb-admin (api split, form, pages) → Task 5 ✅
- Tests (§Tests) → Tasks 2 & 3 ✅
- PR #2243 → Task 6 ✅

**Placeholders :** aucun « TBD/TODO » ; le portage des cas restants (Task 3 Step 2) fournit la règle de transformation explicite + les cas nouveaux en entier.

**Type consistency :** `createIndicateur(body): ResultAsync<string, never>` et `updateIndicateur(publicId, body): ResultAsync<void, never>` cohérents entre Task 3 (def) et Task 4 (usage) ; côté mb-admin `createIndicateur(body)` / `updateIndicateur(id, body): Promise<IndicateurApiModel>` cohérents entre Task 5 (def) et pages. `generateIndicateurPublicId(): Promise<string>` cohérent Task 2 → Task 3.

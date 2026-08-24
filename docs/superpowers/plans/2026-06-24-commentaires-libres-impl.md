# Commentaires libres (mb-api) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exposer les commentaires (création, listing, édition, suppression) sur trois sujets — `indicateur+individu`, `panier+individu`, `panier global` — au-dessus du socle `Commentaire` déjà migré (PR #2227).

**Architecture :** Un domaine `src/commentaire/` avec un **cœur générique** : la mutation socle (`PUT`/`DELETE /commentaires/{id}`) est subject-agnostique (résout le sujet depuis l'id du commentaire) ; la création et le listing sont génériques, pilotés par un **descripteur de sujet** (`SujetCommentaireConfig`) — un seul code, trois câblages. Pas de triplication. Le niveau de confiance (type `CONFIANCE`) est hors de ce plan (plan séparé).

**Tech Stack :** Hono + `@hono/zod-openapi`, Prisma 7, Zod (`@pilote/mb-shared`), neverthrow (`ResultAsync`), `uuidv7`, Vitest (tests d'intégration sur DB `localhost:5435`).

**Périmètre de ce plan :** uniquement les commentaires de **type `DEFAUT` et `OBJECTIF`** (= « commentaires libres »). Le type `CONFIANCE` et la table `NiveauConfiance` sont traités dans `2026-06-24-niveau-confiance-impl.md`.

**Conventions clés (vérifiées dans le codebase) :**
- Handlers : `route.openapi(def, (c) => usecase(...).match((data) => jsonResponseOk({context: c, data, schema, status: 200}), never))`. Les erreurs métier sont **throw** (`AppError`) et mappées par `errorHandler` global (`ForbiddenError`→403, `findFirstOrThrow` P2025→404, `ZodError`→400).
- Usecases : renvoient `ResultAsync<T, never>` via `ResultAsync.fromSafePromise(...)`. Les refus de permission throw `ForbiddenError`.
- Id internes : `uuidv7()`. Les `Commentaire.id` sont des UUIDv7 (triables chronologiquement → `orderBy: { id: 'desc' }` = antichronologique, et compatible cursor `buildPaginationArgs`).
- Principal courant : `requireCurrentPrincipalId()` depuis `@/framework/auth/userContext`.
- Réponses : `jsonResponseOk` depuis `@/framework/openapi/jsonResponse`. `never` depuis `@/framework/errors/never`.
- Permissions : `withIndicateurReadPermission`/`withPanierReadPermission` (filtres Prisma), `ensureIndicateurWritePermission`/(panier équivalent) (throw `ForbiddenError`).
- Tests : `integrationTest(async () => {...})` (rollback transactionnel), `fixtures.*`, `runAsPrincipal/runAsAdmin/runAsUser`, `testIndicateurId()/testPanierId()/testIndividuId()`. Lancer : `pnpm vitest <chemin>`.

---

## File Structure

```
packages/mb-shared/src/
  commentaire.ts                         # CREATE: schémas Zod (statut, types par sujet, ApiModel, bodies, query, liste)

apps/mb-api/src/commentaire/
  utils.ts                               # CREATE: toCommentaireApiModel, htmlToPlainText
  sujets.ts                              # CREATE: SujetCommentaireConfig + 3 configs (indicateurIndividu, panierIndividu, panier)
  resolveCommentairePourEcriture.ts      # CREATE: id commentaire → sujet + WRITE + auteur
  commands/
    creerCommentaire.ts                  # CREATE: générique (config + body)
    modifierCommentaire.ts               # CREATE: socle (par id)
    supprimerCommentaire.ts              # CREATE: socle (par id)
    creerCommentaire.test.ts             # CREATE
    modifierCommentaire.test.ts          # CREATE
    supprimerCommentaire.test.ts         # CREATE
  queries/
    listerCommentaires.ts                # CREATE: générique (config + pagination)
    listerCommentaires.test.ts           # CREATE
  routes.ts                              # CREATE: enregistre POST/GET (×3 sujets) + PUT/DELETE socle
  routes.test.ts                         # CREATE: tests HTTP (status, params, OpenAPI)

apps/mb-api/tsconfig.json                 # MODIFY: ajouter le path "@/commentaire/*": ["./src/commentaire/*"]
apps/mb-api/src/test/fixtures.ts          # MODIFY: ajouter fixtures.commentaire
apps/mb-api/src/app.ts                    # MODIFY: monter commentaireRoutes
apps/mb-api/src/panier/permissions.ts     # READ ONLY (réutilisé) — vérifier l'export de ensurePanierWritePermission
```

---

## Task 1 : Schémas Zod partagés (`@pilote/mb-shared/commentaire`)

**Files:**
- Create: `packages/mb-shared/src/commentaire.ts`

- [ ] **Step 1 : Écrire le schéma**

```typescript
import { z } from 'zod'

import { createPaginatedApiListSchema, pageSizeSchema, paginationCursorSchema } from './pagination'

export const commentaireStatutSchema = z
  .enum(['BROUILLON', 'PUBLIE'])
  .describe('Statut du commentaire : BROUILLON (en cours de rédaction) ou PUBLIE (visible).')
export type CommentaireStatut = z.infer<typeof commentaireStatutSchema>

// Enums `type` par sujet (chaque sujet a ses propres valeurs).
export const indicateurIndividuCommentaireTypeSchema = z.enum(['DEFAUT', 'CONFIANCE'])
export const panierIndividuCommentaireTypeSchema = z.enum(['DEFAUT', 'CONFIANCE'])
export const panierCommentaireTypeSchema = z.enum(['DEFAUT', 'CONFIANCE', 'OBJECTIF'])

const auteurApiModelSchema = z
  .object({
    id: z.string().uuid().describe('Identifiant du principal (utilisateur ou clé API).'),
    email: z.string().email().nullable().describe('Email de l’auteur si c’est un utilisateur, sinon null.'),
  })
  .describe('Auteur d’un commentaire.')

export const commentaireApiModelSchema = z
  .object({
    id: z.string().uuid().describe('Identifiant du commentaire.'),
    type: z.string().describe('Catégorie du commentaire (enum propre au sujet).'),
    individuId: z
      .string()
      .nullable()
      .describe('Identifiant public de l’individu rattaché, ou null pour un commentaire global de panier.'),
    contenu: z.string().describe('Contenu HTML riche (peut être vide).'),
    contenuTexte: z.string().describe('Contenu en texte brut, dérivé du HTML (recherche / LLM).'),
    statut: commentaireStatutSchema,
    auteurCreation: auteurApiModelSchema,
    auteurModification: auteurApiModelSchema,
    createdAt: z.string().datetime().describe('Date ISO 8601 de création.'),
    updatedAt: z.string().datetime().describe('Date ISO 8601 de dernière modification.'),
  })
  .describe('Commentaire.')
export type CommentaireApiModel = z.infer<typeof commentaireApiModelSchema>

// Body de création : `type` est contraint par le sujet (cf. factory ci-dessous).
const creerCommentaireBodySchema = <T extends z.ZodTypeAny>(typeSchema: T) =>
  z.object({
    type: typeSchema.describe('Catégorie du commentaire.'),
    contenu: z.string().describe('Contenu HTML riche (la chaîne vide est autorisée).'),
    statut: commentaireStatutSchema,
  })

export const creerIndicateurIndividuCommentaireBodySchema = creerCommentaireBodySchema(
  indicateurIndividuCommentaireTypeSchema,
)
export const creerPanierIndividuCommentaireBodySchema = creerCommentaireBodySchema(
  panierIndividuCommentaireTypeSchema,
)
export const creerPanierCommentaireBodySchema = creerCommentaireBodySchema(panierCommentaireTypeSchema)
export type CreerCommentaireBody = z.infer<typeof creerIndicateurIndividuCommentaireBodySchema>

// Body de modification (socle, par id) : type non modifiable, individu/sujet figés.
export const modifierCommentaireBodySchema = z
  .object({
    contenu: z.string().optional().describe('Nouveau contenu HTML (optionnel).'),
    statut: commentaireStatutSchema.optional().describe('Nouveau statut (optionnel).'),
  })
  .describe('Modification du contenu et/ou du statut d’un commentaire.')
export type ModifierCommentaireBody = z.infer<typeof modifierCommentaireBodySchema>

// Query de listing : filtre optionnel par type + pagination cursor.
export const listerCommentairesQuerySchema = z.object({
  type: z.string().optional().describe('Filtre optionnel sur la catégorie du commentaire.'),
  cursor: paginationCursorSchema.optional(),
  pageSize: pageSizeSchema,
})
export type ListerCommentairesQuery = z.infer<typeof listerCommentairesQuerySchema>

export const commentaireListApiModelSchema = createPaginatedApiListSchema(commentaireApiModelSchema)
export type CommentaireListApiModel = z.infer<typeof commentaireListApiModelSchema>
```

- [ ] **Step 2 : Vérifier l’export du package** — confirmer que `package.json` de `mb-shared` expose les sous-chemins (`./commentaire`). Run :

```bash
grep -n "exports" -A30 packages/mb-shared/package.json | grep -i "panier\|indicateur\|\*"
```
Expected : un pattern d’export (souvent `"./*": "./src/*.ts"`). Si chaque module est listé explicitement, ajouter l’entrée `"./commentaire"`.

- [ ] **Step 3 : Typecheck mb-shared**

Run : `pnpm --filter @pilote/mb-shared exec tsc --noEmit`
Expected : PASS.

- [ ] **Step 4 : Commit**

```bash
git add packages/mb-shared/src/commentaire.ts packages/mb-shared/package.json
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1581): schémas Zod commentaire (mb-shared)"
```

---

## Task 2 : Utils de mapping (`commentaire/utils.ts`)

**Files:**
- Create: `apps/mb-api/src/commentaire/utils.ts`

- [ ] **Step 1 : Implémenter le mapping + dérivation texte**

```typescript
import { type CommentaireApiModel } from '@pilote/mb-shared/commentaire'

import { type Prisma } from '@/generated/prisma/client'

// Dérive un texte brut depuis un contenu HTML riche (recherche / LLM).
// Implémentation minimale (strip de balises + normalisation des espaces) ;
// à durcir si le richEditor introduit des structures complexes.
export const htmlToPlainText = (html: string): string =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

// Type de la ligne Commentaire chargée avec ses auteurs + son satellite (relation individu).
export type CommentaireRow = Prisma.CommentaireGetPayload<{
  include: {
    auteurCreation: { select: { id: true; utilisateur: { select: { email: true } } } }
    auteurModification: { select: { id: true; utilisateur: { select: { email: true } } } }
    indicateurIndividu: { include: { individu: { select: { publicId: true } } } }
    panierIndividu: { include: { individu: { select: { publicId: true } } } }
    panier: true
  }
}>

const typeDuCommentaire = (row: CommentaireRow): string =>
  row.indicateurIndividu?.type ?? row.panierIndividu?.type ?? row.panier?.type ?? 'DEFAUT'

const individuPublicId = (row: CommentaireRow): string | null =>
  row.indicateurIndividu?.individu.publicId ?? row.panierIndividu?.individu.publicId ?? null

export const toCommentaireApiModel = (row: CommentaireRow): CommentaireApiModel => ({
  id: row.id,
  type: typeDuCommentaire(row),
  individuId: individuPublicId(row),
  contenu: row.contenu,
  contenuTexte: row.contenuTexte,
  statut: row.statut,
  auteurCreation: { id: row.auteurCreation.id, email: row.auteurCreation.utilisateur?.email ?? null },
  auteurModification: {
    id: row.auteurModification.id,
    email: row.auteurModification.utilisateur?.email ?? null,
  },
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})

// Include réutilisable pour toutes les queries renvoyant un CommentaireApiModel.
export const commentaireInclude = {
  auteurCreation: { select: { id: true, utilisateur: { select: { email: true } } } },
  auteurModification: { select: { id: true, utilisateur: { select: { email: true } } } },
  indicateurIndividu: { include: { individu: { select: { publicId: true } } } },
  panierIndividu: { include: { individu: { select: { publicId: true } } } },
  panier: true,
} satisfies Prisma.CommentaireInclude
```

- [ ] **Step 2 : Test unitaire de `htmlToPlainText`**

Create `apps/mb-api/src/commentaire/utils.test.ts` :

```typescript
import { describe, expect, it } from 'vitest'

import { htmlToPlainText } from '@/commentaire/utils'

describe('htmlToPlainText', () => {
  it('strip les balises et normalise les espaces', () => {
    expect(htmlToPlainText('<p>Bonjour <strong>monde</strong></p>')).toBe('Bonjour monde')
  })
  it('gère la chaîne vide', () => {
    expect(htmlToPlainText('')).toBe('')
  })
})
```

- [ ] **Step 3 : Run** — `pnpm vitest src/commentaire/utils.test.ts` — Expected : PASS.

- [ ] **Step 4 : Commit** — `git add apps/mb-api/src/commentaire/utils.ts apps/mb-api/src/commentaire/utils.test.ts && git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1581): mapping commentaire + htmlToPlainText"`

---

## Task 3 : Vérifier/compléter les permissions panier

**Files:**
- Read: `apps/mb-api/src/panier/permissions.ts`

- [ ] **Step 1 : Vérifier les helpers disponibles**

Run :
```bash
grep -nE "export (const|function) (withPanierReadPermission|ensurePanierWritePermission)" apps/mb-api/src/panier/permissions.ts
```
Expected : `withPanierReadPermission` présent. **Si `ensurePanierWritePermission` n’existe pas**, l’ajouter en miroir de `ensureIndicateurWritePermission` (`apps/mb-api/src/indicateur/permissions.ts`) :

```typescript
import { ResultAsync } from 'neverthrow'

import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { PermissionAction } from '@/generated/prisma/enums'

export const ensurePanierWritePermission = ({
  panierId,
  principalId,
}: {
  panierId: string
  principalId: string
}): ResultAsync<void, never> =>
  ResultAsync.fromSafePromise(
    db()
      .panierPermission.findUnique({
        where: { principalId_panierId_action: { principalId, panierId, action: PermissionAction.WRITE } },
      })
      .then((hasWrite) => {
        if (!hasWrite) throw new ForbiddenError("Vous n'avez pas la permission de modifier ce panier")
      }),
  )
```

- [ ] **Step 2 : Commit si modifié** — `git add apps/mb-api/src/panier/permissions.ts && git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1581): ensurePanierWritePermission"`

---

## Task 4 : Descripteurs de sujet (`commentaire/sujets.ts`)

**Files:**
- Create: `apps/mb-api/src/commentaire/sujets.ts`

Ce fichier centralise ce qui diffère entre les trois sujets : la résolution des publicIds du path en ids internes + permission, et la construction du satellite Prisma.

- [ ] **Step 1 : Implémenter les configs**

```typescript
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { ensureIndicateurWritePermission, withIndicateurReadPermission } from '@/indicateur/permissions'
import { ensurePanierWritePermission, withPanierReadPermission } from '@/panier/permissions'
import { type Prisma } from '@/generated/prisma/client'

// Données nécessaires pour rattacher un nouveau commentaire à son satellite.
type CibleEcriture = {
  principalId: string
  // Donnée `create` du satellite (sans commentaireId, ajouté par la command).
  satelliteCreate: (type: string) => Prisma.CommentaireCreateInput
}

export type SujetCommentaireConfig = {
  // Résout le path en ids internes + vérifie la permission WRITE ; throw ForbiddenError sinon.
  resoudreCibleEcriture: (params: Record<string, string>) => ResultAsync<CibleEcriture, never>
  // Construit le `where` Prisma sur Commentaire pour le listing (READ permission + scope).
  whereLecture: (params: Record<string, string>, principalId: string) => Prisma.CommentaireWhereInput
}

// --- indicateur + individu ---------------------------------------------------

export const indicateurIndividuConfig: SujetCommentaireConfig = {
  resoudreCibleEcriture: ({ indicateurId, individuId }) => {
    const principalId = requireCurrentPrincipalId()
    return ResultAsync.fromSafePromise(
      db().indicateur.findFirstOrThrow({
        where: withIndicateurReadPermission({ publicId: indicateurId }, principalId),
        select: { id: true },
      }),
    )
      .andThen((indicateur) =>
        ResultAsync.fromSafePromise(
          db().individu.findFirstOrThrow({ where: { publicId: individuId }, select: { id: true } }),
        ).map((individu) => ({ indicateurId: indicateur.id, individuId: individu.id })),
      )
      .andThen(({ indicateurId: indId, individuId: indivId }) =>
        ensureIndicateurWritePermission({ indicateurId: indId, principalId }).map(() => ({
          principalId,
          satelliteCreate: (type: string) => ({
            indicateurIndividu: { create: { indicateurId: indId, individuId: indivId, type: type as never } },
          }),
        })),
      )
  },
  whereLecture: ({ indicateurId, individuId }, principalId) => ({
    indicateurIndividu: {
      indicateur: withIndicateurReadPermission({ publicId: indicateurId }, principalId),
      individu: { publicId: individuId },
    },
  }),
}

// --- panier + individu -------------------------------------------------------

export const panierIndividuConfig: SujetCommentaireConfig = {
  resoudreCibleEcriture: ({ panierId, individuId }) => {
    const principalId = requireCurrentPrincipalId()
    return ResultAsync.fromSafePromise(
      db().panier.findFirstOrThrow({
        where: withPanierReadPermission({ publicId: panierId }, principalId),
        select: { id: true },
      }),
    )
      .andThen((panier) =>
        ResultAsync.fromSafePromise(
          db().individu.findFirstOrThrow({ where: { publicId: individuId }, select: { id: true } }),
        ).map((individu) => ({ panierId: panier.id, individuId: individu.id })),
      )
      .andThen(({ panierId: panId, individuId: indivId }) =>
        ensurePanierWritePermission({ panierId: panId, principalId }).map(() => ({
          principalId,
          satelliteCreate: (type: string) => ({
            panierIndividu: { create: { panierId: panId, individuId: indivId, type: type as never } },
          }),
        })),
      )
  },
  whereLecture: ({ panierId, individuId }, principalId) => ({
    panierIndividu: {
      panier: withPanierReadPermission({ publicId: panierId }, principalId),
      individu: { publicId: individuId },
    },
  }),
}

// --- panier global -----------------------------------------------------------

export const panierConfig: SujetCommentaireConfig = {
  resoudreCibleEcriture: ({ panierId }) => {
    const principalId = requireCurrentPrincipalId()
    return ResultAsync.fromSafePromise(
      db().panier.findFirstOrThrow({
        where: withPanierReadPermission({ publicId: panierId }, principalId),
        select: { id: true },
      }),
    ).andThen((panier) =>
      ensurePanierWritePermission({ panierId: panier.id, principalId }).map(() => ({
        principalId,
        satelliteCreate: (type: string) => ({ panier: { create: { panierId: panier.id, type: type as never } } }),
      })),
    )
  },
  whereLecture: ({ panierId }, principalId) => ({
    panier: { panier: withPanierReadPermission({ publicId: panierId }, principalId) },
  }),
}
```

> Note : `type as never` contourne le fait que les 3 enums Prisma diffèrent ; le `type` est déjà validé par le body Zod du sujet en amont (route), donc sûr.

- [ ] **Step 2 : Typecheck** — `pnpm --filter @pilote/mb-api exec tsc --noEmit` — Expected : PASS. (Pas de test dédié ici, couvert par les commands/queries.)

- [ ] **Step 3 : Commit** — `git add apps/mb-api/src/commentaire/sujets.ts && git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1581): descripteurs de sujet commentaire"`

---

## Task 5 : Fixture `commentaire`

**Files:**
- Modify: `apps/mb-api/src/test/fixtures.ts`

- [ ] **Step 1 : Ajouter la factory** (avant le `export const fixtures = {...}`), reliant un commentaire à un satellite indicateur+individu (cas par défaut des tests) :

```typescript
// --- Commentaire (indicateur + individu) -------------------------------------

type CommentaireOverrides = {
  indicateur: IndicateurOverrides
  individu: IndividuOverrides
  createdBy: string
} & Partial<{ id: string; contenu: string; contenuTexte: string; statut: 'BROUILLON' | 'PUBLIE'; type: 'DEFAUT' | 'CONFIANCE' }>

const upsertCommentaire = async (o: CommentaireOverrides) => {
  const indicateurRow = await upsertIndicateur(o.indicateur)
  const individuRow = await upsertIndividu(o.individu)
  const id = o.id ?? uuidv7()
  return db().commentaire.create({
    data: {
      id,
      contenu: o.contenu ?? '<p>Commentaire de test</p>',
      contenuTexte: o.contenuTexte ?? 'Commentaire de test',
      statut: o.statut ?? 'PUBLIE',
      createdBy: o.createdBy,
      updatedBy: o.createdBy,
      indicateurIndividu: {
        create: { indicateurId: indicateurRow.id, individuId: individuRow.id, type: o.type ?? 'DEFAUT' },
      },
    },
    include: { indicateurIndividu: true },
  })
}

async function commentaire(override: CommentaireOverrides) {
  return upsertCommentaire(override)
}
```

Puis ajouter `commentaire,` dans l’objet `export const fixtures`.

- [ ] **Step 2 : Typecheck** — `pnpm --filter @pilote/mb-api exec tsc --noEmit` — Expected : PASS.

- [ ] **Step 3 : Commit** — `git add apps/mb-api/src/test/fixtures.ts && git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1581): fixture commentaire (test)"`

---

## Task 6 : Command `creerCommentaire` (générique)

**Files:**
- Create: `apps/mb-api/src/commentaire/commands/creerCommentaire.ts`
- Test: `apps/mb-api/src/commentaire/commands/creerCommentaire.test.ts`

- [ ] **Step 1 : Écrire le test (échec attendu)**

```typescript
import { describe, expect, it } from 'vitest'

import { creerCommentaire } from '@/commentaire/commands/creerCommentaire'
import { indicateurIndividuConfig } from '@/commentaire/sujets'
import { db } from '@/framework/persistence/dbStore'
import { PermissionAction } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testIndividuId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('creerCommentaire', () => {
  it(
    'crée un commentaire DEFAUT rattaché à (indicateur, individu) avec auteur = principal courant',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      const indicateur = await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        creerCommentaire(indicateurIndividuConfig, {
          params: { indicateurId: indId, individuId: indivId },
          body: { type: 'DEFAUT', contenu: '<p>Hello</p>', statut: 'PUBLIE' },
        }),
      )

      expect(result.isOk()).toBe(true)
      const model = result._unsafeUnwrap()
      expect(model.type).toBe('DEFAUT')
      expect(model.individuId).toBe(indivId)
      expect(model.contenuTexte).toBe('Hello')
      expect(model.auteurCreation.id).toBe(apiKey.id)
      const count = await db().commentaire.count({ where: { indicateurIndividu: { indicateurId: indicateur.id } } })
      expect(count).toBe(1)
    }),
  )

  it(
    'throw ForbiddenError sans permission WRITE',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId, visibilite: 'PUBLIC' })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey() // pas de WRITE

      await expect(
        runAsPrincipal(apiKey.id, () =>
          creerCommentaire(indicateurIndividuConfig, {
            params: { indicateurId: indId, individuId: indivId },
            body: { type: 'DEFAUT', contenu: '', statut: 'BROUILLON' },
          }),
        ),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    }),
  )

  it(
    'refuse un second brouillon pour le même (scope, auteur) — ConflictError (PIL-1585/1592)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE }],
      })
      const creerBrouillon = () =>
        runAsPrincipal(apiKey.id, () =>
          creerCommentaire(indicateurIndividuConfig, {
            params: { indicateurId: indId, individuId: indivId },
            body: { type: 'DEFAUT', contenu: '', statut: 'BROUILLON' },
          }),
        )

      const premier = await creerBrouillon()
      expect(premier.isOk()).toBe(true)
      await expect(creerBrouillon()).rejects.toMatchObject({ code: 'CONFLICT' })

      // Un PUBLIE supplémentaire reste autorisé (la contrainte ne vise que les brouillons).
      const publie = await runAsPrincipal(apiKey.id, () =>
        creerCommentaire(indicateurIndividuConfig, {
          params: { indicateurId: indId, individuId: indivId },
          body: { type: 'DEFAUT', contenu: '<p>ok</p>', statut: 'PUBLIE' },
        }),
      )
      expect(publie.isOk()).toBe(true)
    }),
  )
})
```

- [ ] **Step 2 : Run, vérifier l’échec** — `pnpm vitest src/commentaire/commands/creerCommentaire.test.ts` — Expected : FAIL (module introuvable).

- [ ] **Step 3 : Implémenter**

```typescript
import { type CreerCommentaireBody, type CommentaireApiModel } from '@pilote/mb-shared/commentaire'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { commentaireInclude, htmlToPlainText, toCommentaireApiModel } from '@/commentaire/utils'
import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { ConflictError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'

type CreerCommentaireParams = {
  params: Record<string, string>
  body: CreerCommentaireBody
}

export const creerCommentaire = (
  config: SujetCommentaireConfig,
  { params, body }: CreerCommentaireParams,
): ResultAsync<CommentaireApiModel, never> =>
  config.resoudreCibleEcriture(params).andThen((cible) =>
    ensureUnSeulBrouillon(config, params, body.statut, cible.principalId).andThen(() =>
      ResultAsync.fromSafePromise(
        db().commentaire.create({
          data: {
            id: uuidv7(),
            contenu: body.contenu,
            contenuTexte: htmlToPlainText(body.contenu),
            statut: body.statut,
            createdBy: cible.principalId,
            updatedBy: cible.principalId,
            ...cible.satelliteCreate(body.type),
          },
          include: commentaireInclude,
        }),
      ).map(toCommentaireApiModel),
    ),
  )

// Règle PIL-1585/1592 : au plus 1 brouillon par (scope, auteur).
// `whereLecture` borne au scope exact (sujet + individu) ; on ajoute statut BROUILLON + auteur.
// Exécuté dans la transaction de la route (withTransaction) → cohérent.
const ensureUnSeulBrouillon = (
  config: SujetCommentaireConfig,
  params: Record<string, string>,
  statut: CreerCommentaireBody['statut'],
  principalId: string,
): ResultAsync<void, never> => {
  if (statut !== 'BROUILLON') return ResultAsync.fromSafePromise(Promise.resolve())
  return ResultAsync.fromSafePromise(
    db()
      .commentaire.count({
        where: {
          AND: [config.whereLecture(params, principalId), { statut: 'BROUILLON', createdBy: principalId }],
        },
      })
      .then((count) => {
        if (count > 0) {
          throw new ConflictError(
            'Un brouillon existe déjà pour ce scope ; reprenez-le plutôt que d’en créer un autre',
          )
        }
      }),
  )
}
```

> `ConflictError` (code `CONFLICT`, kind `conflict` → 409) : vérifier sa présence dans `@/framework/errors/AppError` (`grep -n "ConflictError" apps/mb-api/src/framework/errors/AppError.ts`). Si absente, l’ajouter en miroir de `ForbiddenError` avec `readonly code = 'CONFLICT'` et `readonly kind = 'conflict' as const`.

- [ ] **Step 4 : Run, vérifier le succès** — `pnpm vitest src/commentaire/commands/creerCommentaire.test.ts` — Expected : PASS (2 tests).

- [ ] **Step 5 : Commit** — `git add apps/mb-api/src/commentaire/commands/creerCommentaire.* && git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1581): command creerCommentaire (générique)"`

---

## Task 7 : Query `listerCommentaires` (générique)

**Files:**
- Create: `apps/mb-api/src/commentaire/queries/listerCommentaires.ts`
- Test: `apps/mb-api/src/commentaire/queries/listerCommentaires.test.ts`

- [ ] **Step 1 : Écrire le test (échec attendu)**

```typescript
import { describe, expect, it } from 'vitest'

import { listerCommentaires } from '@/commentaire/queries/listerCommentaires'
import { indicateurIndividuConfig } from '@/commentaire/sujets'
import { PermissionAction } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testIndividuId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('listerCommentaires', () => {
  it(
    'liste les commentaires du scope en antichronologique, en excluant le type CONFIANCE',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.READ }],
      })
      await fixtures.commentaire({
        indicateur: { publicId: indId },
        individu: { publicId: indivId },
        createdBy: apiKey.id,
        contenu: '<p>Premier</p>',
        type: 'DEFAUT',
      })
      await fixtures.commentaire({
        indicateur: { publicId: indId },
        individu: { publicId: indivId },
        createdBy: apiKey.id,
        contenu: '<p>Confiance</p>',
        type: 'CONFIANCE',
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listerCommentaires(indicateurIndividuConfig, { params: { indicateurId: indId, individuId: indivId }, query: {} }),
      )

      expect(result.isOk()).toBe(true)
      const page = result._unsafeUnwrap()
      expect(page.total).toBe(1)
      expect(page.items.map((c) => c.contenuTexte)).toEqual(['Premier'])
    }),
  )
})
```

- [ ] **Step 2 : Run, vérifier l’échec** — `pnpm vitest src/commentaire/queries/listerCommentaires.test.ts` — Expected : FAIL.

- [ ] **Step 3 : Implémenter**

```typescript
import { type CommentaireListApiModel, type ListerCommentairesQuery } from '@pilote/mb-shared/commentaire'
import { ResultAsync } from 'neverthrow'

import { commentaireInclude, toCommentaireApiModel } from '@/commentaire/utils'
import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { type Prisma } from '@/generated/prisma/client'

type ListerCommentairesParams = {
  params: Record<string, string>
  query: ListerCommentairesQuery
}

export const listerCommentaires = (
  config: SujetCommentaireConfig,
  { params, query }: ListerCommentairesParams,
): ResultAsync<CommentaireListApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  // Filtre type : si fourni on le respecte, sinon on exclut les commentaires de confiance.
  const filtreType: Prisma.CommentaireWhereInput = query.type
    ? subjectTypeFilter(query.type)
    : { NOT: subjectTypeFilter('CONFIANCE') }
  const where: Prisma.CommentaireWhereInput = { AND: [config.whereLecture(params, principalId), filtreType] }

  const fetchPage = db().commentaire.findMany({
    where,
    orderBy: { id: 'desc' }, // uuidv7 → antichronologique
    include: commentaireInclude,
    ...buildPaginationArgs(query.cursor, query.pageSize),
  })
  const fetchTotal = db().commentaire.count({ where })

  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toCommentaireApiModel, query.pageSize),
  )
}

// Filtre sur le `type` quel que soit le satellite (un seul satellite est renseigné par commentaire).
const subjectTypeFilter = (type: string): Prisma.CommentaireWhereInput => ({
  OR: [
    { indicateurIndividu: { type: type as never } },
    { panierIndividu: { type: type as never } },
    { panier: { type: type as never } },
  ],
})
```

- [ ] **Step 4 : Run, vérifier le succès** — `pnpm vitest src/commentaire/queries/listerCommentaires.test.ts` — Expected : PASS.

- [ ] **Step 5 : Commit** — `git add apps/mb-api/src/commentaire/queries/listerCommentaires.* && git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1581): query listerCommentaires (générique)"`

---

## Task 8 : Résolution écriture par id + commands socle (`modifier`, `supprimer`)

**Files:**
- Create: `apps/mb-api/src/commentaire/resolveCommentairePourEcriture.ts`
- Create: `apps/mb-api/src/commentaire/commands/modifierCommentaire.ts`
- Create: `apps/mb-api/src/commentaire/commands/supprimerCommentaire.ts`
- Test: `apps/mb-api/src/commentaire/commands/modifierCommentaire.test.ts`, `supprimerCommentaire.test.ts`

- [ ] **Step 1 : Résolveur (id commentaire → sujet + WRITE + auteur)**

`resolveCommentairePourEcriture.ts` :

```typescript
import { ResultAsync } from 'neverthrow'

import { ForbiddenError } from '@/framework/errors/AppError'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { ensureIndicateurWritePermission } from '@/indicateur/permissions'
import { ensurePanierWritePermission } from '@/panier/permissions'

// Charge le commentaire + son satellite, vérifie que le principal courant en est l'auteur
// ET dispose de WRITE sur le sujet. Throw ForbiddenError / 404 (P2025) sinon.
export const resolveCommentairePourEcriture = (
  commentaireId: string,
): ResultAsync<{ principalId: string }, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().commentaire.findUniqueOrThrow({
      where: { id: commentaireId },
      select: {
        createdBy: true,
        indicateurIndividu: { select: { indicateurId: true } },
        panierIndividu: { select: { panierId: true } },
        panier: { select: { panierId: true } },
      },
    }),
  ).andThen((commentaire) => {
    if (commentaire.createdBy !== principalId) {
      throw new ForbiddenError("Seul l'auteur peut modifier ce commentaire")
    }
    if (commentaire.indicateurIndividu) {
      return ensureIndicateurWritePermission({
        indicateurId: commentaire.indicateurIndividu.indicateurId,
        principalId,
      }).map(() => ({ principalId }))
    }
    const panierId = commentaire.panierIndividu?.panierId ?? commentaire.panier?.panierId
    if (panierId) {
      return ensurePanierWritePermission({ panierId, principalId }).map(() => ({ principalId }))
    }
    throw new ForbiddenError('Commentaire sans sujet rattaché')
  })
}
```

- [ ] **Step 2 : Command `modifierCommentaire`**

```typescript
import { type ModifierCommentaireBody, type CommentaireApiModel } from '@pilote/mb-shared/commentaire'
import { ResultAsync } from 'neverthrow'

import { resolveCommentairePourEcriture } from '@/commentaire/resolveCommentairePourEcriture'
import { commentaireInclude, htmlToPlainText, toCommentaireApiModel } from '@/commentaire/utils'
import { db } from '@/framework/persistence/dbStore'

export const modifierCommentaire = (
  commentaireId: string,
  body: ModifierCommentaireBody,
): ResultAsync<CommentaireApiModel, never> =>
  resolveCommentairePourEcriture(commentaireId).andThen(({ principalId }) =>
    ResultAsync.fromSafePromise(
      db().commentaire.update({
        where: { id: commentaireId },
        data: {
          ...(body.contenu !== undefined && {
            contenu: body.contenu,
            contenuTexte: htmlToPlainText(body.contenu),
          }),
          ...(body.statut !== undefined && { statut: body.statut }),
          updatedBy: principalId,
        },
        include: commentaireInclude,
      }),
    ).map(toCommentaireApiModel),
  )
```

- [ ] **Step 3 : Command `supprimerCommentaire`**

```typescript
import { ResultAsync } from 'neverthrow'

import { resolveCommentairePourEcriture } from '@/commentaire/resolveCommentairePourEcriture'
import { db } from '@/framework/persistence/dbStore'

export const supprimerCommentaire = (commentaireId: string): ResultAsync<void, never> =>
  resolveCommentairePourEcriture(commentaireId).andThen(() =>
    ResultAsync.fromSafePromise(db().commentaire.delete({ where: { id: commentaireId } }).then(() => undefined)),
  )
```

- [ ] **Step 4 : Tests** — `modifierCommentaire.test.ts` :

```typescript
import { describe, expect, it } from 'vitest'

import { modifierCommentaire } from '@/commentaire/commands/modifierCommentaire'
import { db } from '@/framework/persistence/dbStore'
import { PermissionAction } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testIndividuId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('modifierCommentaire', () => {
  it(
    'met à jour contenu + statut + contenuTexte par l’auteur',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE }],
      })
      const c = await fixtures.commentaire({
        indicateur: { publicId: indId },
        individu: { publicId: testIndividuId() },
        createdBy: apiKey.id,
        statut: 'BROUILLON',
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        modifierCommentaire(c.id, { contenu: '<p>MAJ</p>', statut: 'PUBLIE' }),
      )

      expect(result.isOk()).toBe(true)
      const row = await db().commentaire.findUniqueOrThrow({ where: { id: c.id } })
      expect(row.contenuTexte).toBe('MAJ')
      expect(row.statut).toBe('PUBLIE')
    }),
  )

  it(
    'throw ForbiddenError si le principal n’est pas l’auteur',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const auteur = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE }],
      })
      const autre = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE }],
      })
      const c = await fixtures.commentaire({
        indicateur: { publicId: indId },
        individu: { publicId: testIndividuId() },
        createdBy: auteur.id,
      })

      await expect(
        runAsPrincipal(autre.id, () => modifierCommentaire(c.id, { statut: 'PUBLIE' })),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    }),
  )
})
```

`supprimerCommentaire.test.ts` :

```typescript
import { describe, expect, it } from 'vitest'

import { supprimerCommentaire } from '@/commentaire/commands/supprimerCommentaire'
import { db } from '@/framework/persistence/dbStore'
import { PermissionAction } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testIndividuId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('supprimerCommentaire', () => {
  it(
    'supprime le commentaire de l’auteur',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE }],
      })
      const c = await fixtures.commentaire({
        indicateur: { publicId: indId },
        individu: { publicId: testIndividuId() },
        createdBy: apiKey.id,
      })

      const result = await runAsPrincipal(apiKey.id, () => supprimerCommentaire(c.id))

      expect(result.isOk()).toBe(true)
      expect(await db().commentaire.findUnique({ where: { id: c.id } })).toBeNull()
    }),
  )
})
```

- [ ] **Step 5 : Run** — `pnpm vitest src/commentaire/commands/modifierCommentaire.test.ts src/commentaire/commands/supprimerCommentaire.test.ts` — Expected : PASS.

- [ ] **Step 6 : Commit** — `git add apps/mb-api/src/commentaire/resolveCommentairePourEcriture.ts apps/mb-api/src/commentaire/commands/modifierCommentaire.* apps/mb-api/src/commentaire/commands/supprimerCommentaire.* && git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1581): commands socle modifier/supprimer commentaire"`

---

## Task 9 : Routes OpenAPI + montage

**Files:**
- Create: `apps/mb-api/src/commentaire/routes.ts`
- Modify: `apps/mb-api/src/app.ts`

- [ ] **Step 1 : Écrire `routes.ts`** — enregistre, pour chaque sujet, `POST` + `GET`, puis `PUT`/`DELETE` socle.

```typescript
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import {
  commentaireApiModelSchema,
  commentaireListApiModelSchema,
  creerIndicateurIndividuCommentaireBodySchema,
  creerPanierCommentaireBodySchema,
  creerPanierIndividuCommentaireBodySchema,
  listerCommentairesQuerySchema,
  modifierCommentaireBodySchema,
} from '@pilote/mb-shared/commentaire'
import { errorApiModelSchema } from '@pilote/mb-shared/error'
import { indicateurPublicIdSchema, individuPublicIdSchema, panierPublicIdSchema } from '@pilote/mb-shared/publicIds'

import { creerCommentaire } from '@/commentaire/commands/creerCommentaire'
import { modifierCommentaire } from '@/commentaire/commands/modifierCommentaire'
import { supprimerCommentaire } from '@/commentaire/commands/supprimerCommentaire'
import { listerCommentaires } from '@/commentaire/queries/listerCommentaires'
import { indicateurIndividuConfig, panierConfig, panierIndividuConfig } from '@/commentaire/sujets'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { withTransaction } from '@/framework/persistence/withTransaction'

const CommentaireApiModelSchema = commentaireApiModelSchema.openapi('CommentaireApiModel')
const CommentaireListApiModelSchema = commentaireListApiModelSchema.openapi('CommentaireListApiModel')
const ErrorApiModelSchema = errorApiModelSchema.openapi('ErrorApiModel')

export const commentaireRoutes = new OpenAPIHono()

const responsesAvecErreurs = {
  200: { content: { 'application/json': { schema: CommentaireApiModelSchema } }, description: 'Commentaire' },
  400: { content: { 'application/json': { schema: ErrorApiModelSchema } }, description: 'Requête invalide' },
  403: { content: { 'application/json': { schema: ErrorApiModelSchema } }, description: 'Permission insuffisante' },
  404: { content: { 'application/json': { schema: ErrorApiModelSchema } }, description: 'Sujet introuvable' },
}

// --- indicateur + individu ---------------------------------------------------

const creerIndicateurIndividuRoute = createRoute({
  method: 'post',
  path: '/indicateurs/{indicateurId}/individus/{individuId}/commentaires',
  tags: ['Commentaire'],
  summary: 'Créer un commentaire sur un indicateur pour un individu',
  middleware: [requireAuthentication],
  request: {
    params: z.object({ indicateurId: indicateurPublicIdSchema, individuId: individuPublicIdSchema }),
    body: { content: { 'application/json': { schema: creerIndicateurIndividuCommentaireBodySchema } }, required: true },
  },
  responses: responsesAvecErreurs,
})
commentaireRoutes.openapi(creerIndicateurIndividuRoute, async (context) => {
  const params = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(() => creerCommentaire(indicateurIndividuConfig, { params, body }))
  return result.match((data) => jsonResponseOk({ context, data, schema: CommentaireApiModelSchema, status: 200 }), never)
})

const listerIndicateurIndividuRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{indicateurId}/individus/{individuId}/commentaires',
  tags: ['Commentaire'],
  summary: 'Lister les commentaires d’un indicateur pour un individu',
  middleware: [requireAuthentication],
  request: {
    params: z.object({ indicateurId: indicateurPublicIdSchema, individuId: individuPublicIdSchema }),
    query: listerCommentairesQuerySchema,
  },
  responses: {
    200: { content: { 'application/json': { schema: CommentaireListApiModelSchema } }, description: 'Liste paginée' },
    404: { content: { 'application/json': { schema: ErrorApiModelSchema } }, description: 'Sujet introuvable' },
  },
})
commentaireRoutes.openapi(listerIndicateurIndividuRoute, async (context) => {
  const params = context.req.valid('param')
  const query = context.req.valid('query')
  return listerCommentaires(indicateurIndividuConfig, { params, query }).match(
    (data) => jsonResponseOk({ context, data, schema: CommentaireListApiModelSchema, status: 200 }),
    never,
  )
})

// --- panier + individu -------------------------------------------------------

const creerPanierIndividuRoute = createRoute({
  method: 'post',
  path: '/paniers/{panierId}/individus/{individuId}/commentaires',
  tags: ['Commentaire'],
  summary: 'Créer un commentaire sur un panier pour un individu',
  middleware: [requireAuthentication],
  request: {
    params: z.object({ panierId: panierPublicIdSchema, individuId: individuPublicIdSchema }),
    body: { content: { 'application/json': { schema: creerPanierIndividuCommentaireBodySchema } }, required: true },
  },
  responses: responsesAvecErreurs,
})
commentaireRoutes.openapi(creerPanierIndividuRoute, async (context) => {
  const params = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(() => creerCommentaire(panierIndividuConfig, { params, body }))
  return result.match((data) => jsonResponseOk({ context, data, schema: CommentaireApiModelSchema, status: 200 }), never)
})

const listerPanierIndividuRoute = createRoute({
  method: 'get',
  path: '/paniers/{panierId}/individus/{individuId}/commentaires',
  tags: ['Commentaire'],
  summary: 'Lister les commentaires d’un panier pour un individu',
  middleware: [requireAuthentication],
  request: {
    params: z.object({ panierId: panierPublicIdSchema, individuId: individuPublicIdSchema }),
    query: listerCommentairesQuerySchema,
  },
  responses: {
    200: { content: { 'application/json': { schema: CommentaireListApiModelSchema } }, description: 'Liste paginée' },
    404: { content: { 'application/json': { schema: ErrorApiModelSchema } }, description: 'Sujet introuvable' },
  },
})
commentaireRoutes.openapi(listerPanierIndividuRoute, async (context) => {
  const params = context.req.valid('param')
  const query = context.req.valid('query')
  return listerCommentaires(panierIndividuConfig, { params, query }).match(
    (data) => jsonResponseOk({ context, data, schema: CommentaireListApiModelSchema, status: 200 }),
    never,
  )
})

// --- panier global -----------------------------------------------------------

const creerPanierRoute = createRoute({
  method: 'post',
  path: '/paniers/{panierId}/commentaires',
  tags: ['Commentaire'],
  summary: 'Créer un commentaire global sur un panier',
  middleware: [requireAuthentication],
  request: {
    params: z.object({ panierId: panierPublicIdSchema }),
    body: { content: { 'application/json': { schema: creerPanierCommentaireBodySchema } }, required: true },
  },
  responses: responsesAvecErreurs,
})
commentaireRoutes.openapi(creerPanierRoute, async (context) => {
  const params = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(() => creerCommentaire(panierConfig, { params, body }))
  return result.match((data) => jsonResponseOk({ context, data, schema: CommentaireApiModelSchema, status: 200 }), never)
})

const listerPanierRoute = createRoute({
  method: 'get',
  path: '/paniers/{panierId}/commentaires',
  tags: ['Commentaire'],
  summary: 'Lister les commentaires globaux d’un panier',
  middleware: [requireAuthentication],
  request: { params: z.object({ panierId: panierPublicIdSchema }), query: listerCommentairesQuerySchema },
  responses: {
    200: { content: { 'application/json': { schema: CommentaireListApiModelSchema } }, description: 'Liste paginée' },
    404: { content: { 'application/json': { schema: ErrorApiModelSchema } }, description: 'Sujet introuvable' },
  },
})
commentaireRoutes.openapi(listerPanierRoute, async (context) => {
  const params = context.req.valid('param')
  const query = context.req.valid('query')
  return listerCommentaires(panierConfig, { params, query }).match(
    (data) => jsonResponseOk({ context, data, schema: CommentaireListApiModelSchema, status: 200 }),
    never,
  )
})

// --- mutation socle (par id) -------------------------------------------------

const modifierRoute = createRoute({
  method: 'put',
  path: '/commentaires/{commentaireId}',
  tags: ['Commentaire'],
  summary: 'Modifier un commentaire (auteur uniquement)',
  middleware: [requireAuthentication],
  request: {
    params: z.object({ commentaireId: z.string().uuid() }),
    body: { content: { 'application/json': { schema: modifierCommentaireBodySchema } }, required: true },
  },
  responses: responsesAvecErreurs,
})
commentaireRoutes.openapi(modifierRoute, async (context) => {
  const { commentaireId } = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(() => modifierCommentaire(commentaireId, body))
  return result.match((data) => jsonResponseOk({ context, data, schema: CommentaireApiModelSchema, status: 200 }), never)
})

const supprimerRoute = createRoute({
  method: 'delete',
  path: '/commentaires/{commentaireId}',
  tags: ['Commentaire'],
  summary: 'Supprimer un commentaire (auteur uniquement)',
  middleware: [requireAuthentication],
  request: { params: z.object({ commentaireId: z.string().uuid() }) },
  responses: {
    204: { description: 'Commentaire supprimé' },
    403: { content: { 'application/json': { schema: ErrorApiModelSchema } }, description: 'Permission insuffisante' },
    404: { content: { 'application/json': { schema: ErrorApiModelSchema } }, description: 'Commentaire introuvable' },
  },
})
commentaireRoutes.openapi(supprimerRoute, async (context) => {
  const { commentaireId } = context.req.valid('param')
  const result = await withTransaction(() => supprimerCommentaire(commentaireId))
  return result.match(() => context.body(null, 204), never)
})
```

- [ ] **Step 2 : Monter dans `app.ts`** — ajouter l’import et `app.route('/', commentaireRoutes)` (après `panierRoutes`).

```typescript
import { commentaireRoutes } from '@/commentaire/routes'
// ...
app.route('/', commentaireRoutes)
```

- [ ] **Step 3 : Lint** — `pnpm lint` (depuis `apps/mb-api`) — Expected : vert (eslint + tsc + prettier).

- [ ] **Step 4 : Commit** — `git add apps/mb-api/src/commentaire/routes.ts apps/mb-api/src/app.ts && git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1581): routes commentaires (3 sujets + mutation socle)"`

---

## Task 10 : Tests HTTP de route (OpenAPI + statuts)

**Files:**
- Create: `apps/mb-api/src/commentaire/routes.test.ts`

Valide le câblage OpenAPI réel via `app.request` (parse des params, statut, body), avec un principal injecté.

- [ ] **Step 1 : Écrire le test**

```typescript
import { describe, expect, it } from 'vitest'

import { app } from '@/app'
import { runWithPrincipal } from '@/framework/auth/userContext'
import { PermissionAction } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testIndividuId } from '@/test/randomIds'

// Exécute une requête HTTP avec un principal API key injecté dans le contexte.
const requestAs = (principalId: string, input: string, init?: RequestInit) =>
  runWithPrincipal(
    { kind: 'apiKey', apiKey: { id: principalId, label: 'test', role: 'CONTRIBUTOR' } },
    () => app.request(input, init),
  )

describe.concurrent('routes commentaires (HTTP)', () => {
  it(
    'POST puis GET un commentaire indicateur+individu (200)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE }],
      })

      const postRes = await requestAs(apiKey.id, `/indicateurs/${indId}/individus/${indivId}/commentaires`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'DEFAUT', contenu: '<p>Hi</p>', statut: 'PUBLIE' }),
      })
      expect(postRes.status).toBe(200)

      const getRes = await requestAs(apiKey.id, `/indicateurs/${indId}/individus/${indivId}/commentaires`)
      expect(getRes.status).toBe(200)
      const body = (await getRes.json()) as { total: number }
      expect(body.total).toBe(1)
    }),
  )

  it(
    'POST rejette un type hors enum du sujet (400)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE }],
      })

      const res = await requestAs(apiKey.id, `/indicateurs/${indId}/individus/${indivId}/commentaires`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'OBJECTIF', contenu: '', statut: 'BROUILLON' }), // OBJECTIF interdit côté indicateur
      })
      expect(res.status).toBe(400)
    }),
  )
})
```

> Note : si l’injection du principal via `runWithPrincipal` autour de `app.request` ne traverse pas l’`authContext` (selon l’implémentation de l’AsyncLocalStorage), se rabattre sur l’envoi d’un header `Authorization: Bearer` avec une vraie API key (`fixtures.apiKey({ rawKey })`) — vérifier le pattern dans `src/authentication/`.

- [ ] **Step 2 : Run** — `pnpm vitest src/commentaire/routes.test.ts` — Expected : PASS. Si l’injection du principal échoue (401), appliquer la note du Step 1.

- [ ] **Step 3 : Commit** — `git add apps/mb-api/src/commentaire/routes.test.ts && git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1581): tests HTTP routes commentaires"`

---

## Task 11 : Vérification finale

- [ ] **Step 1 : Suite complète du domaine** — `pnpm vitest src/commentaire` — Expected : tous PASS.
- [ ] **Step 2 : Lint global** — `pnpm lint` — Expected : vert.
- [ ] **Step 3 : OpenAPI** — démarrer l’app (ou générer le doc) et vérifier que `/openapi.json` expose les 8 routes commentaires avec les bons schémas. Run : `pnpm vitest -t "openapi"` si un test de doc existe, sinon contrôle manuel via `/docs`.
- [ ] **Step 4 : Commit final si correctifs** — message `[DITP-pilotage/pilote-2] feature(PIL-1581): finalisation commentaires libres`.

---

## Couverture spec (self-review)

- ✅ 3 sujets (indicateur+individu, panier+individu, panier global) — Tasks 4, 9.
- ✅ POST/GET scopés sujet, `individuId` dans le path — Task 9.
- ✅ `PUT`/`DELETE /commentaires/{id}` socle, espace d’id unifié — Tasks 8, 9.
- ✅ Statut BROUILLON/PUBLIE piloté par le PUT — Tasks 1, 8.
- ✅ Édition réservée à l’auteur + WRITE sur le sujet — Task 8.
- ✅ `contenu` `""` autorisé + `contenuTexte` dérivé — Tasks 1, 2, 6.
- ✅ Types `DEFAUT`/`OBJECTIF` ; exclusion `CONFIANCE` du listing — Tasks 1, 7.
- ✅ Permissions READ/WRITE déléguées au sujet — Tasks 3, 4, 8.
- ✅ Max 1 brouillon par (scope, auteur) (PIL-1585/1592) — Task 6 (`ensureUnSeulBrouillon` + test).
- ⏭️ Type `CONFIANCE` + `NiveauConfiance` + endpoints `niveau-confiance` → **plan séparé** `2026-06-24-niveau-confiance-impl.md`.

## Hors périmètre / à confirmer
- Check « contenu non vide à la publication » : non implémenté (question PO ouverte).

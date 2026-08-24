# Niveau de confiance (mb-api) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Exposer le **niveau de confiance** (création, édition, courant, historique) sur les trois sujets, au-dessus du socle `Commentaire` et des commentaires libres (PR #2227).

**Architecture :** Un niveau de confiance = un `Commentaire` de **type `CONFIANCE`** portant un ou plusieurs `NiveauConfiance` (relation **1:n**, historique d'indices). Réutilise le cœur générique des commentaires (`SujetCommentaireConfig`, `resolveCommentairePourEcriture`, `commentaireInclude`). Nouveau sous-domaine `src/commentaire/niveauConfiance/`.

**Tech Stack :** identique au plan commentaires libres (Hono + zod-openapi, Prisma 7, neverthrow, uuidv7, Vitest).

**Prérequis :** plan `2026-06-24-commentaires-libres-impl.md` mergé (socle, `sujets.ts`, `utils.ts`, `resolveCommentairePourEcriture.ts`, `ensureUnSeulBrouillon`, fixture commentaire).

**Décisions actées :**
- Édition d'un niveau de confiance : **n'importe lequel par son auteur** (mêmes règles que les commentaires libres — pas de contrainte « dernier publié »).
- **Sur édition de l'indice** : on **append** un nouveau `NiveauConfiance` (historique). L'indice « courant » d'un commentaire = le dernier par `createdAt`.
- Règle **1 brouillon par (scope, auteur)** : **séparée par section** — 1 brouillon libre + 1 brouillon niveau de confiance possibles simultanément. `ensureUnSeulBrouillon` doit filtrer par section (`CONFIANCE` vs non-`CONFIANCE`).
- **Courant d'un scope** = le dernier commentaire `CONFIANCE` **publié** du scope (par `id` desc) + son indice courant. 404 `ENTITY_NOT_FOUND` si aucun.
- **Historique** = les commentaires `CONFIANCE` **publiés** du scope, antichrono, chacun avec son indice courant (paginé comme les listings).

---

## File Structure

```
packages/mb-shared/src/commentaire.ts      # MODIFY: indiceConfianceSchema, niveauConfianceApiModel, bodies créer/modifier, historique
apps/mb-api/src/commentaire/
  ensureUnSeulBrouillon.ts                  # CREATE: extrait de creerCommentaire, rendu section-aware (réutilisé par les 2 sections)
  commands/creerCommentaire.ts              # MODIFY: utiliser ensureUnSeulBrouillon(section='LIBRE')
  utils.ts                                  # MODIFY: niveauConfianceInclude + toNiveauConfianceApiModel
  niveauConfiance/
    commands/creerNiveauConfiance.ts        # CREATE
    commands/modifierNiveauConfiance.ts     # CREATE
    commands/*.test.ts                      # CREATE
    queries/getNiveauConfianceCourant.ts    # CREATE
    queries/listerHistoriqueNiveauConfiance.ts # CREATE
    queries/*.test.ts                       # CREATE
    routes.ts                               # CREATE: 12 routes (3 sujets × {POST, PUT, GET courant, GET historique})
    routes.test.ts                          # CREATE: câblage OpenAPI
apps/mb-api/src/app.ts                      # MODIFY: monter niveauConfianceRoutes
```

---

## Task 1 : Schémas Zod niveau de confiance (`@pilote/mb-shared/commentaire`)

**Files:** Modify `packages/mb-shared/src/commentaire.ts`

- [ ] **Step 1 : Ajouter les schémas** (après les schémas commentaire existants)

```typescript
export const indiceConfianceSchema = z
  .enum(['OBJECTIF_COMPROMIS', 'APPUIS_NECESSAIRE', 'OBJECTIF_ATTEIGNABLE', 'OBJECTIF_SECURISE'])
  .describe('Indice de confiance (état d’avancement vis-à-vis des objectifs).')
export type IndiceConfiance = z.infer<typeof indiceConfianceSchema>

// Un niveau de confiance = un commentaire de type CONFIANCE + son indice courant.
export const niveauConfianceApiModelSchema = commentaireApiModelSchema
  .extend({ indice: indiceConfianceSchema })
  .describe('Niveau de confiance (commentaire CONFIANCE + indice courant).')
export type NiveauConfianceApiModel = z.infer<typeof niveauConfianceApiModelSchema>

export const creerNiveauConfianceBodySchema = z.object({
  indice: indiceConfianceSchema,
  contenu: z.string().describe('Justification HTML riche (la chaîne vide est autorisée).'),
  statut: commentaireStatutSchema,
})
export type CreerNiveauConfianceBody = z.infer<typeof creerNiveauConfianceBodySchema>

export const modifierNiveauConfianceBodySchema = z
  .object({
    indice: indiceConfianceSchema.optional().describe('Nouvel indice (append un NiveauConfiance).'),
    contenu: z.string().optional(),
    statut: commentaireStatutSchema.optional(),
  })
  .describe('Modification d’un niveau de confiance (indice / contenu / statut).')
export type ModifierNiveauConfianceBody = z.infer<typeof modifierNiveauConfianceBodySchema>

export const niveauConfianceListApiModelSchema =
  createPaginatedApiListSchema(niveauConfianceApiModelSchema)
export type NiveauConfianceListApiModel = z.infer<typeof niveauConfianceListApiModelSchema>
```

- [ ] **Step 2 : Commit** — `git add packages/mb-shared/src/commentaire.ts && git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1582): schémas Zod niveau de confiance (mb-shared)"`

---

## Task 2 : Extraire `ensureUnSeulBrouillon` (section-aware)

**Files:**
- Create: `apps/mb-api/src/commentaire/ensureUnSeulBrouillon.ts`
- Modify: `apps/mb-api/src/commentaire/commands/creerCommentaire.ts`

- [ ] **Step 1 : Créer le helper section-aware**

```typescript
import { ResultAsync } from 'neverthrow'

import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { ConflictError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { type Prisma } from '@/generated/prisma/client'

// Section fonctionnelle : les commentaires libres et les niveaux de confiance (CONFIANCE)
// sont deux sections distinctes, chacune limitée à 1 brouillon par (scope, auteur).
export type SectionCommentaire = 'LIBRE' | 'CONFIANCE'

const filtreSection = (section: SectionCommentaire): Prisma.CommentaireWhereInput => {
  const estConfiance: Prisma.CommentaireWhereInput = {
    OR: [
      { indicateurIndividu: { type: 'CONFIANCE' } },
      { panierIndividu: { type: 'CONFIANCE' } },
      { panier: { type: 'CONFIANCE' } },
    ],
  }
  return section === 'CONFIANCE' ? estConfiance : { NOT: estConfiance }
}

export const ensureUnSeulBrouillon = <P extends Record<string, string>>(
  config: SujetCommentaireConfig<P>,
  params: P,
  statut: 'BROUILLON' | 'PUBLIE',
  principalId: string,
  section: SectionCommentaire,
): ResultAsync<void, never> => {
  if (statut !== 'BROUILLON') return ResultAsync.fromSafePromise(Promise.resolve())
  return ResultAsync.fromSafePromise(
    db()
      .commentaire.count({
        where: {
          AND: [
            config.whereLecture(params, principalId),
            { statut: 'BROUILLON', createdBy: principalId },
            filtreSection(section),
          ],
        },
      })
      .then((count) => {
        if (count > 0) {
          throw new ConflictError('Un brouillon existe déjà pour cette section ; reprenez-le.')
        }
      }),
  )
}
```

- [ ] **Step 2 : Modifier `creerCommentaire.ts`** — supprimer la fonction `ensureUnSeulBrouillon` locale, importer celle extraite, et l'appeler avec `'LIBRE'` :

```typescript
import { ensureUnSeulBrouillon } from '@/commentaire/ensureUnSeulBrouillon'
// ...
config.resoudreCibleEcriture(params).andThen((cible) =>
  ensureUnSeulBrouillon(config, params, body.statut, cible.principalId, 'LIBRE').andThen(() =>
    // ... création inchangée
  ),
)
```

- [ ] **Step 3 : Vérifier** — `pnpm vitest run src/commentaire/commands/creerCommentaire.test.ts` (les tests existants doivent rester verts, dont le 409 brouillon).

- [ ] **Step 4 : Commit** — `git add apps/mb-api/src/commentaire/ensureUnSeulBrouillon.ts apps/mb-api/src/commentaire/commands/creerCommentaire.ts && git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1582): ensureUnSeulBrouillon section-aware"`

---

## Task 3 : Utils niveau de confiance (`utils.ts`)

**Files:** Modify `apps/mb-api/src/commentaire/utils.ts`

- [ ] **Step 1 : Ajouter include + mapping** (le niveau de confiance courant = dernier `NiveauConfiance` par `createdAt`)

```typescript
import { type NiveauConfianceApiModel } from '@pilote/mb-shared/commentaire'

// Include avec le dernier indice (courant) du commentaire.
export const niveauConfianceInclude = {
  ...commentaireInclude,
  niveauxConfiance: { orderBy: { createdAt: 'desc' }, take: 1 },
} satisfies Prisma.CommentaireInclude

export type NiveauConfianceRow = Prisma.CommentaireGetPayload<{
  include: typeof niveauConfianceInclude
}>

export const toNiveauConfianceApiModel = (row: NiveauConfianceRow): NiveauConfianceApiModel => {
  const indice = row.niveauxConfiance[0]?.indice
  if (!indice) {
    throw new Error(`Commentaire ${row.id} de type CONFIANCE sans NiveauConfiance`)
  }
  return { ...toCommentaireApiModel(row), indice }
}
```

- [ ] **Step 2 : Typecheck** — `pnpm exec tsc --noEmit`.
- [ ] **Step 3 : Commit** — `git add apps/mb-api/src/commentaire/utils.ts && git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1582): mapping niveau de confiance"`

---

## Task 4 : Command `creerNiveauConfiance`

**Files:**
- Create: `apps/mb-api/src/commentaire/niveauConfiance/commands/creerNiveauConfiance.ts`
- Test: `…/creerNiveauConfiance.test.ts`

- [ ] **Step 1 : Test (échec attendu)**

```typescript
import { describe, expect, it } from 'vitest'

import { creerNiveauConfiance } from '@/commentaire/niveauConfiance/commands/creerNiveauConfiance'
import { indicateurIndividuConfig } from '@/commentaire/sujets'
import { PermissionAction } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testIndividuId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('creerNiveauConfiance', () => {
  it(
    'crée un commentaire CONFIANCE + son indice',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        creerNiveauConfiance(indicateurIndividuConfig, {
          params: { indicateurId: indId, individuId: indivId },
          body: { indice: 'OBJECTIF_SECURISE', contenu: '<p>OK</p>', statut: 'PUBLIE' },
        }),
      )

      expect(result.isOk()).toBe(true)
      const model = result._unsafeUnwrap()
      expect(model.type).toBe('CONFIANCE')
      expect(model.indice).toBe('OBJECTIF_SECURISE')
      expect(model.contenuTexte).toBe('OK')
    }),
  )
})
```

- [ ] **Step 2 : Run → FAIL.**

- [ ] **Step 3 : Implémenter**

```typescript
import { type CreerNiveauConfianceBody, type NiveauConfianceApiModel } from '@pilote/mb-shared/commentaire'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { ensureUnSeulBrouillon } from '@/commentaire/ensureUnSeulBrouillon'
import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { htmlToPlainText, niveauConfianceInclude, toNiveauConfianceApiModel } from '@/commentaire/utils'
import { db } from '@/framework/persistence/dbStore'

type CreerNiveauConfianceParams<P extends Record<string, string>> = {
  params: P
  body: CreerNiveauConfianceBody
}

export const creerNiveauConfiance = <P extends Record<string, string>>(
  config: SujetCommentaireConfig<P>,
  { params, body }: CreerNiveauConfianceParams<P>,
): ResultAsync<NiveauConfianceApiModel, never> =>
  config.resoudreCibleEcriture(params).andThen((cible) =>
    ensureUnSeulBrouillon(config, params, body.statut, cible.principalId, 'CONFIANCE').andThen(() =>
      ResultAsync.fromSafePromise(
        db().commentaire.create({
          data: {
            id: uuidv7(),
            contenu: body.contenu,
            contenuTexte: htmlToPlainText(body.contenu),
            statut: body.statut,
            createdBy: cible.principalId,
            updatedBy: cible.principalId,
            ...cible.satelliteCreate('CONFIANCE'),
            niveauxConfiance: { create: { id: uuidv7(), indice: body.indice } },
          },
          include: niveauConfianceInclude,
        }),
      ).map(toNiveauConfianceApiModel),
    ),
  )
```

- [ ] **Step 4 : Run → PASS.**
- [ ] **Step 5 : Commit** — `git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1582): command creerNiveauConfiance"`

---

## Task 5 : Command `modifierNiveauConfiance`

**Files:**
- Create: `apps/mb-api/src/commentaire/niveauConfiance/commands/modifierNiveauConfiance.ts`
- Test: `…/modifierNiveauConfiance.test.ts`

- [ ] **Step 1 : Test (échec attendu)** — vérifie : modif contenu/statut par l'auteur + append d'un nouvel indice quand `indice` fourni.

```typescript
import { describe, expect, it } from 'vitest'

import { creerNiveauConfiance } from '@/commentaire/niveauConfiance/commands/creerNiveauConfiance'
import { modifierNiveauConfiance } from '@/commentaire/niveauConfiance/commands/modifierNiveauConfiance'
import { indicateurIndividuConfig } from '@/commentaire/sujets'
import { db } from '@/framework/persistence/dbStore'
import { PermissionAction } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testIndividuId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('modifierNiveauConfiance', () => {
  it(
    'change l’indice (append) et le contenu, par l’auteur',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE }],
      })
      const cree = await runAsPrincipal(apiKey.id, () =>
        creerNiveauConfiance(indicateurIndividuConfig, {
          params: { indicateurId: indId, individuId: indivId },
          body: { indice: 'ORAGE' in {} ? 'OBJECTIF_COMPROMIS' : 'OBJECTIF_COMPROMIS', contenu: '', statut: 'PUBLIE' },
        }),
      )
      const commentaireId = cree._unsafeUnwrap().id

      const result = await runAsPrincipal(apiKey.id, () =>
        modifierNiveauConfiance(commentaireId, { indice: 'OBJECTIF_SECURISE', contenu: '<p>maj</p>' }),
      )

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap().indice).toBe('OBJECTIF_SECURISE')
      const count = await db().niveauConfiance.count({ where: { commentaireId } })
      expect(count).toBe(2) // historique : 2 indices
    }),
  )
})
```

- [ ] **Step 2 : Run → FAIL.**

- [ ] **Step 3 : Implémenter** (réutilise `resolveCommentairePourEcriture` : auteur + WRITE)

```typescript
import { type ModifierNiveauConfianceBody, type NiveauConfianceApiModel } from '@pilote/mb-shared/commentaire'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { resolveCommentairePourEcriture } from '@/commentaire/resolveCommentairePourEcriture'
import { htmlToPlainText, niveauConfianceInclude, toNiveauConfianceApiModel } from '@/commentaire/utils'
import { db } from '@/framework/persistence/dbStore'

export const modifierNiveauConfiance = (
  commentaireId: string,
  body: ModifierNiveauConfianceBody,
): ResultAsync<NiveauConfianceApiModel, never> =>
  resolveCommentairePourEcriture(commentaireId).andThen(({ principalId }) =>
    ResultAsync.fromSafePromise(
      db().commentaire.update({
        where: { id: commentaireId },
        data: {
          ...(body.contenu !== undefined
            ? { contenu: body.contenu, contenuTexte: htmlToPlainText(body.contenu) }
            : {}),
          ...(body.statut !== undefined ? { statut: body.statut } : {}),
          updatedBy: principalId,
          // append d'un nouvel indice (historique) si fourni
          ...(body.indice !== undefined
            ? { niveauxConfiance: { create: { id: uuidv7(), indice: body.indice } } }
            : {}),
        },
        include: niveauConfianceInclude,
      }),
    ).map(toNiveauConfianceApiModel),
  )
```

- [ ] **Step 4 : Run → PASS.** (Corriger l'écriture du body dans le test : `indice: 'OBJECTIF_COMPROMIS'`.)
- [ ] **Step 5 : Commit** — `git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1583): command modifierNiveauConfiance"`

---

## Task 6 : Query `getNiveauConfianceCourant`

**Files:**
- Create: `apps/mb-api/src/commentaire/niveauConfiance/queries/getNiveauConfianceCourant.ts`
- Test: `…/getNiveauConfianceCourant.test.ts`

- [ ] **Step 1 : Test** — courant = dernier CONFIANCE **publié** du scope ; 404 si aucun.

```typescript
import { describe, expect, it } from 'vitest'

import { creerNiveauConfiance } from '@/commentaire/niveauConfiance/commands/creerNiveauConfiance'
import { getNiveauConfianceCourant } from '@/commentaire/niveauConfiance/queries/getNiveauConfianceCourant'
import { indicateurIndividuConfig } from '@/commentaire/sujets'
import { PermissionAction } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testIndividuId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('getNiveauConfianceCourant', () => {
  it(
    'retourne le dernier niveau de confiance publié du scope',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE }],
      })
      const params = { indicateurId: indId, individuId: indivId }
      await runAsPrincipal(apiKey.id, () =>
        creerNiveauConfiance(indicateurIndividuConfig, {
          params,
          body: { indice: 'OBJECTIF_COMPROMIS', contenu: '', statut: 'PUBLIE' },
        }),
      )
      await runAsPrincipal(apiKey.id, () =>
        creerNiveauConfiance(indicateurIndividuConfig, {
          params,
          body: { indice: 'OBJECTIF_SECURISE', contenu: '', statut: 'PUBLIE' },
        }),
      )

      const result = await runAsPrincipal(apiKey.id, () =>
        getNiveauConfianceCourant(indicateurIndividuConfig, { params }),
      )

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap().indice).toBe('OBJECTIF_SECURISE')
    }),
  )
})
```

- [ ] **Step 2 : Run → FAIL.**

- [ ] **Step 3 : Implémenter** (filtre CONFIANCE + PUBLIE, dernier par `id desc`, `findFirstOrThrow` → 404 si aucun)

```typescript
import { type NiveauConfianceApiModel } from '@pilote/mb-shared/commentaire'
import { ResultAsync } from 'neverthrow'

import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { niveauConfianceInclude, toNiveauConfianceApiModel } from '@/commentaire/utils'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { type Prisma } from '@/generated/prisma/client'

const CONFIANCE: Prisma.CommentaireWhereInput = {
  OR: [
    { indicateurIndividu: { type: 'CONFIANCE' } },
    { panierIndividu: { type: 'CONFIANCE' } },
    { panier: { type: 'CONFIANCE' } },
  ],
}

export const getNiveauConfianceCourant = <P extends Record<string, string>>(
  config: SujetCommentaireConfig<P>,
  { params }: { params: P },
): ResultAsync<NiveauConfianceApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().commentaire.findFirstOrThrow({
      where: { AND: [config.whereLecture(params, principalId), CONFIANCE, { statut: 'PUBLIE' }] },
      orderBy: { id: 'desc' },
      include: niveauConfianceInclude,
    }),
  ).map(toNiveauConfianceApiModel)
}
```

- [ ] **Step 4 : Run → PASS.**
- [ ] **Step 5 : Commit** — `git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1581): query getNiveauConfianceCourant"`

---

## Task 7 : Query `listerHistoriqueNiveauConfiance`

**Files:**
- Create: `apps/mb-api/src/commentaire/niveauConfiance/queries/listerHistoriqueNiveauConfiance.ts`
- Test: `…/listerHistoriqueNiveauConfiance.test.ts`

- [ ] **Step 1 : Test** — liste paginée antichrono des niveaux de confiance **publiés** du scope.

```typescript
import { describe, expect, it } from 'vitest'

import { creerNiveauConfiance } from '@/commentaire/niveauConfiance/commands/creerNiveauConfiance'
import { listerHistoriqueNiveauConfiance } from '@/commentaire/niveauConfiance/queries/listerHistoriqueNiveauConfiance'
import { indicateurIndividuConfig } from '@/commentaire/sujets'
import { PermissionAction } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testIndividuId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('listerHistoriqueNiveauConfiance', () => {
  it(
    'liste les niveaux de confiance publiés en antichronologique',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE }],
      })
      const params = { indicateurId: indId, individuId: indivId }
      for (const indice of ['OBJECTIF_COMPROMIS', 'OBJECTIF_ATTEIGNABLE'] as const) {
        await runAsPrincipal(apiKey.id, () =>
          creerNiveauConfiance(indicateurIndividuConfig, { params, body: { indice, contenu: '', statut: 'PUBLIE' } }),
        )
      }

      const result = await runAsPrincipal(apiKey.id, () =>
        listerHistoriqueNiveauConfiance(indicateurIndividuConfig, { params, query: {} }),
      )

      expect(result._unsafeUnwrap().total).toBe(2)
      expect(result._unsafeUnwrap().items[0]?.indice).toBe('OBJECTIF_ATTEIGNABLE') // plus récent d'abord
    }),
  )
})
```

- [ ] **Step 2 : Run → FAIL.**

- [ ] **Step 3 : Implémenter**

```typescript
import {
  type NiveauConfianceListApiModel,
  type ListerCommentairesQuery,
} from '@pilote/mb-shared/commentaire'
import { ResultAsync } from 'neverthrow'

import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { niveauConfianceInclude, toNiveauConfianceApiModel } from '@/commentaire/utils'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { type Prisma } from '@/generated/prisma/client'

const CONFIANCE_PUBLIE: Prisma.CommentaireWhereInput = {
  statut: 'PUBLIE',
  OR: [
    { indicateurIndividu: { type: 'CONFIANCE' } },
    { panierIndividu: { type: 'CONFIANCE' } },
    { panier: { type: 'CONFIANCE' } },
  ],
}

export const listerHistoriqueNiveauConfiance = <P extends Record<string, string>>(
  config: SujetCommentaireConfig<P>,
  { params, query }: { params: P; query: ListerCommentairesQuery },
): ResultAsync<NiveauConfianceListApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  const where: Prisma.CommentaireWhereInput = {
    AND: [config.whereLecture(params, principalId), CONFIANCE_PUBLIE],
  }
  const fetchPage = db().commentaire.findMany({
    where,
    orderBy: { id: 'desc' },
    include: niveauConfianceInclude,
    ...buildPaginationArgs(query.cursor, query.pageSize),
  })
  const fetchTotal = db().commentaire.count({ where })
  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toNiveauConfianceApiModel, query.pageSize),
  )
}
```

- [ ] **Step 4 : Run → PASS.**
- [ ] **Step 5 : Commit** — `git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1584): query listerHistoriqueNiveauConfiance"`

---

## Task 8 : Routes + montage

**Files:**
- Create: `apps/mb-api/src/commentaire/niveauConfiance/routes.ts`
- Modify: `apps/mb-api/src/app.ts`

- [ ] **Step 1 : Routes** — 3 sujets × { `POST .../niveau-confiance`, `PUT /niveau-confiance/{commentaireId}`, `GET .../niveau-confiance` (courant), `GET .../niveau-confiance/historique` }. Suit exactement le pattern de `commentaire/routes.ts` (handlers `.match(ok, never)`, `withTransaction(async () => …)` pour POST/PUT). Le `PUT` est par `commentaireId` (espace d'id unifié) : `path: '/niveau-confiance/{commentaireId}'`.

Modèle pour le sujet indicateur+individu (à décliner pour panier+individu et panier global, en changeant path/params/config) :

```typescript
const creerRoute = createRoute({
  method: 'post',
  path: '/indicateurs/{indicateurId}/individus/{individuId}/niveau-confiance',
  tags: ['NiveauConfiance'],
  summary: 'Créer un niveau de confiance (indicateur + individu)',
  middleware: [requireAuthentication],
  request: {
    params: z.object({ indicateurId: indicateurPublicIdSchema, individuId: individuPublicIdSchema }),
    body: { content: { 'application/json': { schema: creerNiveauConfianceBodySchema } }, required: true },
  },
  responses: reponseNiveauConfiance,
})
niveauConfianceRoutes.openapi(creerRoute, async (context) => {
  const params = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(async () => creerNiveauConfiance(indicateurIndividuConfig, { params, body }))
  return result.match((data) => jsonResponseOk({ context, data, schema: NiveauConfianceApiModelSchema, status: 200 }), never)
})

const courantRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{indicateurId}/individus/{individuId}/niveau-confiance',
  tags: ['NiveauConfiance'],
  summary: 'Niveau de confiance courant',
  middleware: [requireAuthentication],
  request: { params: z.object({ indicateurId: indicateurPublicIdSchema, individuId: individuPublicIdSchema }) },
  responses: reponseNiveauConfiance,
})
niveauConfianceRoutes.openapi(courantRoute, async (context) => {
  const params = context.req.valid('param')
  return getNiveauConfianceCourant(indicateurIndividuConfig, { params }).match(
    (data) => jsonResponseOk({ context, data, schema: NiveauConfianceApiModelSchema, status: 200 }),
    never,
  )
})

const historiqueRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{indicateurId}/individus/{individuId}/niveau-confiance/historique',
  tags: ['NiveauConfiance'],
  summary: 'Historique des niveaux de confiance',
  middleware: [requireAuthentication],
  request: {
    params: z.object({ indicateurId: indicateurPublicIdSchema, individuId: individuPublicIdSchema }),
    query: listerCommentairesQuerySchema,
  },
  responses: { 200: { content: { 'application/json': { schema: NiveauConfianceListApiModelSchema } }, description: 'Historique paginé' }, 404: { content: { 'application/json': { schema: ErrorApiModelSchema } }, description: 'Sujet introuvable' } },
})
niveauConfianceRoutes.openapi(historiqueRoute, async (context) => {
  const params = context.req.valid('param')
  const query = context.req.valid('query')
  return listerHistoriqueNiveauConfiance(indicateurIndividuConfig, { params, query }).match(
    (data) => jsonResponseOk({ context, data, schema: NiveauConfianceListApiModelSchema, status: 200 }),
    never,
  )
})
```

Et la mutation par id (un seul handler, comme le socle) :

```typescript
const modifierRoute = createRoute({
  method: 'put',
  path: '/niveau-confiance/{commentaireId}',
  tags: ['NiveauConfiance'],
  summary: 'Modifier un niveau de confiance (auteur uniquement)',
  middleware: [requireAuthentication],
  request: {
    params: z.object({ commentaireId: z.string().uuid() }),
    body: { content: { 'application/json': { schema: modifierNiveauConfianceBodySchema } }, required: true },
  },
  responses: reponseNiveauConfiance,
})
niveauConfianceRoutes.openapi(modifierRoute, async (context) => {
  const { commentaireId } = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(async () => modifierNiveauConfiance(commentaireId, body))
  return result.match((data) => jsonResponseOk({ context, data, schema: NiveauConfianceApiModelSchema, status: 200 }), never)
})
```

- [ ] **Step 2 : Monter dans `app.ts`** — `import { niveauConfianceRoutes } from '@/commentaire/niveauConfiance/routes'` + `app.route('/', niveauConfianceRoutes)` (après `commentaireRoutes`).

- [ ] **Step 3 : Lint** — `pnpm lint` → vert.
- [ ] **Step 4 : Commit** — `git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1582): routes niveau de confiance (3 sujets)"`

---

## Task 9 : Tests câblage OpenAPI + vérification finale

**Files:** Create `apps/mb-api/src/commentaire/niveauConfiance/routes.test.ts`

- [ ] **Step 1 : Test câblage** (sur le modèle de `commentaire/routes.test.ts`) — vérifier que `/openapi.json` expose les routes `…/niveau-confiance`, `…/niveau-confiance/historique`, `/niveau-confiance/{commentaireId}` (3 sujets) et un 401 non authentifié.

- [ ] **Step 2 : Suite complète** — `pnpm vitest run` → tous PASS.
- [ ] **Step 3 : Lint** — `pnpm lint` → vert.
- [ ] **Step 4 : Commit final.**

---

## Couverture spec (self-review)

- ✅ Création niveau de confiance (PIL-1582/1589) — Task 4.
- ✅ Édition par l'auteur + append indice (PIL-1583/1590) — Task 5.
- ✅ Courant + historique (PIL-1581/1584/1588/1591) — Tasks 6, 7.
- ✅ Brouillon séparé par section — Task 2.
- ✅ 3 sujets — Task 8.
- ✅ Statut brouillon/publié (socle) — réutilisé.

## Hors périmètre / à confirmer
- Granularité de l'historique : ici **par commentaire `CONFIANCE` publié** (chacun avec son indice courant). L'historique intra-commentaire des indices (append) reste en base pour usages futurs mais n'est pas exposé.
- `GET courant` renvoie **404** si aucun niveau publié (le front gère l'état vide). À confirmer si un 200 + corps `null` est préféré.

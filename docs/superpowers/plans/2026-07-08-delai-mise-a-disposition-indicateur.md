# Délai de mise à disposition d'un indicateur — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une métadonnée « délai de mise à disposition » à un indicateur et exposer/afficher trois dates dérivées (dernière valeur, prochaine valeur théorique, mise à disposition).

**Architecture:** Le délai est stocké en base (deux colonnes `nombre` + `unité`). L'API calcule les dates dérivées via un helper pur (arithmétique `Temporal.PlainDate`) et les expose dans `IndicateurApiModel` (partagé liste ↔ détail). La webapp est du pur affichage ; l'admin édite le délai.

**Tech Stack:** Prisma 7, Zod (`@pilote/kpilote-shared`), Hono zod-openapi, neverthrow, `@js-temporal/polyfill`, React Hook Form (admin), TanStack (webapp), Vitest.

**Spec :** `docs/superpowers/specs/2026-07-08-delai-mise-a-disposition-indicateur-design.md`

## Global Constraints

- **Exports/imports nommés uniquement** — jamais de `default`.
- **Params de helpers sous forme d'objet nommé**, pas de positionnels.
- **Use cases mb-api en `ResultAsync`** (neverthrow) ; wrap des promesses via `ResultAsync.fromSafePromise`.
- **Tests mb-api** : `integrationTest`, `uuidv7` (jamais `randomUUID`), valeurs hardcodées (isolation transactionnelle), fixtures `fixtures.<entity>(...)` variadic.
- **Prisma** : pas de `$transaction` nesté (awaits séquentiels) ; pas de `select` granulaires.
- **Copie FR** correcte et accentuée.
- Le délai est un couple **les-deux-ou-aucun** : `nombre` (int ≥ 1) + `unité` renseignés ensemble, sinon `null`.
- Dates dérivées : chaînes ISO `YYYY-MM-DD` ou `null` ; affichage webapp en **mois-année** ; `—` si `null`.
- `periodeMiseAJour` / `jourMiseAJour` : **inchangés**, `jourMiseAJour` ignoré du calcul.

---

## File Structure

- `apps/kpilote-api/prisma/schema.prisma` — enum `UniteDuree` + 2 champs sur `Indicateur` (Task 1).
- `apps/kpilote-api/prisma/migrations/<ts>_ajout_delai_mise_a_disposition/` — migration (Task 1).
- `packages/kpilote-shared/src/indicateur.ts` — schémas/types délai + dates dérivées (Task 2).
- `apps/kpilote-api/src/indicateur/datesMiseADisposition.ts` (+ `.test.ts`) — helper pur (Task 3).
- `apps/kpilote-api/src/indicateur/utils.ts` — mapper (Task 4).
- `apps/kpilote-api/src/indicateur/queries/getIndicateurByPublicId.ts` — MAX date détail (Task 4).
- `apps/kpilote-api/src/indicateur/queries/listIndicateurs.ts` — MAX date liste via `groupBy` (Task 4).
- `apps/kpilote-api/src/indicateur/queries/getIndicateurByPublicId.test.ts` — MAJ assertions (Task 4).
- `apps/kpilote-api/src/indicateur/commands/upsertIndicateur.ts` (+ `.test.ts`) — écriture délai (Task 5).
- `apps/kpilote-admin/src/components/indicateurs/indicateurFormSchema.ts` + `IndicateurForm.tsx` — champ délai (Task 6).
- `apps/kpilote-webapp/src/lib/format.ts` (+ `.test.ts`) + `components/indicateurs/IndicateurMetadonnees.tsx` — affichage (Task 7).

---

### Task 1 : Prisma — enum `UniteDuree` + champs délai + migration

**Files:**
- Modify: `apps/kpilote-api/prisma/schema.prisma`
- Create: `apps/kpilote-api/prisma/migrations/<timestamp>_ajout_delai_mise_a_disposition/migration.sql` (généré)

**Interfaces:**
- Produces: colonnes Prisma `delaiMiseADispositionNombre: Int?`, `delaiMiseADispositionUnite: UniteDuree?` sur `Indicateur` ; enum `UniteDuree { JOURS | SEMAINES | MOIS | ANNEES }`. Modèle généré `IndicateurModel` porte ces champs.

- [ ] **Step 1 : Ajouter les 2 champs sur `model Indicateur`**

Dans `apps/kpilote-api/prisma/schema.prisma`, juste après la ligne `jourMiseAJour Int? @map("jour_mise_a_jour")` :

```prisma
  delaiMiseADispositionNombre Int?        @map("delai_mad_nombre")
  delaiMiseADispositionUnite  UniteDuree? @map("delai_mad_unite")
```

- [ ] **Step 2 : Ajouter l'enum `UniteDuree`**

Après l'enum `PeriodeMiseAJour` (bloc `@@map("periode_mise_a_jour_enum")`) :

```prisma
enum UniteDuree {
  JOURS
  SEMAINES
  MOIS
  ANNEES

  @@map("unite_duree_enum")
}
```

- [ ] **Step 3 : Générer la migration (DB de dev requise up)**

Run : `pnpm -F @pilote/kpilote-api exec prisma migrate dev --name ajout_delai_mise_a_disposition`
Expected : nouvelle migration créée + appliquée ; client Prisma régénéré.

- [ ] **Step 4 : Régénérer le client au format du repo**

Run : `pnpm -F @pilote/kpilote-api prisma:generate`
Expected : `apps/kpilote-api/src/generated/prisma` à jour (types `UniteDuree`, champs `delaiMiseADisposition*`).

- [ ] **Step 5 : Vérifier la compilation du client généré**

Run : `pnpm -F @pilote/kpilote-api exec tsc --noEmit`
Expected : PASS (aucun consommateur des nouveaux champs encore).

- [ ] **Step 6 : Commit**

```bash
git add apps/kpilote-api/prisma/schema.prisma apps/kpilote-api/prisma/migrations apps/kpilote-api/src/generated
git commit -m "feat(indicateur): schéma délai de mise à disposition (Prisma + migration)"
```

---

### Task 2 : `kpilote-shared` — schémas délai + dates dérivées

**Files:**
- Modify: `packages/kpilote-shared/src/indicateur.ts`

**Interfaces:**
- Consumes: `dateSchema` de `./dates` (existant).
- Produces :
  - `UNITES_DUREE: readonly ['JOURS','SEMAINES','MOIS','ANNEES']`, `type UniteDuree`.
  - `UNITE_DUREE_LABELS: Record<UniteDuree, string>`.
  - `uniteDureeSchema`, `delaiMiseADispositionSchema`, `type DelaiMiseADisposition = { nombre: number; unite: UniteDuree }`.
  - `indicateurMetadonneesSchema` gagne `delaiMiseADisposition: DelaiMiseADisposition | null` (donc éditable via upsert `.partial()` et lisible via apiModel).
  - `indicateurApiModelSchema` gagne `dateDerniereValeur`, `dateProchaineValeur`, `dateMiseADisposition` (`string | null`).

> Note : entre cette task et la Task 4, `tsc` de `kpilote-api` sera **rouge** (le mapper ne produit pas encore les nouveaux champs requis). C'est attendu ; le vert revient en Task 4. `kpilote-shared` lui-même reste vert.

- [ ] **Step 1 : Importer `dateSchema`**

En tête de `packages/kpilote-shared/src/indicateur.ts`, ajouter à l'import existant depuis `./dates` (ou créer l'import) :

```ts
import { dateSchema } from './dates'
```

- [ ] **Step 2 : Ajouter le catalogue + schémas de durée**

Juste avant `export const indicateurMetadonneesSchema = z.object({` :

```ts
export const UNITES_DUREE = ['JOURS', 'SEMAINES', 'MOIS', 'ANNEES'] as const
export type UniteDuree = (typeof UNITES_DUREE)[number]

// Libellés d'affichage des unités de durée, partagés admin (formulaire) et
// webapp (fiche indicateur) pour éviter la divergence.
export const UNITE_DUREE_LABELS: Record<UniteDuree, string> = {
  JOURS: 'jour(s)',
  SEMAINES: 'semaine(s)',
  MOIS: 'mois',
  ANNEES: 'an(s)',
}

export const uniteDureeSchema = z
  .enum(UNITES_DUREE)
  .describe("Unité de durée d'un délai (jours, semaines, mois, années).")

export const delaiMiseADispositionSchema = z
  .object({
    nombre: z.int().min(1).describe("Nombre d'unités du délai (entier ≥ 1)."),
    unite: uniteDureeSchema,
  })
  .describe(
    "Délai entre la date théorique d'une valeur et sa mise à disposition effective.",
  )
export type DelaiMiseADisposition = z.infer<typeof delaiMiseADispositionSchema>
```

- [ ] **Step 3 : Ajouter le délai aux métadonnées éditables**

Dans `indicateurMetadonneesSchema = z.object({ ... })`, après le champ `jourMiseAJour` :

```ts
  delaiMiseADisposition: delaiMiseADispositionSchema
    .nullable()
    .describe('Délai de mise à disposition, ou `null` si non renseigné.'),
```

- [ ] **Step 4 : Ajouter les 3 dates dérivées à l'API model (lecture seule)**

Dans `indicateurApiModelSchema = z.object({ ... })`, juste avant `createdAt:` :

```ts
  dateDerniereValeur: dateSchema
    .nullable()
    .describe(
      'Date ISO YYYY-MM-DD de la dernière valeur connue (MAX, tous individus), ou `null` si aucune valeur.',
    ),
  dateProchaineValeur: dateSchema
    .nullable()
    .describe(
      'Date ISO YYYY-MM-DD de la prochaine valeur théorique (dernière valeur + période), ou `null`.',
    ),
  dateMiseADisposition: dateSchema
    .nullable()
    .describe(
      'Date ISO YYYY-MM-DD de mise à disposition (prochaine valeur + délai), ou `null`.',
    ),
```

- [ ] **Step 5 : Vérifier le formatage/typecheck du package partagé**

Run : `pnpm -F @pilote/kpilote-shared exec tsc --noEmit && pnpm -F @pilote/kpilote-shared format:check`
Expected : PASS.

- [ ] **Step 6 : Commit**

```bash
git add packages/kpilote-shared/src/indicateur.ts
git commit -m "feat(shared): schémas délai de mise à disposition + dates dérivées indicateur"
```

---

### Task 3 : mb-api — helper pur de calcul des dates (TDD)

**Files:**
- Create: `apps/kpilote-api/src/indicateur/datesMiseADisposition.ts`
- Test: `apps/kpilote-api/src/indicateur/datesMiseADisposition.test.ts`

**Interfaces:**
- Consumes: `PeriodeMiseAJour`, `DelaiMiseADisposition` de `@pilote/kpilote-shared/indicateur`.
- Produces: `computeDatesMiseADisposition({ dateDerniereValeur, periodeMiseAJour, delai })` → `{ dateDerniereValeur: string | null; dateProchaineValeur: string | null; dateMiseADisposition: string | null }`.

- [ ] **Step 1 : Écrire les tests (qui échouent)**

Créer `apps/kpilote-api/src/indicateur/datesMiseADisposition.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { computeDatesMiseADisposition } from '@/indicateur/datesMiseADisposition'

describe('computeDatesMiseADisposition', () => {
  it('scénario données fiscales : annuelle + délai semestre', () => {
    expect(
      computeDatesMiseADisposition({
        dateDerniereValeur: '2023-12-01',
        periodeMiseAJour: 'ANNUELLE',
        delai: { nombre: 6, unite: 'MOIS' },
      }),
    ).toEqual({
      dateDerniereValeur: '2023-12-01',
      dateProchaineValeur: '2024-12-01',
      dateMiseADisposition: '2025-06-01',
    })
  })

  it('délai annuel : mise à dispo un an après la prochaine valeur', () => {
    expect(
      computeDatesMiseADisposition({
        dateDerniereValeur: '2023-12-01',
        periodeMiseAJour: 'ANNUELLE',
        delai: { nombre: 1, unite: 'ANNEES' },
      }).dateMiseADisposition,
    ).toBe('2025-12-01')
  })

  it('mappe chaque période vers le bon intervalle', () => {
    const base = { dateDerniereValeur: '2024-01-15', delai: null }
    const prochaine = (periodeMiseAJour: Parameters<typeof computeDatesMiseADisposition>[0]['periodeMiseAJour']) =>
      computeDatesMiseADisposition({ ...base, periodeMiseAJour }).dateProchaineValeur
    expect(prochaine('QUOTIDIENNE')).toBe('2024-01-16')
    expect(prochaine('HEBDOMADAIRE')).toBe('2024-01-22')
    expect(prochaine('BIMENSUELLE')).toBe('2024-01-30')
    expect(prochaine('MENSUELLE')).toBe('2024-02-15')
    expect(prochaine('TRIMESTRIELLE')).toBe('2024-04-15')
    expect(prochaine('SEMESTRIELLE')).toBe('2024-07-15')
    expect(prochaine('ANNUELLE')).toBe('2025-01-15')
  })

  it('clampe le jour en cas de débordement de mois (31 janv. + 1 mois)', () => {
    expect(
      computeDatesMiseADisposition({
        dateDerniereValeur: '2024-01-31',
        periodeMiseAJour: 'MENSUELLE',
        delai: null,
      }).dateProchaineValeur,
    ).toBe('2024-02-29') // 2024 bissextile
  })

  it('délai en jours et semaines', () => {
    const commun = { dateDerniereValeur: '2024-01-15', periodeMiseAJour: 'AUCUNE' as const }
    // AUCUNE → pas de prochaine valeur, donc on teste le délai sur une prochaine calculée
    expect(
      computeDatesMiseADisposition({
        dateDerniereValeur: '2024-01-15',
        periodeMiseAJour: 'MENSUELLE',
        delai: { nombre: 10, unite: 'JOURS' },
      }).dateMiseADisposition,
    ).toBe('2024-02-25')
    expect(
      computeDatesMiseADisposition({
        dateDerniereValeur: '2024-01-15',
        periodeMiseAJour: 'MENSUELLE',
        delai: { nombre: 2, unite: 'SEMAINES' },
      }).dateMiseADisposition,
    ).toBe('2024-02-29')
    void commun
  })

  it('propage les null : pas de valeur, période AUCUNE/null, délai absent', () => {
    expect(
      computeDatesMiseADisposition({ dateDerniereValeur: null, periodeMiseAJour: 'ANNUELLE', delai: { nombre: 6, unite: 'MOIS' } }),
    ).toEqual({ dateDerniereValeur: null, dateProchaineValeur: null, dateMiseADisposition: null })

    expect(
      computeDatesMiseADisposition({ dateDerniereValeur: '2023-12-01', periodeMiseAJour: 'AUCUNE', delai: { nombre: 6, unite: 'MOIS' } }),
    ).toEqual({ dateDerniereValeur: '2023-12-01', dateProchaineValeur: null, dateMiseADisposition: null })

    expect(
      computeDatesMiseADisposition({ dateDerniereValeur: '2023-12-01', periodeMiseAJour: null, delai: null }),
    ).toEqual({ dateDerniereValeur: '2023-12-01', dateProchaineValeur: null, dateMiseADisposition: null })

    expect(
      computeDatesMiseADisposition({ dateDerniereValeur: '2023-12-01', periodeMiseAJour: 'ANNUELLE', delai: null }),
    ).toEqual({ dateDerniereValeur: '2023-12-01', dateProchaineValeur: '2024-12-01', dateMiseADisposition: null })
  })
})
```

- [ ] **Step 2 : Lancer le test → échec**

Run : `pnpm -F @pilote/kpilote-api exec vitest run src/indicateur/datesMiseADisposition.test.ts`
Expected : FAIL (`computeDatesMiseADisposition` introuvable).

- [ ] **Step 3 : Implémenter le helper**

Créer `apps/kpilote-api/src/indicateur/datesMiseADisposition.ts` :

```ts
import { Temporal } from '@js-temporal/polyfill'

import {
  type DelaiMiseADisposition,
  type PeriodeMiseAJour,
  type UniteDuree,
} from '@pilote/kpilote-shared/indicateur'

export type DatesMiseADisposition = {
  dateDerniereValeur: string | null
  dateProchaineValeur: string | null
  dateMiseADisposition: string | null
}

// Intervalle à ajouter à la dernière valeur connue pour obtenir la prochaine
// occurrence théorique. `BIMENSUELLE` (2×/mois) est approximée à 15 jours ;
// `AUCUNE` n'a pas d'occurrence suivante.
const DUREE_PAR_PERIODE: Record<PeriodeMiseAJour, Temporal.DurationLike | null> = {
  QUOTIDIENNE: { days: 1 },
  HEBDOMADAIRE: { days: 7 },
  BIMENSUELLE: { days: 15 },
  MENSUELLE: { months: 1 },
  TRIMESTRIELLE: { months: 3 },
  SEMESTRIELLE: { months: 6 },
  ANNUELLE: { years: 1 },
  AUCUNE: null,
}

const UNITE_DUREE_TO_TEMPORAL: Record<UniteDuree, 'days' | 'weeks' | 'months' | 'years'> = {
  JOURS: 'days',
  SEMAINES: 'weeks',
  MOIS: 'months',
  ANNEES: 'years',
}

// `Temporal.PlainDate.add` utilise overflow: 'constrain' par défaut : 31 janv.
// + 1 mois → dernier jour de février (clamp), ce qui correspond au besoin.
const ajouter = (date: string, duree: Temporal.DurationLike): string =>
  Temporal.PlainDate.from(date).add(duree).toString()

const computeProchaineValeur = (
  dateDerniereValeur: string | null,
  periodeMiseAJour: PeriodeMiseAJour | null,
): string | null => {
  if (dateDerniereValeur === null || periodeMiseAJour === null) return null
  const duree = DUREE_PAR_PERIODE[periodeMiseAJour]
  if (duree === null) return null
  return ajouter(dateDerniereValeur, duree)
}

const computeMiseADisposition = (
  dateProchaineValeur: string | null,
  delai: DelaiMiseADisposition | null,
): string | null => {
  if (dateProchaineValeur === null || delai === null) return null
  return ajouter(dateProchaineValeur, { [UNITE_DUREE_TO_TEMPORAL[delai.unite]]: delai.nombre })
}

export const computeDatesMiseADisposition = ({
  dateDerniereValeur,
  periodeMiseAJour,
  delai,
}: {
  dateDerniereValeur: string | null
  periodeMiseAJour: PeriodeMiseAJour | null
  delai: DelaiMiseADisposition | null
}): DatesMiseADisposition => {
  const dateProchaineValeur = computeProchaineValeur(dateDerniereValeur, periodeMiseAJour)
  return {
    dateDerniereValeur,
    dateProchaineValeur,
    dateMiseADisposition: computeMiseADisposition(dateProchaineValeur, delai),
  }
}
```

- [ ] **Step 4 : Lancer le test → succès**

Run : `pnpm -F @pilote/kpilote-api exec vitest run src/indicateur/datesMiseADisposition.test.ts`
Expected : PASS.

- [ ] **Step 5 : Commit**

```bash
git add apps/kpilote-api/src/indicateur/datesMiseADisposition.ts apps/kpilote-api/src/indicateur/datesMiseADisposition.test.ts
git commit -m "feat(indicateur): helper pur de calcul des dates de mise à disposition"
```

---

### Task 4 : mb-api — mapper + queries (dernière valeur + dates dérivées)

**Files:**
- Modify: `apps/kpilote-api/src/indicateur/utils.ts`
- Modify: `apps/kpilote-api/src/indicateur/queries/getIndicateurByPublicId.ts`
- Modify: `apps/kpilote-api/src/indicateur/queries/listIndicateurs.ts`
- Test: `apps/kpilote-api/src/indicateur/queries/getIndicateurByPublicId.test.ts`

**Interfaces:**
- Consumes: `computeDatesMiseADisposition` (Task 3) ; `UniteDuree`, `DelaiMiseADisposition` (Task 2).
- Produces: `toIndicateurApiModel({ indicateur, dateDerniereValeur })` (params objet) → `IndicateurApiModel` complet (délai + 3 dates).

- [ ] **Step 1 : Écrire le test d'intégration (scénario fiscal) — échec attendu**

Dans `getIndicateurByPublicId.test.ts`, ajouter ce cas à l'intérieur du `describe` existant (imports `fixtures`, `runAsPrincipal`, `testIndicateurId` déjà présents) :

```ts
  it(
    'calcule les dates dérivées (dernière valeur, prochaine valeur, mise à disposition)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.valeurAvancement(
        {
          indicateur: {
            publicId: indId,
            periodeMiseAJour: 'ANNUELLE',
            delaiMiseADispositionNombre: 6,
            delaiMiseADispositionUnite: 'MOIS',
          },
          individu: {},
          date: '2022-12-01',
          valeur: 5,
        },
        {
          indicateur: { publicId: indId },
          individu: {},
          date: '2023-12-01',
          valeur: 10,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => getIndicateurByPublicId(indId))
      const indicateur = result._unsafeUnwrap()

      expect(indicateur.delaiMiseADisposition).toEqual({ nombre: 6, unite: 'MOIS' })
      expect(indicateur.dateDerniereValeur).toBe('2023-12-01')
      expect(indicateur.dateProchaineValeur).toBe('2024-12-01')
      expect(indicateur.dateMiseADisposition).toBe('2025-06-01')
    }),
  )
```

- [ ] **Step 2 : Mettre à jour les assertions `toEqual` existantes (nouveaux champs `null`)**

Dans les deux `expect(...).toEqual({ ... })` full-object existants de ce fichier (le cas « référentiels triés » et tout autre asserttant l'objet complet), ajouter juste avant `createdAt:` :

```ts
        delaiMiseADisposition: null,
        dateDerniereValeur: null,
        dateProchaineValeur: null,
        dateMiseADisposition: null,
```

- [ ] **Step 3 : Lancer → échec (mapper pas encore mis à jour)**

Run : `pnpm -F @pilote/kpilote-api exec vitest run src/indicateur/queries/getIndicateurByPublicId.test.ts`
Expected : FAIL (champs dérivés absents / `undefined`).

- [ ] **Step 4 : Mettre à jour le mapper `utils.ts`**

Dans `apps/kpilote-api/src/indicateur/utils.ts` :

1. Étendre les imports :

```ts
import {
  type DelaiMiseADisposition,
  type IndicateurApiModel,
  type UniteDuree,
  type UniteIndicateurApiModel,
  type UniteIndicateurCode,
  UNITES_INDICATEUR_CONFIG,
} from '@pilote/kpilote-shared/indicateur'

import { computeDatesMiseADisposition } from '@/indicateur/datesMiseADisposition'
```

2. Ajouter le pont délai (deux colonnes → objet), avant `toIndicateurApiModel` :

```ts
// Recompose le délai stocké en deux colonnes (nombre + unité) en objet, ou
// `null` si l'un des deux manque (invariant les-deux-ou-aucun garanti à l'écriture).
const toDelaiMiseADisposition = (indicateur: {
  delaiMiseADispositionNombre: number | null
  delaiMiseADispositionUnite: UniteDuree | null
}): DelaiMiseADisposition | null =>
  indicateur.delaiMiseADispositionNombre !== null && indicateur.delaiMiseADispositionUnite !== null
    ? { nombre: indicateur.delaiMiseADispositionNombre, unite: indicateur.delaiMiseADispositionUnite }
    : null
```

3. Remplacer la signature et le corps de `toIndicateurApiModel` (params objet + délai + dates) :

```ts
export const toIndicateurApiModel = ({
  indicateur,
  dateDerniereValeur,
}: {
  indicateur: IndicateurWithReferentiels
  dateDerniereValeur: string | null
}): IndicateurApiModel => {
  const delaiMiseADisposition = toDelaiMiseADisposition(indicateur)
  const dates = computeDatesMiseADisposition({
    dateDerniereValeur,
    periodeMiseAJour: indicateur.periodeMiseAJour,
    delai: delaiMiseADisposition,
  })
  return {
    id: indicateur.publicId,
    nom: indicateur.nom,
    visibilite: indicateur.visibilite,
    unite: toUniteIndicateurApiModel(indicateur.unite),
    description: indicateur.description,
    methodeCalcul: indicateur.methodeCalcul,
    sourceDonnees: indicateur.sourceDonnees,
    sourceUrl: indicateur.sourceUrl,
    periodeMiseAJour: indicateur.periodeMiseAJour,
    jourMiseAJour: indicateur.jourMiseAJour,
    delaiMiseADisposition,
    referentiels: indicateur.referentiels
      .map((configuration) => ({
        id: configuration.referentiel.publicId,
        nom: configuration.referentiel.nom,
        fonctionAgregation: configuration.fonctionAgregation,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    responsables: indicateur.responsables.map(({ utilisateur }) => ({
      email: utilisateur.email,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      service: utilisateur.service,
      fonction: utilisateur.fonction,
    })),
    dateDerniereValeur: dates.dateDerniereValeur,
    dateProchaineValeur: dates.dateProchaineValeur,
    dateMiseADisposition: dates.dateMiseADisposition,
    createdAt: indicateur.createdAt.toISOString(),
    updatedAt: indicateur.updatedAt.toISOString(),
  }
}
```

> `IndicateurWithReferentiels = IndicateurModel & {...}` inclut déjà `delaiMiseADisposition*` via `IndicateurModel` (Task 1). Le type Prisma de `delaiMiseADispositionUnite` (`$Enums.UniteDuree`) et le `UniteDuree` partagé sont des unions de chaînes identiques ; l'affectation compile directement.

- [ ] **Step 5 : Mettre à jour la query détail (MAX date)**

Remplacer le corps de `getIndicateurByPublicId.ts` par une lecture en deux temps (indicateur puis MAX date), sans transaction :

```ts
import { type IndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { ResultAsync } from 'neverthrow'

import { isAdminPrincipal, requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { type Prisma } from '@/generated/prisma/client'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { toIndicateurApiModel } from '@/indicateur/utils'

const loadIndicateur = async (
  where: Prisma.IndicateurWhereInput,
): Promise<IndicateurApiModel> => {
  const indicateur = await db().indicateur.findFirstOrThrow({
    where,
    include: {
      referentiels: { include: { referentiel: true } },
      responsables: { orderBy: { createdAt: 'asc' }, include: { utilisateur: true } },
    },
  })
  // La date est stockée en `YYYY-MM-DD` : le MAX lexicographique = MAX chronologique.
  const { _max } = await db().valeurAvancement.aggregate({
    where: { indicateurId: indicateur.id },
    _max: { date: true },
  })
  return toIndicateurApiModel({ indicateur, dateDerniereValeur: _max.date })
}

export const getIndicateurByPublicId = (
  publicId: string,
): ResultAsync<IndicateurApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  const where = withIndicateurReadPermission({ publicId }, principalId, {
    isAdmin: isAdminPrincipal(),
  })
  return ResultAsync.fromSafePromise(loadIndicateur(where))
}
```

- [ ] **Step 6 : Mettre à jour la query liste (MAX date par page via `groupBy`)**

Dans `listIndicateurs.ts`, remplacer le bloc final `ResultAsync.fromSafePromise(Promise.all([...])).map(...)` par une fonction async qui calcule les MAX de la page :

```ts
  const loadPage = async (): Promise<IndicateurListApiModel> => {
    const [rows, total] = await Promise.all([fetchPage, fetchTotal])
    const maxDates = await db().valeurAvancement.groupBy({
      by: ['indicateurId'],
      where: { indicateurId: { in: rows.map((row) => row.id) } },
      _max: { date: true },
    })
    const dateParIndicateur = new Map(maxDates.map((m) => [m.indicateurId, m._max.date]))
    return toPaginatedResponse(
      rows,
      total,
      (row) =>
        toIndicateurApiModel({ indicateur: row, dateDerniereValeur: dateParIndicateur.get(row.id) ?? null }),
      params.pageSize,
    )
  }

  return ResultAsync.fromSafePromise(loadPage())
```

(Supprimer l'ancien `return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(...)`.)

- [ ] **Step 7 : Lancer le fichier de test détail → succès**

Run : `pnpm -F @pilote/kpilote-api exec vitest run src/indicateur/queries/getIndicateurByPublicId.test.ts`
Expected : PASS.

- [ ] **Step 8 : Lancer toute la suite API + le typecheck**

Run : `pnpm -F @pilote/kpilote-api test && pnpm -F @pilote/kpilote-api exec tsc --noEmit`
Expected : PASS. (Si un test de `listIndicateurs` assertait la forme complète, ajouter les 4 champs `null` comme au Step 2.)

- [ ] **Step 9 : Commit**

```bash
git add apps/kpilote-api/src/indicateur/utils.ts apps/kpilote-api/src/indicateur/queries/getIndicateurByPublicId.ts apps/kpilote-api/src/indicateur/queries/listIndicateurs.ts apps/kpilote-api/src/indicateur/queries/getIndicateurByPublicId.test.ts
git commit -m "feat(indicateur): expose délai + dates dérivées dans l'API (détail & liste)"
```

---

### Task 5 : mb-api — écriture du délai (upsert)

**Files:**
- Modify: `apps/kpilote-api/src/indicateur/commands/upsertIndicateur.ts`
- Test: `apps/kpilote-api/src/indicateur/commands/upsertIndicateur.test.ts`

**Interfaces:**
- Consumes: `UpsertIndicateurBody.delaiMiseADisposition?: DelaiMiseADisposition | null` (Task 2, via `.partial()`).
- Produces: persistance des colonnes `delaiMiseADisposition{Nombre,Unite}` (sémantique PATCH-like : absent = ne pas toucher, `null` = effacer les deux colonnes).

- [ ] **Step 1 : Écrire les tests (échec attendu)**

Ajouter au `describe` de `upsertIndicateur.test.ts`. Le fichier importe déjà `runAsAdmin` de `@/test/runAsPrincipal`, `METADONNEES_VIDES`, `db`, `fixtures`, `testIndicateurId`, `integrationTest`. Comme les métadonnées sont `.partial()` à l'upsert, le délai est optionnel ; on l'ajoute explicitement dans le body. Création **et** update via le même `runAsAdmin` (l'admin obtient les grants owner READ+WRITE à la création, ce qui couvre l'update) :

```ts
  it(
    'persiste le délai de mise à disposition à la création',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const apiKey = await fixtures.apiKey()
      await runAsAdmin(apiKey.id, () =>
        upsertIndicateur(indId, {
          nom: 'Données fiscales',
          visibilite: 'PRIVE',
          unite: null,
          ...METADONNEES_VIDES,
          delaiMiseADisposition: { nombre: 6, unite: 'MOIS' },
          referentiels: [],
        }),
      )
      const row = await db().indicateur.findUniqueOrThrow({ where: { publicId: indId } })
      expect(row.delaiMiseADispositionNombre).toBe(6)
      expect(row.delaiMiseADispositionUnite).toBe('MOIS')
    }),
  )

  it(
    'efface le délai quand on envoie null',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const apiKey = await fixtures.apiKey()
      const body = {
        nom: 'Données fiscales',
        visibilite: 'PRIVE' as const,
        unite: null,
        ...METADONNEES_VIDES,
        referentiels: [],
      }
      await runAsAdmin(apiKey.id, () =>
        upsertIndicateur(indId, { ...body, delaiMiseADisposition: { nombre: 6, unite: 'MOIS' } }),
      )
      await runAsAdmin(apiKey.id, () =>
        upsertIndicateur(indId, { ...body, delaiMiseADisposition: null }),
      )
      const row = await db().indicateur.findUniqueOrThrow({ where: { publicId: indId } })
      expect(row.delaiMiseADispositionNombre).toBeNull()
      expect(row.delaiMiseADispositionUnite).toBeNull()
    }),
  )
```

- [ ] **Step 2 : Lancer → échec**

Run : `pnpm -F @pilote/kpilote-api exec vitest run src/indicateur/commands/upsertIndicateur.test.ts`
Expected : FAIL (colonnes toujours `null` après création).

- [ ] **Step 3 : Décomposer le délai dans `metadonneesData`**

Dans `upsertIndicateur.ts`, à la fin de l'objet retourné par `const metadonneesData = (body) => ({ ... })`, ajouter :

```ts
    ...(body.delaiMiseADisposition !== undefined && {
      delaiMiseADispositionNombre: body.delaiMiseADisposition?.nombre ?? null,
      delaiMiseADispositionUnite: body.delaiMiseADisposition?.unite ?? null,
    }),
```

(Aucun autre changement : `metadonneesData(body)` est déjà spread dans le `data` de `create` et d'`update`.)

- [ ] **Step 4 : Lancer → succès**

Run : `pnpm -F @pilote/kpilote-api exec vitest run src/indicateur/commands/upsertIndicateur.test.ts`
Expected : PASS.

- [ ] **Step 5 : Commit**

```bash
git add apps/kpilote-api/src/indicateur/commands/upsertIndicateur.ts apps/kpilote-api/src/indicateur/commands/upsertIndicateur.test.ts
git commit -m "feat(indicateur): écriture du délai de mise à disposition (upsert)"
```

---

### Task 6 : kpilote-admin — champ délai dans le formulaire

**Files:**
- Modify: `apps/kpilote-admin/src/components/indicateurs/indicateurFormSchema.ts`
- Modify: `apps/kpilote-admin/src/components/indicateurs/IndicateurForm.tsx`

**Interfaces:**
- Consumes: `uniteDureeSchema`, `UNITES_DUREE`, `UNITE_DUREE_LABELS`, `DelaiMiseADisposition` (Task 2).
- Produces: `IndicateurFormValues` gagne `delaiNombre: string` + `delaiUnite: '' | UniteDuree` ; `toUpsertBody` produit `delaiMiseADisposition`.

- [ ] **Step 1 : Étendre le schéma de formulaire**

Dans `indicateurFormSchema.ts` :

1. Import :

```ts
import {
  configurationIndicateurReferentielSchema,
  indicateurSourceUrlSchema,
  indicateurVisibiliteSchema,
  periodeMiseAJourSchema,
  uniteDureeSchema,
  uniteIndicateurCodeSchema,
} from '@pilote/kpilote-shared/indicateur'
```

2. Dans `buildIndicateurFormSchema`, après `jourMiseAJour: ...` :

```ts
    delaiNombre: z
      .string()
      .refine(
        (value) => value === '' || (/^\d+$/.test(value) && Number(value) >= 1),
        'Entier ≥ 1',
      ),
    delaiUnite: z.union([z.literal(''), uniteDureeSchema]),
```

3. Dans `buildInitialValues`, après `jourMiseAJour: ...` :

```ts
    delaiNombre:
      indicateur?.delaiMiseADisposition != null
        ? String(indicateur.delaiMiseADisposition.nombre)
        : '',
    delaiUnite: indicateur?.delaiMiseADisposition?.unite ?? '',
```

4. Dans `toUpsertBody`, après `jourMiseAJour: ...` :

```ts
    delaiMiseADisposition:
      values.delaiUnite === '' || values.delaiNombre === ''
        ? null
        : { nombre: Number(values.delaiNombre), unite: values.delaiUnite },
```

- [ ] **Step 2 : Ajouter les champs UI**

Dans `IndicateurForm.tsx` :

1. Import :

```ts
import {
  PERIODE_MISE_A_JOUR_LABELS,
  PERIODES_MISE_A_JOUR,
  UNITE_DUREE_LABELS,
  UNITES_DUREE,
  UNITES_INDICATEUR,
  UNITES_INDICATEUR_CONFIG,
} from '@pilote/kpilote-shared/indicateur'
```

2. Après le bloc `<div className="flex gap-4">…</div>` qui contient « Période de mise à jour » + « Jour de mise à jour » (toujours dans la section « Métadonnées »), ajouter :

```tsx
          <div className="mt-5 flex gap-4">
            <div className="flex-1">
              <FieldInput
                label="Délai de mise à disposition"
                type="number"
                min={1}
                placeholder="ex. 6"
                error={form.formState.errors.delaiNombre?.message}
                {...form.register('delaiNombre')}
              />
            </div>
            <div className="flex-1">
              <FieldSelect label="Unité du délai" {...form.register('delaiUnite')}>
                <option value="">Aucune</option>
                {UNITES_DUREE.map((unite) => (
                  <option key={unite} value={unite}>
                    {UNITE_DUREE_LABELS[unite]}
                  </option>
                ))}
              </FieldSelect>
            </div>
          </div>
```

- [ ] **Step 3 : Typecheck admin**

Run : `pnpm -F @pilote/kpilote-admin exec tsc --noEmit`
Expected : PASS.

- [ ] **Step 4 : Commit**

```bash
git add apps/kpilote-admin/src/components/indicateurs/indicateurFormSchema.ts apps/kpilote-admin/src/components/indicateurs/IndicateurForm.tsx
git commit -m "feat(admin): édition du délai de mise à disposition d'un indicateur"
```

---

### Task 7 : kpilote-webapp — affichage des dates dérivées + délai

**Files:**
- Modify: `apps/kpilote-webapp/src/lib/format.ts`
- Test: `apps/kpilote-webapp/src/lib/format.test.ts`
- Modify: `apps/kpilote-webapp/src/components/indicateurs/IndicateurMetadonnees.tsx`

**Interfaces:**
- Consumes: `DelaiMiseADisposition`, `UNITE_DUREE_LABELS` (Task 2) ; champs `delaiMiseADisposition`, `dateProchaineValeur`, `dateMiseADisposition` de l'`IndicateurApiModel`.
- Produces: `formatMoisAnneeLongFr(value: string): string` (« décembre 2024 »).

- [ ] **Step 1 : Écrire le test du formateur (échec attendu)**

Dans `apps/kpilote-webapp/src/lib/format.test.ts` (créer le fichier s'il n'existe pas), ajouter :

```ts
import { describe, expect, it } from 'vitest'

import { formatMoisAnneeLongFr } from '@/lib/format'

describe('formatMoisAnneeLongFr', () => {
  it('formate une date ISO en mois-année long fr-FR', () => {
    expect(formatMoisAnneeLongFr('2024-12-01')).toBe('décembre 2024')
    expect(formatMoisAnneeLongFr('2025-06-15')).toBe('juin 2025')
  })
})
```

- [ ] **Step 2 : Lancer → échec**

Run : `pnpm -F @pilote/kpilote-webapp exec vitest run src/lib/format.test.ts`
Expected : FAIL (`formatMoisAnneeLongFr` introuvable).

- [ ] **Step 3 : Ajouter le formateur**

Dans `apps/kpilote-webapp/src/lib/format.ts`, après `formatMonthYearShortFr` :

```ts
const moisAnneeLongOptions = { month: 'long', year: 'numeric' } as const

// "décembre 2024" — entrée ISO YYYY-MM-DD (dates dérivées de l'indicateur).
export const formatMoisAnneeLongFr = (value: string): string =>
  Temporal.PlainDate.from(value).toLocaleString('fr-FR', moisAnneeLongOptions)
```

- [ ] **Step 4 : Lancer → succès**

Run : `pnpm -F @pilote/kpilote-webapp exec vitest run src/lib/format.test.ts`
Expected : PASS.

- [ ] **Step 5 : Ajouter les lignes dans `IndicateurMetadonnees.tsx`**

1. Imports :

```ts
import {
  PERIODE_MISE_A_JOUR_LABELS,
  UNITE_DUREE_LABELS,
  type ConfigurationIndicateurReferentielApiModel,
  type DelaiMiseADisposition,
  type PeriodeMiseAJour,
  type UniteIndicateurApiModel,
} from '@pilote/kpilote-shared/indicateur'
```

et ajouter `formatMoisAnneeLongFr` à l'import existant depuis `@/lib/format`.

2. Helper de formatage du délai, après `formatReferentiels` :

```ts
const formatDelai = (delai: DelaiMiseADisposition | null): string =>
  delai ? `${delai.nombre} ${UNITE_DUREE_LABELS[delai.unite]}` : VALEUR_VIDE

const formatDateMoisAnnee = (date: string | null): string =>
  date ? formatMoisAnneeLongFr(date) : VALEUR_VIDE
```

3. Étendre le type `IndicateurMetadonneesProps.indicateur`, après `jourMiseAJour: number | null` :

```ts
    delaiMiseADisposition: DelaiMiseADisposition | null
    dateProchaineValeur: string | null
    dateMiseADisposition: string | null
```

4. Dans la `DescriptionList`, après l'item « Période de mise à jour » :

```tsx
        <DescriptionList.Item label="Délai de mise à disposition">
          {formatDelai(indicateur.delaiMiseADisposition)}
        </DescriptionList.Item>
        <DescriptionList.Item label="Date de la prochaine valeur">
          {formatDateMoisAnnee(indicateur.dateProchaineValeur)}
        </DescriptionList.Item>
        <DescriptionList.Item label="Date de mise à disposition">
          {formatDateMoisAnnee(indicateur.dateMiseADisposition)}
        </DescriptionList.Item>
```

- [ ] **Step 6 : Typecheck + suite webapp**

Run : `pnpm -F @pilote/kpilote-webapp exec tsc --noEmit && pnpm -F @pilote/kpilote-webapp test`
Expected : PASS.

- [ ] **Step 7 : Commit**

```bash
git add apps/kpilote-webapp/src/lib/format.ts apps/kpilote-webapp/src/lib/format.test.ts apps/kpilote-webapp/src/components/indicateurs/IndicateurMetadonnees.tsx
git commit -m "feat(webapp): affiche délai + dates de mise à disposition sur la fiche indicateur"
```

---

## Notes de vérification finale

- Lancer une dernière fois `pnpm -F @pilote/kpilote-api test` et les typechecks des 3 fronts.
- Vérifier manuellement (webapp) une fiche indicateur : délai en clair, prochaine valeur et mise à disposition en mois-année ; `—` si pas de valeur / période `AUCUNE` / délai absent.
- Le seed (`prisma db seed`) n'est pas modifié : les indicateurs existants auront un délai `null` (dates dérivées de mise à dispo `null`), ce qui est le comportement attendu.
</content>

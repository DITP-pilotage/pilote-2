import { describe, expect, it } from 'vitest'

import { listTauxProgressionForIndicateur } from '@/tauxProgression/queries/listTauxProgressionForIndicateur'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import {
  testDeptId,
  testDeptIds,
  testIndicateurId,
  testIndividuId,
  testReferentielId,
} from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('listTauxProgressionForIndicateur', () => {
  // ---------------------------------------------------------------------------
  // Cas de base
  // ---------------------------------------------------------------------------

  it(
    'retourne une liste vide quand aucun individu connu',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listTauxProgressionForIndicateur(indId, { individus: ['DEPT-INCONNU'] }),
      )

      expect(result._unsafeUnwrap()).toEqual({ items: [] })
    }),
  )

  it(
    "retourne une liste vide quand l'individu n'a pas d'objectif",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const deptId = testDeptId()
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId, nom: 'Test' },
        individu: { publicId: deptId, referentiel: { publicId: refId } },
        date: '2024-06-01',
        valeur: 50,
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listTauxProgressionForIndicateur(indId, { individus: [deptId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({ items: [] })
    }),
  )

  it(
    'calcule le taux de progression pour une valeur avec un objectif',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const deptId = testDeptId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId, nom: 'Test' },
        individu: { publicId: deptId, referentiel: { publicId: refId } },
        date: '2024-06-01',
        valeur: 75,
      })
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indId },
        individu: { publicId: deptId },
        dateCible: '2024-12-31',
        valeurCible: 100,
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listTauxProgressionForIndicateur(indId, { individus: [deptId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            indicateur: indId,
            individu: deptId,
            date: '2024-06-01',
            valeur: 75,
            valeurCible: 100,
            dateCible: '2024-12-01',
            tauxProgression: 75,
          },
        ],
      })
    }),
  )

  it(
    'plafonne le taux à 100 quand la valeur dépasse la cible',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const deptId = testDeptId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId, nom: 'Test' },
        individu: { publicId: deptId, referentiel: { publicId: refId } },
        date: '2024-06-01',
        valeur: 150,
      })
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indId },
        individu: { publicId: deptId },
        dateCible: '2024-12-31',
        valeurCible: 100,
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listTauxProgressionForIndicateur(indId, { individus: [deptId] }),
      )

      const items = result._unsafeUnwrap().items
      expect(items).toHaveLength(1)
      expect(items[0]!.tauxProgression).toBe(100)
    }),
  )

  it(
    'tronque le taux de progression à 2 décimales',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const deptId = testDeptId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      // 2 / 3 × 100 = 66.6666… → 66.66 (trunc à 2 décimales, pas half-up)
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId, nom: 'Test' },
        individu: { publicId: deptId, referentiel: { publicId: refId } },
        date: '2024-06-01',
        valeur: 2,
      })
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indId },
        individu: { publicId: deptId },
        dateCible: '2024-12-31',
        valeurCible: 3,
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listTauxProgressionForIndicateur(indId, { individus: [deptId] }),
      )

      const items = result._unsafeUnwrap().items
      expect(items).toHaveLength(1)
      expect(items[0]!.tauxProgression).toBe(66.66)
    }),
  )

  // ---------------------------------------------------------------------------
  // Sélection de l'objectif applicable
  // ---------------------------------------------------------------------------

  it(
    'sélectionne le premier objectif dont la dateCible est après la date de la valeur',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const deptId = testDeptId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId, nom: 'Test' },
        individu: { publicId: deptId, referentiel: { publicId: refId } },
        date: '2024-06-01',
        valeur: 40,
      })
      // deux objectifs : la valeur est avant le premier → objectif 2024 sélectionné
      await fixtures.objectifIndicateurIndividu(
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          dateCible: '2024-12-31',
          valeurCible: 50,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          dateCible: '2025-12-31',
          valeurCible: 100,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listTauxProgressionForIndicateur(indId, { individus: [deptId] }),
      )

      const items = result._unsafeUnwrap().items
      expect(items).toHaveLength(1)
      expect(items[0]).toMatchObject({
        dateCible: '2024-12-01',
        valeurCible: 50,
        tauxProgression: 80,
      })
    }),
  )

  it(
    "sélectionne l'objectif quand sa dateCible tombe dans le même bucket que la valeur (frontière)",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const deptId = testDeptId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      // Valeur saisie le 2024-12-15 → bucket mensuel `2024-12-01`.
      // Objectif fixé au 2024-12-31 → même bucket `2024-12-01`.
      // Sans `>=`, le `findObjectifApplicable` sauterait à l'objectif suivant
      // et fausserait `valeurCible` / `tauxProgression` pour ce bucket.
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId, nom: 'Test' },
        individu: { publicId: deptId, referentiel: { publicId: refId } },
        date: '2024-12-15',
        valeur: 40,
      })
      await fixtures.objectifIndicateurIndividu(
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          dateCible: '2024-12-31',
          valeurCible: 50,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          dateCible: '2025-12-31',
          valeurCible: 100,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listTauxProgressionForIndicateur(indId, { individus: [deptId] }),
      )

      const items = result._unsafeUnwrap().items
      expect(items).toHaveLength(1)
      expect(items[0]).toMatchObject({
        date: '2024-12-01',
        dateCible: '2024-12-01',
        valeurCible: 50,
        tauxProgression: 80,
      })
    }),
  )

  it(
    'utilise le dernier objectif quand toutes les dateCibles sont dépassées',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const deptId = testDeptId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      // valeur après les deux objectifs → dernier objectif utilisé
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId, nom: 'Test' },
        individu: { publicId: deptId, referentiel: { publicId: refId } },
        date: '2026-01-01',
        valeur: 80,
      })
      await fixtures.objectifIndicateurIndividu(
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          dateCible: '2024-12-31',
          valeurCible: 50,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          dateCible: '2025-12-31',
          valeurCible: 100,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listTauxProgressionForIndicateur(indId, { individus: [deptId] }),
      )

      const items = result._unsafeUnwrap().items
      expect(items).toHaveLength(1)
      expect(items[0]).toMatchObject({
        dateCible: '2025-12-01',
        valeurCible: 100,
        tauxProgression: 80,
      })
    }),
  )

  // ---------------------------------------------------------------------------
  // Filtres de date
  // ---------------------------------------------------------------------------

  it(
    'filtre les valeurs par dateDebut et dateFin',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const deptId = testDeptId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId, nom: 'Test' },
          individu: { publicId: deptId, referentiel: { publicId: refId } },
          date: '2023-01-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          date: '2024-06-01',
          valeur: 60,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          date: '2025-01-01',
          valeur: 90,
        },
      )
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indId },
        individu: { publicId: deptId },
        dateCible: '2025-12-31',
        valeurCible: 100,
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listTauxProgressionForIndicateur(indId, {
          individus: [deptId],
          dateDebut: '2024-01-01',
          dateFin: '2024-12-31',
        }),
      )

      const items = result._unsafeUnwrap().items
      expect(items).toHaveLength(1)
      expect(items[0]!.date).toBe('2024-06-01')
    }),
  )

  // ---------------------------------------------------------------------------
  // Multi-individus
  // ---------------------------------------------------------------------------

  it(
    'retourne les points pour plusieurs individus triés par individu puis par date',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const [dept1, dept2] = testDeptIds(2)
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId, nom: 'Test' },
          individu: { publicId: dept1, referentiel: { publicId: refId } },
          date: '2024-01-01',
          valeur: 30,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2, referentiel: { publicId: refId } },
          date: '2024-01-01',
          valeur: 60,
        },
      )
      await fixtures.objectifIndicateurIndividu(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1 },
          dateCible: '2024-12-31',
          valeurCible: 100,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2 },
          dateCible: '2024-12-31',
          valeurCible: 100,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listTauxProgressionForIndicateur(indId, { individus: [dept1, dept2] }),
      )

      const items = result._unsafeUnwrap().items
      expect(items).toHaveLength(2)
      const individus = items.map((i) => i.individu)
      expect(individus).toContain(dept1)
      expect(individus).toContain(dept2)
      expect(items.find((i) => i.individu === dept1)!.tauxProgression).toBe(30)
      expect(items.find((i) => i.individu === dept2)!.tauxProgression).toBe(60)
    }),
  )

  // ---------------------------------------------------------------------------
  // Indicateurs dérivés (agrégation hiérarchique)
  // ---------------------------------------------------------------------------

  it(
    'calcule le taux directement sur une feuille (sanity check non-régression)',
    integrationTest(async () => {
      // Vérifie que le passage par resolveSerie/Objectif n'a pas cassé le
      // cas feuille (objectif et valeur saisis directement sur le même individu).
      const indId = testIndicateurId()
      const refDept = testReferentielId()
      const deptId = testIndividuId()

      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId, nom: 'Test' },
        referentiel: { publicId: refDept },
        fonctionAgregation: 'NONE',
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: deptId, referentiel: { publicId: refDept } },
        date: '2025-01-15',
        valeur: 30,
      })
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indId },
        individu: { publicId: deptId },
        dateCible: '2025-12-31',
        valeurCible: 60,
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listTauxProgressionForIndicateur(indId, { individus: [deptId] }),
      )

      // bucket mensuel : '2025-01-15' → '2025-01-01'
      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            indicateur: indId,
            individu: deptId,
            date: '2025-01-01',
            valeur: 30,
            valeurCible: 60,
            dateCible: '2025-12-01',
            tauxProgression: 50,
          },
        ],
      })
    }),
  )

  it(
    'calcule le taux avec valeur ET objectif dérivés sur le parent',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refReg = testReferentielId()
      const refDept = testReferentielId()
      const regId = testIndividuId()
      const [dept1, dept2] = [testIndividuId(), testIndividuId()]

      await fixtures.indicateurReferentiel(
        {
          indicateur: { publicId: indId, nom: 'Test' },
          referentiel: { publicId: refReg },
          fonctionAgregation: 'SUM',
        },
        {
          indicateur: { publicId: indId },
          referentiel: { publicId: refDept },
          fonctionAgregation: 'NONE',
        },
      )
      await fixtures.relation(
        {
          parent: { publicId: regId, referentiel: { publicId: refReg } },
          child: { publicId: dept1, referentiel: { publicId: refDept } },
        },
        {
          parent: { publicId: regId },
          child: { publicId: dept2, referentiel: { publicId: refDept } },
        },
      )
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1 },
          date: '2025-06-01',
          valeur: 25,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2 },
          date: '2025-06-01',
          valeur: 50,
        },
      )
      // Pas d'objectif sur la région : il sera dérivé par SUM(50, 50) = 100
      await fixtures.objectifIndicateurIndividu(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1 },
          dateCible: '2025-12-31',
          valeurCible: 50,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2 },
          dateCible: '2025-12-31',
          valeurCible: 50,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listTauxProgressionForIndicateur(indId, { individus: [regId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            indicateur: indId,
            individu: regId,
            date: '2025-06-01',
            valeur: 75, // SUM(25, 50)
            valeurCible: 100, // SUM(50, 50)
            dateCible: '2025-12-01',
            tauxProgression: 75,
          },
        ],
      })
    }),
  )

  it(
    "exclut un parent dont aucun objectif (direct ni dérivé) n'est applicable",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refReg = testReferentielId()
      const refDept = testReferentielId()
      const regId = testIndividuId()
      const dept1 = testIndividuId()

      await fixtures.indicateurReferentiel(
        {
          indicateur: { publicId: indId, nom: 'Test' },
          referentiel: { publicId: refReg },
          fonctionAgregation: 'SUM',
        },
        {
          indicateur: { publicId: indId },
          referentiel: { publicId: refDept },
          fonctionAgregation: 'NONE',
        },
      )
      await fixtures.relation({
        parent: { publicId: regId, referentiel: { publicId: refReg } },
        child: { publicId: dept1, referentiel: { publicId: refDept } },
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: dept1 },
        date: '2025-06-01',
        valeur: 10,
      })
      // Aucun objectif ni sur la région ni sur le département
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listTauxProgressionForIndicateur(indId, { individus: [regId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({ items: [] })
    }),
  )

  it(
    'aligne le carry-forward des valeurs et des objectifs sur la grille mensuelle',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refReg = testReferentielId()
      const refDept = testReferentielId()
      const regId = testIndividuId()
      const [dept1, dept2] = [testIndividuId(), testIndividuId()]

      await fixtures.indicateurReferentiel(
        {
          indicateur: { publicId: indId, nom: 'Test' },
          referentiel: { publicId: refReg },
          fonctionAgregation: 'SUM',
        },
        {
          indicateur: { publicId: indId },
          referentiel: { publicId: refDept },
          fonctionAgregation: 'NONE',
        },
      )
      await fixtures.relation(
        {
          parent: { publicId: regId, referentiel: { publicId: refReg } },
          child: { publicId: dept1, referentiel: { publicId: refDept } },
        },
        {
          parent: { publicId: regId },
          child: { publicId: dept2, referentiel: { publicId: refDept } },
        },
      )
      // dept1 saisit en jan, dept2 saisit en feb → bucket mensuel doit
      // émettre 2 points avec carry-forward
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1 },
          date: '2025-01-15',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2 },
          date: '2025-02-15',
          valeur: 40,
        },
      )
      // Objectifs sur les enfants : l'objectif région est dérivé par SUM
      // (les objectifs directs sur un nœud agrégé sont ignorés par design,
      // cf. objectifs-derives.md).
      await fixtures.objectifIndicateurIndividu(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1 },
          dateCible: '2025-12-31',
          valeurCible: 50,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2 },
          dateCible: '2025-12-31',
          valeurCible: 50,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listTauxProgressionForIndicateur(indId, { individus: [regId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            indicateur: indId,
            individu: regId,
            date: '2025-01-01',
            valeur: 10, // dept1 seul (couverture 1/2, permissif)
            valeurCible: 100,
            dateCible: '2025-12-01',
            tauxProgression: 10,
          },
          {
            indicateur: indId,
            individu: regId,
            date: '2025-02-01',
            valeur: 50, // dept1 (carry 10) + dept2 (40)
            valeurCible: 100,
            dateCible: '2025-12-01',
            tauxProgression: 50,
          },
        ],
      })
    }),
  )

  it(
    'applique les filtres dateDebut/dateFin en sortie sans perturber le carry-forward',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refReg = testReferentielId()
      const refDept = testReferentielId()
      const regId = testIndividuId()
      const [dept1, dept2] = [testIndividuId(), testIndividuId()]

      await fixtures.indicateurReferentiel(
        {
          indicateur: { publicId: indId, nom: 'Test' },
          referentiel: { publicId: refReg },
          fonctionAgregation: 'SUM',
        },
        {
          indicateur: { publicId: indId },
          referentiel: { publicId: refDept },
          fonctionAgregation: 'NONE',
        },
      )
      await fixtures.relation(
        {
          parent: { publicId: regId, referentiel: { publicId: refReg } },
          child: { publicId: dept1, referentiel: { publicId: refDept } },
        },
        {
          parent: { publicId: regId },
          child: { publicId: dept2, referentiel: { publicId: refDept } },
        },
      )
      // Saisie de dept1 en jan (hors filtre) — son carry-forward doit se
      // propager jusqu'au bucket de feb (dans le filtre) où dept2 saisit.
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1 },
          date: '2025-01-01',
          valeur: 30,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2 },
          date: '2025-02-01',
          valeur: 40,
        },
      )
      // Objectifs sur les enfants (le parent agrégé ignorerait un objectif direct).
      await fixtures.objectifIndicateurIndividu(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1 },
          dateCible: '2025-12-31',
          valeurCible: 50,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2 },
          dateCible: '2025-12-31',
          valeurCible: 50,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listTauxProgressionForIndicateur(indId, {
          individus: [regId],
          dateDebut: '2025-02-01',
        }),
      )

      const items = result._unsafeUnwrap().items
      expect(items).toHaveLength(1)
      expect(items[0]).toMatchObject({
        date: '2025-02-01',
        valeur: 70, // dept1 (carry 30) + dept2 (40) — preuve que le filtre est en sortie
        tauxProgression: 70,
      })
    }),
  )

  // ---------------------------------------------------------------------------
  // Granularité mixte (dateTruncValeur ≠ dateTruncObjectif)
  // ---------------------------------------------------------------------------

  it(
    'aligne des valeurs mensuelles sur un objectif annuel (dateTruncObjectif=year)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const deptId = testDeptId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      // 3 valeurs mensuelles sur 2024 + un objectif annuel (dateCible 2024-12-31).
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId, nom: 'Test' },
          individu: { publicId: deptId, referentiel: { publicId: refId } },
          date: '2024-03-15',
          valeur: 25,
        },
        {
          indicateur: { publicId: indId, nom: 'Test' },
          individu: { publicId: deptId, referentiel: { publicId: refId } },
          date: '2024-06-20',
          valeur: 50,
        },
        {
          indicateur: { publicId: indId, nom: 'Test' },
          individu: { publicId: deptId, referentiel: { publicId: refId } },
          date: '2024-09-10',
          valeur: 75,
        },
      )
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indId },
        individu: { publicId: deptId },
        dateCible: '2024-12-31',
        valeurCible: 100,
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listTauxProgressionForIndicateur(indId, {
          individus: [deptId],
          dateTruncValeur: 'month',
          dateTruncObjectif: 'year',
        }),
      )

      const items = result._unsafeUnwrap().items
      expect(items).toHaveLength(3)
      // Chaque bucket mensuel de valeur tape la même cible annuelle bucketisée
      // au 1er janvier (`year` trunc).
      expect(items.map((p) => p.date)).toEqual(['2024-03-01', '2024-06-01', '2024-09-01'])
      expect(items.every((p) => p.dateCible === '2024-01-01')).toBe(true)
      expect(items.every((p) => p.valeurCible === 100)).toBe(true)
      expect(items.map((p) => p.tauxProgression)).toEqual([25, 50, 75])
    }),
  )

  // ---------------------------------------------------------------------------
  // Permissions
  // ---------------------------------------------------------------------------

  it(
    "lève une erreur quand le principal n'a pas accès à l'indicateur",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const autreIndId = testIndicateurId()
      const deptId = testDeptId()
      // clé sans permission sur indId
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: autreIndId }, action: 'READ' }],
      })

      await expect(
        runAsPrincipal(apiKey.id, () =>
          listTauxProgressionForIndicateur(indId, { individus: [deptId] }),
        ),
      ).rejects.toThrow()
    }),
  )
})

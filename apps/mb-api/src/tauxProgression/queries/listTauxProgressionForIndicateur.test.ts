import { describe, expect, it } from 'vitest'

import { listTauxProgressionForIndicateur } from '@/tauxProgression/queries/listTauxProgressionForIndicateur'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptId, testDeptIds, testIndicateurId, testReferentielId } from '@/test/randomIds'
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
            dateCible: '2024-12-31',
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
        dateCible: '2024-12-31',
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
        dateCible: '2025-12-31',
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

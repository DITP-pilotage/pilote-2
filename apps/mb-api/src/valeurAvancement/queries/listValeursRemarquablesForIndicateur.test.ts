import { describe, expect, it } from 'vitest'

import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptId, testDeptIds, testIndicateurId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'
import { listValeursRemarquablesForIndicateur } from '@/valeurAvancement/queries/listValeursRemarquablesForIndicateur'

describe.concurrent('listValeursRemarquablesForIndicateur', () => {
  it(
    'retourne des stats null pour un référentiel sans individu',
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.referentiel({ publicId: 'REF-VIDE', nom: 'Vide' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: ['REF-VIDE'] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ referentiel: 'REF-VIDE', min: null, max: null, mediane: null }],
      })
    }),
  )

  it(
    "retourne des stats null pour un référentiel dont aucun individu n'a de valeur",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.individu({
        publicId: deptId,
        referentiel: { publicId: 'REF-A', nom: 'A' },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: ['REF-A'] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ referentiel: 'REF-A', min: null, max: null, mediane: null }],
      })
    }),
  )

  it(
    'calcule min/max/médiane sur la valeur la plus récente de chaque individu du référentiel',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [dept1, dept2, dept3] = testDeptIds(3)
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1, nom: 'A', referentiel: { publicId: 'REF-A', nom: 'A' } },
          date: '2026-01-01',
          valeur: 100,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1 },
          date: '2026-02-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2, nom: 'B', referentiel: { publicId: 'REF-A' } },
          date: '2026-01-01',
          valeur: 50,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept3, nom: 'C', referentiel: { publicId: 'REF-A' } },
          date: '2026-01-01',
          valeur: 30,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: ['REF-A'] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ referentiel: 'REF-A', min: 10, max: 50, mediane: 30 }],
      })
    }),
  )

  it(
    'calcule la médiane comme moyenne des deux centrales (nombre pair)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [dept1, dept2, dept3, dept4] = testDeptIds(4)
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1, nom: 'A', referentiel: { publicId: 'REF-A', nom: 'A' } },
          date: '2026-01-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2, nom: 'B', referentiel: { publicId: 'REF-A' } },
          date: '2026-01-01',
          valeur: 20,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept3, nom: 'C', referentiel: { publicId: 'REF-A' } },
          date: '2026-01-01',
          valeur: 30,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept4, nom: 'D', referentiel: { publicId: 'REF-A' } },
          date: '2026-01-01',
          valeur: 40,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: ['REF-A'] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ referentiel: 'REF-A', min: 10, max: 40, mediane: 25 }],
      })
    }),
  )

  it(
    "ignore les individus du référentiel n'ayant aucune valeur pour l'indicateur",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [dept1, dept2] = testDeptIds(2)
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.individu({
        publicId: dept1,
        nom: 'A',
        referentiel: { publicId: 'REF-A', nom: 'A' },
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: dept2, nom: 'B', referentiel: { publicId: 'REF-A' } },
        date: '2026-01-01',
        valeur: 42,
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: ['REF-A'] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ referentiel: 'REF-A', min: 42, max: 42, mediane: 42 }],
      })
    }),
  )

  it(
    'calcule des stats indépendantes pour chaque référentiel demandé',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [dept1, dept2, dept3] = testDeptIds(3)
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1, nom: 'A', referentiel: { publicId: 'REF-A', nom: 'A' } },
          date: '2026-01-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2, nom: 'B', referentiel: { publicId: 'REF-A' } },
          date: '2026-01-01',
          valeur: 30,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept3, nom: 'C', referentiel: { publicId: 'REF-B', nom: 'B' } },
          date: '2026-01-01',
          valeur: 100,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: ['REF-A', 'REF-B'] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          { referentiel: 'REF-A', min: 10, max: 30, mediane: 20 },
          { referentiel: 'REF-B', min: 100, max: 100, mediane: 100 },
        ],
      })
    }),
  )

  it(
    'omet les référentiels inexistants',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: deptId, referentiel: { publicId: 'REF-A', nom: 'A' } },
        date: '2026-01-01',
        valeur: 42,
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: ['REF-A', 'REF-INCONNU'] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ referentiel: 'REF-A', min: 42, max: 42, mediane: 42 }],
      })
    }),
  )

  it(
    'trie les items par publicId de référentiel (asc)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [dept1, dept2] = testDeptIds(2)
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1, referentiel: { publicId: 'REF-Z', nom: 'Z' } },
          date: '2026-01-01',
          valeur: 1,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2, referentiel: { publicId: 'REF-A', nom: 'A' } },
          date: '2026-01-01',
          valeur: 2,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: ['REF-Z', 'REF-A'] }),
      )

      const items = result._unsafeUnwrap().items
      expect(items.map((i) => i.referentiel)).toEqual(['REF-A', 'REF-Z'])
    }),
  )

  it(
    'se base sur la date de la valeur, pas la date de saisie',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId, referentiel: { publicId: 'REF-A', nom: 'A' } },
          date: '2026-02-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          date: '2026-03-01',
          valeur: 75,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          date: '2026-01-01',
          valeur: 50,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: ['REF-A'] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ referentiel: 'REF-A', min: 75, max: 75, mediane: 75 }],
      })
    }),
  )

  it(
    "ignore les valeurs d'autres indicateurs",
    integrationTest(async () => {
      const [indId, autreIndId] = [testIndicateurId(), testIndicateurId()]
      const [dept1, dept2] = testDeptIds(2)
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1, referentiel: { publicId: 'REF-A', nom: 'A' } },
          date: '2026-01-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2, referentiel: { publicId: 'REF-A' } },
          date: '2026-01-01',
          valeur: 20,
        },
        {
          indicateur: { publicId: autreIndId, nom: 'Autre' },
          individu: { publicId: dept1 },
          date: '2026-01-01',
          valeur: 9999,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: ['REF-A'] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ referentiel: 'REF-A', min: 10, max: 20, mediane: 15 }],
      })
    }),
  )

  it(
    'ignore les individus appartenant à un autre référentiel',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [dept1, dept2] = testDeptIds(2)
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1, referentiel: { publicId: 'REF-A', nom: 'A' } },
          date: '2026-01-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2, referentiel: { publicId: 'REF-B', nom: 'B' } },
          date: '2026-01-01',
          valeur: 9999,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: ['REF-A'] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ referentiel: 'REF-A', min: 10, max: 10, mediane: 10 }],
      })
    }),
  )

  it(
    "rejette quand l'indicateur est introuvable",
    integrationTest(async () => {
      await fixtures.referentiel({ publicId: 'REF-A', nom: 'A' })
      const apiKey = await fixtures.apiKey()
      await expect(
        runAsPrincipal(apiKey.id, () =>
          listValeursRemarquablesForIndicateur(testIndicateurId(), { referentiels: ['REF-A'] }),
        ),
      ).rejects.toThrow()
    }),
  )

  it(
    "rejette quand le principal n'a aucune permission sur un indicateur PRIVE",
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PRIVE' })
      await fixtures.referentiel({ publicId: 'REF-A', nom: 'A' })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () =>
          listValeursRemarquablesForIndicateur(indId, { referentiels: ['REF-A'] }),
        ),
      ).rejects.toThrow()
    }),
  )

  it(
    "autorise l'accès à un indicateur PRIVE quand le principal a la permission READ",
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PRIVE' })
      await fixtures.referentiel({ publicId: 'REF-A', nom: 'A' })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: ['REF-A'] }),
      )

      expect(result.isOk()).toBe(true)
    }),
  )
})

import { describe, expect, it } from 'vitest'

import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptId, testDeptIds, testIndicateurId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'
import { listSyntheseIndividus } from '@/valeurAvancement/queries/listSyntheseIndividus'

describe.concurrent('listSyntheseIndividus', () => {
  it(
    "retourne variation et ecartMediane à null quand l'individu n'a aucune valeur (seul dans son référentiel)",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.individu({ publicId: deptId, referentiel: { publicId: 'REF-A', nom: 'A' } })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listSyntheseIndividus(indId, { individus: [deptId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ individu: deptId, variation: null, ecartMediane: null }],
      })
    }),
  )

  it(
    "retourne variation null et ecartMediane null pour un individu sans valeur, même si d'autres ont des valeurs dans son référentiel",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [dept1, dept2] = testDeptIds(2)
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.individu({ publicId: dept1, referentiel: { publicId: 'REF-A', nom: 'A' } })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: dept2, referentiel: { publicId: 'REF-A' } },
        date: '2026-01-01',
        valeur: 42,
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listSyntheseIndividus(indId, { individus: [dept1] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ individu: dept1, variation: null, ecartMediane: null }],
      })
    }),
  )

  it(
    "retourne variation = valeur lorsqu'il n'y a qu'une seule valeur (seul dans son référentiel)",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: deptId, referentiel: { publicId: 'REF-A', nom: 'A' } },
        date: '2026-01-01',
        valeur: 50,
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listSyntheseIndividus(indId, { individus: [deptId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ individu: deptId, variation: 50, ecartMediane: 0 }],
      })
    }),
  )

  it(
    'retourne la variation entre les deux valeurs les plus récentes',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId, referentiel: { publicId: 'REF-A', nom: 'A' } },
          date: '2026-01-01',
          valeur: 50,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          date: '2026-02-01',
          valeur: 25,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          date: '2026-03-01',
          valeur: 75,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listSyntheseIndividus(indId, { individus: [deptId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ individu: deptId, variation: 50, ecartMediane: 0 }],
      })
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
        listSyntheseIndividus(indId, { individus: [deptId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ individu: deptId, variation: 65, ecartMediane: 0 }],
      })
    }),
  )

  it(
    'retourne un item par individu existant, triés par publicId',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [dept1, dept2, dept3] = testDeptIds(3)
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: {
            publicId: dept1,
            nom: 'A',
            referentiel: { publicId: 'REF-A', nom: 'A' },
          },
          date: '2026-01-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1 },
          date: '2026-02-01',
          valeur: 30,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2, nom: 'B', referentiel: { publicId: 'REF-A' } },
          date: '2026-01-01',
          valeur: 5,
        },
      )
      await fixtures.individu({
        publicId: dept3,
        nom: 'C',
        referentiel: { publicId: 'REF-A' },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listSyntheseIndividus(indId, { individus: [dept3, dept1, dept2] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          { individu: dept1, variation: 20, ecartMediane: 12.5 },
          { individu: dept2, variation: 5, ecartMediane: -12.5 },
          { individu: dept3, variation: null, ecartMediane: null },
        ],
      })
    }),
  )

  it(
    "ignore les valeurs d'autres indicateurs",
    integrationTest(async () => {
      const [indId, autreIndId] = [testIndicateurId(), testIndicateurId()]
      const deptId = testDeptId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId, referentiel: { publicId: 'REF-A', nom: 'A' } },
          date: '2026-01-01',
          valeur: 100,
        },
        {
          indicateur: { publicId: autreIndId, nom: 'Autre' },
          individu: { publicId: deptId },
          date: '2026-02-01',
          valeur: 9999,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listSyntheseIndividus(indId, { individus: [deptId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ individu: deptId, variation: 100, ecartMediane: 0 }],
      })
    }),
  )

  it(
    'omet les individus inexistants',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      const inconnu = testDeptId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: deptId, referentiel: { publicId: 'REF-A', nom: 'A' } },
        date: '2026-01-01',
        valeur: 42,
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listSyntheseIndividus(indId, { individus: [deptId, inconnu] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ individu: deptId, variation: 42, ecartMediane: 0 }],
      })
    }),
  )

  it(
    'évite les erreurs de précision IEEE 754 sur la variation',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId, referentiel: { publicId: 'REF-A', nom: 'A' } },
          date: '2026-01-01',
          valeur: 0.15,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          date: '2026-02-01',
          valeur: 0.3,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listSyntheseIndividus(indId, { individus: [deptId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ individu: deptId, variation: 0.15, ecartMediane: 0 }],
      })
    }),
  )

  it(
    "évite les erreurs de précision IEEE 754 sur l'écart à la médiane",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [dept1, dept2, dept3] = testDeptIds(3)
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1, referentiel: { publicId: 'REF-A', nom: 'A' } },
          date: '2026-01-01',
          valeur: 0.3,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2, referentiel: { publicId: 'REF-A' } },
          date: '2026-01-01',
          valeur: 0.15,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept3, referentiel: { publicId: 'REF-A' } },
          date: '2026-01-01',
          valeur: 0.45,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listSyntheseIndividus(indId, { individus: [dept1] }),
      )

      expect(result._unsafeUnwrap()).toMatchObject({
        items: [{ individu: dept1, ecartMediane: 0 }],
      })
    }),
  )

  it(
    "l'écart à la médiane utilise la valeur la plus récente de l'individu",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [dept1, dept2, dept3] = testDeptIds(3)
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1, referentiel: { publicId: 'REF-A', nom: 'A' } },
          date: '2026-01-01',
          valeur: 100,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1 },
          date: '2026-02-01',
          valeur: 40,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2, referentiel: { publicId: 'REF-A' } },
          date: '2026-01-01',
          valeur: 50,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept3, referentiel: { publicId: 'REF-A' } },
          date: '2026-01-01',
          valeur: 30,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listSyntheseIndividus(indId, { individus: [dept1] }),
      )

      expect(result._unsafeUnwrap()).toMatchObject({
        items: [{ individu: dept1, ecartMediane: 0 }],
      })
    }),
  )

  it(
    "l'écart à la médiane est scopé au référentiel de l'individu (ignore les autres référentiels)",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [deptA, deptB1, deptB2, deptB3] = testDeptIds(4)
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptA, referentiel: { publicId: 'REF-A', nom: 'A' } },
          date: '2026-01-01',
          valeur: 100,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptB1, referentiel: { publicId: 'REF-B', nom: 'B' } },
          date: '2026-01-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptB2, referentiel: { publicId: 'REF-B' } },
          date: '2026-01-01',
          valeur: 50,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptB3, referentiel: { publicId: 'REF-B' } },
          date: '2026-01-01',
          valeur: 90,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listSyntheseIndividus(indId, { individus: [deptA] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ individu: deptA, variation: 100, ecartMediane: 0 }],
      })
    }),
  )

  it(
    'calcule un écart à la médiane indépendant par référentiel pour des individus de référentiels différents',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [deptA1, deptA2, deptB1, deptB2] = testDeptIds(4)
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptA1, referentiel: { publicId: 'REF-A', nom: 'A' } },
          date: '2026-01-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptA2, referentiel: { publicId: 'REF-A' } },
          date: '2026-01-01',
          valeur: 30,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptB1, referentiel: { publicId: 'REF-B', nom: 'B' } },
          date: '2026-01-01',
          valeur: 100,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptB2, referentiel: { publicId: 'REF-B' } },
          date: '2026-01-01',
          valeur: 200,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listSyntheseIndividus(indId, { individus: [deptA1, deptB1] }),
      )

      const items = result._unsafeUnwrap().items
      const itemA1 = items.find((i) => i.individu === deptA1)
      const itemB1 = items.find((i) => i.individu === deptB1)
      expect(itemA1).toEqual({ individu: deptA1, variation: 10, ecartMediane: -10 })
      expect(itemB1).toEqual({ individu: deptB1, variation: 100, ecartMediane: -50 })
    }),
  )

  it(
    "rejette quand l'indicateur est introuvable",
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()
      await expect(
        runAsPrincipal(apiKey.id, () =>
          listSyntheseIndividus(testIndicateurId(), { individus: [testDeptId()] }),
        ),
      ).rejects.toThrow()
    }),
  )

  it(
    "rejette quand le principal n'a aucune permission sur un indicateur PRIVE",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PRIVE' })
      await fixtures.individu({ publicId: deptId, referentiel: { publicId: 'REF-A', nom: 'A' } })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () => listSyntheseIndividus(indId, { individus: [deptId] })),
      ).rejects.toThrow()
    }),
  )
})

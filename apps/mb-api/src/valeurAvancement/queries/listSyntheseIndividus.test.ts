import { describe, expect, it } from 'vitest'

import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptId, testDeptIds, testIndicateurId, testIndividuId } from '@/test/randomIds'
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

  // --- Cas dérivés ---

  it(
    'retourne variation et ecartMediane dérivées pour un individu agrégé (2 buckets)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refRegId = `REF-${testIndicateurId()}`
      const refDeptId = `REF-${testIndicateurId()}`
      const regId = testIndividuId()
      const deptId = testIndividuId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId, nom: 'T', visibilite: 'PUBLIC' },
        referentiel: { publicId: refRegId, nom: 'Régions' },
        fonctionAgregation: 'SUM',
      })
      await fixtures.relation({
        parent: { publicId: regId, referentiel: { publicId: refRegId } },
        child: { publicId: deptId, referentiel: { publicId: refDeptId, nom: 'Depts' } },
      })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          date: '2026-01-15',
          valeur: 100,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          date: '2026-02-10',
          valeur: 200,
        },
      )
      const apiKey = await fixtures.apiKey()

      // Buckets mensuels : 2026-01 → 100, 2026-02 → 200
      // derniers2Desc = [200, 100] → variation = 100
      // mediane = 200 (seule région), ecartMediane = 0
      const result = await runAsPrincipal(apiKey.id, () =>
        listSyntheseIndividus(indId, { individus: [regId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ individu: regId, variation: 100, ecartMediane: 0 }],
      })
    }),
  )

  it(
    'retourne variation = valeur dérivée et ecartMediane pour un individu agrégé avec un seul bucket',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refRegId = `REF-${testIndicateurId()}`
      const refDeptId = `REF-${testIndicateurId()}`
      const regId = testIndividuId()
      const deptId = testIndividuId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId, nom: 'T', visibilite: 'PUBLIC' },
        referentiel: { publicId: refRegId, nom: 'Régions' },
        fonctionAgregation: 'SUM',
      })
      await fixtures.relation({
        parent: { publicId: regId, referentiel: { publicId: refRegId } },
        child: { publicId: deptId, referentiel: { publicId: refDeptId, nom: 'Depts' } },
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: deptId },
        date: '2026-01-15',
        valeur: 50,
      })
      const apiKey = await fixtures.apiKey()

      // 1 seul bucket → variation = 50 (pas de précédent, équivalent saisie)
      const result = await runAsPrincipal(apiKey.id, () =>
        listSyntheseIndividus(indId, { individus: [regId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ individu: regId, variation: 50, ecartMediane: 0 }],
      })
    }),
  )

  it(
    'retourne variation null et ecartMediane null pour un individu agrégé sans descendant avec saisie',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refRegId = `REF-${testIndicateurId()}`
      const refDeptId = `REF-${testIndicateurId()}`
      const regId = testIndividuId()
      const deptId = testIndividuId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId, nom: 'T', visibilite: 'PUBLIC' },
        referentiel: { publicId: refRegId, nom: 'Régions' },
        fonctionAgregation: 'SUM',
      })
      await fixtures.relation({
        parent: { publicId: regId, referentiel: { publicId: refRegId } },
        child: { publicId: deptId, referentiel: { publicId: refDeptId, nom: 'Depts' } },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listSyntheseIndividus(indId, { individus: [regId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ individu: regId, variation: null, ecartMediane: null }],
      })
    }),
  )

  it(
    'calcule la médiane sur les valeurs dérivées de tous les membres du référentiel agrégé',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refRegId = `REF-${testIndicateurId()}`
      const refDeptId = `REF-${testIndicateurId()}`
      const [reg1, reg2] = [testIndividuId(), testIndividuId()]
      const [dept1, dept2] = [testIndividuId(), testIndividuId()]
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId, nom: 'T', visibilite: 'PUBLIC' },
        referentiel: { publicId: refRegId, nom: 'Régions' },
        fonctionAgregation: 'SUM',
      })
      await fixtures.relation(
        {
          parent: { publicId: reg1, referentiel: { publicId: refRegId } },
          child: { publicId: dept1, referentiel: { publicId: refDeptId, nom: 'Depts' } },
        },
        {
          parent: { publicId: reg2, referentiel: { publicId: refRegId } },
          child: { publicId: dept2, referentiel: { publicId: refDeptId } },
        },
      )
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1 },
          date: '2026-01-01',
          valeur: 100,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2 },
          date: '2026-01-01',
          valeur: 300,
        },
      )
      const apiKey = await fixtures.apiKey()

      // reg1 derivée = 100, reg2 derivée = 300
      // mediane = (100+300)/2 = 200
      // reg1.ecartMediane = 100-200 = -100, reg2.ecartMediane = 300-200 = 100
      const result = await runAsPrincipal(apiKey.id, () =>
        listSyntheseIndividus(indId, { individus: [reg1, reg2] }),
      )

      const items = result._unsafeUnwrap().items
      expect(items.find((i) => i.individu === reg1)).toEqual({
        individu: reg1,
        variation: 100,
        ecartMediane: -100,
      })
      expect(items.find((i) => i.individu === reg2)).toEqual({
        individu: reg2,
        variation: 300,
        ecartMediane: 100,
      })
    }),
  )

  it(
    'gère un mix individu agrégé (dérivé) et individu feuille (saisie) dans le même appel',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refRegId = `REF-${testIndicateurId()}`
      const refDeptId = `REF-${testIndicateurId()}`
      const regId = testIndividuId()
      const deptEnfantId = testIndividuId()
      const deptFeuilleId = testIndividuId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId, nom: 'T', visibilite: 'PUBLIC' },
        referentiel: { publicId: refRegId, nom: 'Régions' },
        fonctionAgregation: 'SUM',
      })
      await fixtures.relation({
        parent: { publicId: regId, referentiel: { publicId: refRegId } },
        child: { publicId: deptEnfantId, referentiel: { publicId: refDeptId, nom: 'Depts' } },
      })
      // deptFeuilleId est dans refDeptId sans lien d'agrégation : mode saisie
      await fixtures.individu({
        publicId: deptFeuilleId,
        referentiel: { publicId: refDeptId },
      })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptEnfantId },
          date: '2026-01-01',
          valeur: 120,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptFeuilleId },
          date: '2026-01-01',
          valeur: 80,
        },
      )
      const apiKey = await fixtures.apiKey()

      // reg: dérivée = 120, mediane régions = 120, ecartMediane = 0
      // deptFeuille: saisie = 80, mediane depts (80, 120) = 100, ecartMediane = -20
      const result = await runAsPrincipal(apiKey.id, () =>
        listSyntheseIndividus(indId, { individus: [regId, deptFeuilleId] }),
      )

      const items = result._unsafeUnwrap().items
      expect(items.find((i) => i.individu === regId)).toEqual({
        individu: regId,
        variation: 120,
        ecartMediane: 0,
      })
      expect(items.find((i) => i.individu === deptFeuilleId)).toEqual({
        individu: deptFeuilleId,
        variation: 80,
        ecartMediane: -20,
      })
    }),
  )
})

import { describe, expect, it } from 'vitest'

import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import {
  testDeptId,
  testIndicateurId,
  testIndividuId,
  testReferentielId,
  testReferentielIds,
  testRegId,
} from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'
import { listDerniersTauxProgression } from '@/valeurAvancement/queries/listDerniersTauxProgression'

describe.concurrent('listDerniersTauxProgression', () => {
  it(
    "calcule le taux sur l'individu sélectionné de ses référentiels",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      const refDept = testReferentielId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refDept, nom: 'Dép.' },
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: deptId, referentiel: { publicId: refDept } },
        date: '2026-01-01',
        valeur: 30,
      })
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indId },
        individu: { publicId: deptId },
        dateCible: '2026-12-01',
        valeurCible: 60,
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listDerniersTauxProgression({ query: { indicateurs: [indId], individus: [deptId] } }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            indicateur: indId,
            individu: deptId,
            tauxProgression: 50,
            valeurCible: 60,
            dateCible: '2026-12-01',
          },
        ],
      })
    }),
  )

  it(
    "calcule le taux sur l'individu racine sans sélection",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const franceId = testIndividuId()
      const bretagneId = testRegId()
      const [refNat, refReg] = testReferentielIds(2)
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.indicateurReferentiel(
        { indicateur: { publicId: indId }, referentiel: { publicId: refReg, nom: 'Rég.' } },
        // Sans agrégation, France se lit sur sa propre saisie et son propre objectif.
        {
          indicateur: { publicId: indId },
          referentiel: { publicId: refNat, nom: 'Nat.' },
          fonctionAgregation: 'NONE',
        },
      )
      await fixtures.relation({
        parent: { publicId: franceId, nom: 'France', referentiel: { publicId: refNat } },
        child: { publicId: bretagneId, nom: 'Bretagne', referentiel: { publicId: refReg } },
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: franceId },
        date: '2026-01-01',
        valeur: 40,
      })
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indId },
        individu: { publicId: franceId },
        dateCible: '2026-12-01',
        valeurCible: 80,
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listDerniersTauxProgression({ query: { indicateurs: [indId] } }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            indicateur: indId,
            individu: franceId,
            tauxProgression: 50,
            valeurCible: 80,
            dateCible: '2026-12-01',
          },
        ],
      })
    }),
  )
})

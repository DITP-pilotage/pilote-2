import { describe, expect, it } from 'vitest'

import { fixtures } from '@/test/fixtures'
import { indicateurWithTwoAxes } from '@/test/indicateurWithAxes'
import { integrationTest } from '@/test/integrationTest'
import { runAsPrincipal } from '@/test/runAsPrincipal'
import { getImportContext } from '@/valeurImport/queries/getImportContext'

describe.concurrent('getImportContext', () => {
  it(
    'renvoie les individus rattachés et les modalités feuilles de chaque axe, dans l’ordre des axes',
    integrationTest(async () => {
      const { apiKey, indicateurId, individuId, ids } = await indicateurWithTwoAxes()

      const result = await runAsPrincipal(apiKey.id, () =>
        getImportContext({ indicateurPublicId: indicateurId }),
      )

      const { indicateur, cibles } = result._unsafeUnwrap()
      expect(indicateur.nom).toEqual(expect.any(String))
      expect(cibles.individus.map((individu) => individu.id)).toEqual([individuId])
      expect(cibles.axes.map((axe) => axe.modalites.map((modalite) => modalite.id))).toEqual([
        [ids.orange, ids.sfr].toSorted(),
        // « Fiscale » a des enfants : on ne saisit pas dessus.
        [ids.tva, ids.ir].toSorted(),
      ])
    }),
  )

  it(
    'refuse un principal qui ne peut pas écrire les valeurs de l’indicateur',
    integrationTest(async () => {
      const { indicateurId } = await indicateurWithTwoAxes()
      const autre = await fixtures.apiKey()

      await expect(
        runAsPrincipal(autre.id, () => getImportContext({ indicateurPublicId: indicateurId })),
      ).rejects.toThrow()
    }),
  )
})

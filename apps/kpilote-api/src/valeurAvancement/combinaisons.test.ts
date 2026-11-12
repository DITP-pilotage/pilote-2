import { IndicateurPermissionAction } from '@/generated/prisma/enums'
import { describe, expect, it } from 'vitest'

import { trouverCombinaisonVideId } from '@/axe/combinaison'
import { db } from '@/framework/persistence/dbStore'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testAxeId, testDeptId, testIndicateurId, testReferentielId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'
import { deleteValeurAvancement } from '@/valeurAvancement/commands/deleteValeurAvancement'
import { upsertValeursAvancementBatch } from '@/valeurAvancement/commands/upsertValeursAvancementBatch'

const DATE = '2025-03-01'

// Une cellule (indicateur, individu, date) avec deux valeurs : l'une sur la
// combinaison vide, l'autre sur la combinaison {Orange}.
const celluleADeuxCombinaisons = async () => {
  const indicateurId = testIndicateurId()
  const referentiel = { publicId: testReferentielId() }
  const individuId = testDeptId()
  await fixtures.indicateurReferentiel({ indicateur: { publicId: indicateurId }, referentiel })
  const individu = { publicId: individuId, referentiel }
  const orange = await fixtures.modalite({
    nom: 'Orange',
    niveau: { axe: { publicId: testAxeId() } },
  })
  const combinaisonOrange = { modalites: [{ publicId: orange.publicId }] }

  await fixtures.valeurAvancement(
    { indicateur: { publicId: indicateurId }, individu, date: DATE, valeur: 10 },
    {
      indicateur: { publicId: indicateurId },
      individu,
      date: DATE,
      valeur: 3,
      combinaison: combinaisonOrange,
    },
  )
  const apiKey = await fixtures.apiKey({
    permissions: [
      { indicateur: { publicId: indicateurId }, action: IndicateurPermissionAction.WRITE_DATA },
    ],
  })
  const orangeId = (await fixtures.combinaison(combinaisonOrange)).id
  return { indicateurId, individuId, apiKey, orangeId }
}

const valeursParCombinaison = async (indicateurPublicId: string) => {
  const valeurs = await db().valeurAvancement.findMany({
    where: { indicateur: { publicId: indicateurPublicId } },
  })
  return new Map(valeurs.map((valeur) => [valeur.combinaisonId, Number(valeur.valeur)]))
}

describe.concurrent('valeurs de plusieurs combinaisons sur une même cellule', () => {
  it(
    'coexistent pour un même individu et une même date',
    integrationTest(async () => {
      const { indicateurId, orangeId } = await celluleADeuxCombinaisons()

      const valeurs = await valeursParCombinaison(indicateurId)

      expect(valeurs.get(await trouverCombinaisonVideId())).toBe(10)
      expect(valeurs.get(orangeId)).toBe(3)
    }),
  )

  it(
    'la suppression d’une valeur ne touche pas les autres combinaisons',
    integrationTest(async () => {
      const { indicateurId, individuId, apiKey, orangeId } = await celluleADeuxCombinaisons()

      const result = await runAsPrincipal(apiKey.id, () =>
        deleteValeurAvancement({
          indicateurPublicId: indicateurId,
          body: { individu: individuId, date: DATE },
        }),
      )

      expect(result.isOk()).toBe(true)
      const valeurs = await valeursParCombinaison(indicateurId)
      expect([...valeurs.entries()]).toEqual([[orangeId, 3]])
    }),
  )

  it(
    'l’écriture en lot ne touche pas les autres combinaisons',
    integrationTest(async () => {
      const { indicateurId, individuId, apiKey, orangeId } = await celluleADeuxCombinaisons()

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertValeursAvancementBatch(indicateurId, {
          items: [{ individu: individuId, date: DATE, valeur: 42 }],
        }),
      )

      expect(result.isOk()).toBe(true)
      const valeurs = await valeursParCombinaison(indicateurId)
      expect(valeurs.get(await trouverCombinaisonVideId())).toBe(42)
      expect(valeurs.get(orangeId)).toBe(3)
    }),
  )
})

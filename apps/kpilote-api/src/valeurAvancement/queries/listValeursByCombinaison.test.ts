import { describe, expect, it } from 'vitest'

import { IndicateurPermissionAction } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testAxeId, testDeptId, testIndicateurNumericId, testModaliteId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'
import { listValeursByCombinaison } from '@/valeurAvancement/queries/listValeursByCombinaison'

// Deux axes en somme : Opérateur (France Travail, CAF) puis Type de fraude (Fiscale > TVA,
// Sociale). La CAF n'a jamais de valeur en TVA.
const deuxAxes = async () => {
  const indicateur = { publicId: testIndicateurNumericId() }
  const individu = { publicId: testDeptId() }
  const operateur = { publicId: testAxeId() }
  const type = { publicId: testAxeId() }
  const [ft, caf, fiscale, tva, sociale] = [
    testModaliteId(),
    testModaliteId(),
    testModaliteId(),
    testModaliteId(),
    testModaliteId(),
  ]
  await fixtures.modalite(
    { publicId: ft, nom: 'France Travail', niveau: { axe: operateur } },
    { publicId: caf, nom: 'CAF', niveau: { axe: operateur } },
    { publicId: fiscale, nom: 'Fiscale', niveau: { axe: type, ordre: 1 } },
    { publicId: sociale, nom: 'Sociale', niveau: { axe: type, ordre: 1 } },
    {
      publicId: tva,
      nom: 'TVA',
      niveau: { axe: type, ordre: 2 },
      parent: { publicId: fiscale },
    },
  )
  await fixtures.indicateurAxe(
    { indicateur, axe: operateur, fonction: 'SUM', ordre: 1 },
    { indicateur, axe: type, fonction: 'SUM', ordre: 2 },
  )
  const saisie = ({
    modalites,
    date,
    valeur,
  }: {
    modalites: string[]
    date: string
    valeur: number
  }) =>
    fixtures.valeurAvancement({
      indicateur,
      individu,
      date,
      valeur,
      combinaison: { modalites: modalites.map((publicId) => ({ publicId })) },
    })
  await saisie({ modalites: [ft, tva], date: '2025-01-01', valeur: 1 })
  await saisie({ modalites: [ft, tva], date: '2025-03-01', valeur: 5 })
  await saisie({ modalites: [ft, sociale], date: '2025-01-01', valeur: 4 })
  await saisie({ modalites: [caf, sociale], date: '2025-02-01', valeur: 2 })
  const apiKey = await fixtures.apiKey({
    permissions: [{ indicateur, action: IndicateurPermissionAction.READ }],
  })
  return {
    apiKeyId: apiKey.id,
    indicateurId: indicateur.publicId,
    individuId: individu.publicId,
    ft,
    caf,
    fiscale,
    tva,
    sociale,
  }
}

describe.concurrent('listValeursByCombinaison', () => {
  it(
    'renvoie la série de chaque combinaison observée, « Tous » et parentes comprises',
    integrationTest(async () => {
      const c = await deuxAxes()

      const result = await runAsPrincipal(c.apiKeyId, () =>
        listValeursByCombinaison({
          indicateurPublicId: c.indicateurId,
          params: { individu: c.individuId },
        }),
      )

      const { items } = result._unsafeUnwrap()
      const byKey = Object.fromEntries(items.map((item) => [item.modalites.join(','), item]))
      // 3 × 4 combinaisons, moins CAF × TVA et CAF × Fiscale, jamais saisies.
      expect(items).toHaveLength(10)
      expect(byKey[[c.caf, c.tva].join(',')]).toBeUndefined()
      expect(byKey[[c.caf, c.fiscale].join(',')]).toBeUndefined()
      expect(byKey['']?.valeurs.map(({ date, valeur, type }) => ({ date, valeur, type }))).toEqual([
        { date: '2025-01-01', valeur: 5, type: 'derivee' },
        { date: '2025-02-01', valeur: 7, type: 'derivee' },
        { date: '2025-03-01', valeur: 11, type: 'derivee' },
      ])
      expect(
        byKey[[c.ft, c.tva].join(',')]?.valeurs.map(({ date, valeur, type }) => ({
          date,
          valeur,
          type,
        })),
      ).toEqual([
        { date: '2025-01-01', valeur: 1, type: 'saisie' },
        { date: '2025-03-01', valeur: 5, type: 'saisie' },
      ])
      expect(byKey[c.sociale]?.valeurs.map(({ valeur }) => valeur)).toEqual([4, 6])
    }),
  )

  it(
    'renvoie une liste vide pour un individu inconnu',
    integrationTest(async () => {
      const c = await deuxAxes()

      const result = await runAsPrincipal(c.apiKeyId, () =>
        listValeursByCombinaison({
          indicateurPublicId: c.indicateurId,
          params: { individu: testDeptId() },
        }),
      )

      expect(result._unsafeUnwrap()).toEqual({ items: [] })
    }),
  )
})

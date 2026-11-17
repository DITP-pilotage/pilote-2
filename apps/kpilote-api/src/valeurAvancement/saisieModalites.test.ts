import { IndicateurPermissionAction } from '@/generated/prisma/enums'
import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import {
  testAxeId,
  testDeptId,
  testIndicateurId,
  testModaliteId,
  testReferentielId,
} from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'
import { deleteValeurAvancement } from '@/valeurAvancement/commands/deleteValeurAvancement'
import { upsertValeurAvancement } from '@/valeurAvancement/commands/upsertValeurAvancement'
import { upsertValeursAvancementBatch } from '@/valeurAvancement/commands/upsertValeursAvancementBatch'

const DATE = '2025-03-01'

// Indicateur à deux axes, dans cet ordre :
//  - Opérateur : Orange, SFR (un niveau) ;
//  - Type de fraude : Fiscale > TVA, IR (deux niveaux).
// Un troisième axe existe sans être déclaré sur l'indicateur.
const indicateurADeuxAxes = async () => {
  const indicateurId = testIndicateurId()
  const referentiel = { publicId: testReferentielId() }
  const individuId = testDeptId()
  await fixtures.indicateurReferentiel({ indicateur: { publicId: indicateurId }, referentiel })
  await fixtures.individu({ publicId: individuId, referentiel })

  const operateur = { publicId: testAxeId() }
  const fraude = { publicId: testAxeId() }
  const ids = {
    orange: testModaliteId(),
    sfr: testModaliteId(),
    fiscale: testModaliteId(),
    tva: testModaliteId(),
    ir: testModaliteId(),
    autre: testModaliteId(),
  }
  await fixtures.modalite(
    { publicId: ids.orange, nom: 'Orange', niveau: { axe: operateur } },
    { publicId: ids.sfr, nom: 'SFR', niveau: { axe: operateur } },
    { publicId: ids.fiscale, nom: 'Fiscale', niveau: { axe: fraude, ordre: 1 } },
    {
      publicId: ids.tva,
      nom: 'TVA',
      niveau: { axe: fraude, ordre: 2 },
      parent: { publicId: ids.fiscale },
    },
    {
      publicId: ids.ir,
      nom: 'IR',
      niveau: { axe: fraude, ordre: 2 },
      parent: { publicId: ids.fiscale },
    },
    { publicId: ids.autre, nom: 'Autre', niveau: { axe: { publicId: testAxeId() } } },
  )
  await fixtures.indicateurAxe(
    { indicateur: { publicId: indicateurId }, axe: operateur, ordre: 1 },
    { indicateur: { publicId: indicateurId }, axe: fraude, ordre: 2 },
  )
  const apiKey = await fixtures.apiKey({
    permissions: [
      { indicateur: { publicId: indicateurId }, action: IndicateurPermissionAction.WRITE_DATA },
    ],
  })
  return { indicateurId, individuId, apiKey, axes: { operateur, fraude }, ids }
}

const indicateurSansAxe = async () => {
  const indicateurId = testIndicateurId()
  const referentiel = { publicId: testReferentielId() }
  const individuId = testDeptId()
  await fixtures.indicateurReferentiel({ indicateur: { publicId: indicateurId }, referentiel })
  await fixtures.individu({ publicId: individuId, referentiel })
  const orange = await fixtures.modalite({ niveau: { axe: { publicId: testAxeId() } } })
  const apiKey = await fixtures.apiKey({
    permissions: [
      { indicateur: { publicId: indicateurId }, action: IndicateurPermissionAction.WRITE_DATA },
    ],
  })
  return { indicateurId, individuId, apiKey, orange: orange.publicId }
}

// Les valeurs de l'indicateur, par modalités de leur combinaison (triées).
const valeursParModalites = async (indicateurPublicId: string) => {
  const valeurs = await db().valeurAvancement.findMany({
    where: { indicateur: { publicId: indicateurPublicId } },
    include: { combinaison: { include: { modalites: { include: { modalite: true } } } } },
  })
  return new Map(
    valeurs.map((valeur) => [
      valeur.combinaison.modalites
        .map(({ modalite }) => modalite.publicId)
        .sort()
        .join('+'),
      Number(valeur.valeur),
    ]),
  )
}

const cle = (...publicIds: string[]) => [...publicIds].sort().join('+')

describe.concurrent('saisie unitaire avec modalités', () => {
  it(
    'saisit sur une cellule complète et renvoie les modalités dans l’ordre des axes',
    integrationTest(async () => {
      const { indicateurId, individuId, apiKey, ids } = await indicateurADeuxAxes()

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertValeurAvancement({
          indicateurPublicId: indicateurId,
          body: { individu: individuId, modalites: [ids.tva, ids.orange], date: DATE, valeur: 42 },
        }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        indicateur: indicateurId,
        individu: individuId,
        modalites: [ids.orange, ids.tva],
        date: DATE,
        valeur: 42,
        type: 'saisie',
      })
      expect(await valeursParModalites(indicateurId)).toEqual(
        new Map([[cle(ids.orange, ids.tva), 42]]),
      )
    }),
  )

  it(
    'remplace la valeur de la même cellule, sans recréer la combinaison',
    integrationTest(async () => {
      const { indicateurId, individuId, apiKey, ids } = await indicateurADeuxAxes()
      const saisir = (valeur: number) =>
        runAsPrincipal(apiKey.id, () =>
          upsertValeurAvancement({
            indicateurPublicId: indicateurId,
            body: { individu: individuId, modalites: [ids.orange, ids.ir], date: DATE, valeur },
          }),
        )

      await saisir(1)
      await saisir(2)

      expect(await valeursParModalites(indicateurId)).toEqual(
        new Map([[cle(ids.orange, ids.ir), 2]]),
      )
    }),
  )

  it(
    'refuse chaque saisie incomplète ou invalide',
    integrationTest(async () => {
      const { indicateurId, individuId, apiKey, axes, ids } = await indicateurADeuxAxes()
      const inconnue = testModaliteId()
      const saisir = (modalites: string[] | undefined) =>
        runAsPrincipal(apiKey.id, () =>
          upsertValeurAvancement({
            indicateurPublicId: indicateurId,
            body: { individu: individuId, modalites, date: DATE, valeur: 1 },
          }),
        )

      expect((await saisir(undefined))._unsafeUnwrapErr()).toEqual({
        type: 'MODALITE_MANQUANTE',
        axes: [axes.operateur.publicId, axes.fraude.publicId],
      })
      expect((await saisir([ids.orange]))._unsafeUnwrapErr()).toEqual({
        type: 'MODALITE_MANQUANTE',
        axes: [axes.fraude.publicId],
      })
      expect((await saisir([ids.orange, inconnue]))._unsafeUnwrapErr()).toEqual({
        type: 'MODALITE_INCONNUE',
        modalites: [inconnue],
      })
      expect((await saisir([ids.orange, ids.tva, ids.autre]))._unsafeUnwrapErr()).toEqual({
        type: 'AXE_NON_DECLARE',
        modalites: [ids.autre],
      })
      expect((await saisir([ids.orange, ids.sfr, ids.tva]))._unsafeUnwrapErr()).toEqual({
        type: 'MODALITES_MEME_AXE',
        axe: axes.operateur.publicId,
        modalites: [ids.orange, ids.sfr].sort(),
      })
      expect((await saisir([ids.orange, ids.fiscale]))._unsafeUnwrapErr()).toEqual({
        type: 'MODALITE_NON_FEUILLE',
        modalites: [ids.fiscale],
      })
      expect(await valeursParModalites(indicateurId)).toEqual(new Map())
    }),
  )

  it(
    'garde le format historique pour un indicateur sans axe',
    integrationTest(async () => {
      const { indicateurId, individuId, apiKey, orange } = await indicateurSansAxe()
      const saisir = (modalites: string[] | undefined) =>
        runAsPrincipal(apiKey.id, () =>
          upsertValeurAvancement({
            indicateurPublicId: indicateurId,
            body: { individu: individuId, modalites, date: DATE, valeur: 5 },
          }),
        )

      expect((await saisir([]))._unsafeUnwrap()).not.toHaveProperty('modalites')
      expect((await saisir(undefined))._unsafeUnwrap()).not.toHaveProperty('modalites')
      expect((await saisir([orange]))._unsafeUnwrapErr()).toEqual({
        type: 'AXE_NON_DECLARE',
        modalites: [orange],
      })
    }),
  )
})

describe.concurrent('suppression avec modalités', () => {
  it(
    'supprime la seule valeur de la cellule visée',
    integrationTest(async () => {
      const { indicateurId, individuId, apiKey, ids } = await indicateurADeuxAxes()
      await runAsPrincipal(apiKey.id, () =>
        upsertValeursAvancementBatch(indicateurId, {
          items: [
            { individu: individuId, modalites: [ids.orange, ids.tva], date: DATE, valeur: 1 },
            { individu: individuId, modalites: [ids.sfr, ids.tva], date: DATE, valeur: 2 },
          ],
        }),
      )

      const result = await runAsPrincipal(apiKey.id, () =>
        deleteValeurAvancement({
          indicateurPublicId: indicateurId,
          body: { individu: individuId, modalites: [ids.orange, ids.tva], date: DATE },
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(await valeursParModalites(indicateurId)).toEqual(new Map([[cle(ids.sfr, ids.tva), 2]]))
    }),
  )

  it(
    'ne fait rien sur une combinaison jamais saisie, et refuse une cellule incomplète',
    integrationTest(async () => {
      const { indicateurId, individuId, apiKey, axes, ids } = await indicateurADeuxAxes()
      const supprimer = (modalites: string[]) =>
        runAsPrincipal(apiKey.id, () =>
          deleteValeurAvancement({
            indicateurPublicId: indicateurId,
            body: { individu: individuId, modalites, date: DATE },
          }),
        )

      expect((await supprimer([ids.sfr, ids.ir])).isOk()).toBe(true)
      expect((await supprimer([ids.sfr]))._unsafeUnwrapErr()).toEqual({
        type: 'MODALITE_MANQUANTE',
        axes: [axes.fraude.publicId],
      })
    }),
  )
})

describe.concurrent('saisie en lot avec modalités', () => {
  it(
    'écrit chaque cellule sur sa combinaison, et met à jour au second passage',
    integrationTest(async () => {
      const { indicateurId, individuId, apiKey, ids } = await indicateurADeuxAxes()
      const lot = (valeur: number) =>
        runAsPrincipal(apiKey.id, () =>
          upsertValeursAvancementBatch(indicateurId, {
            items: [
              { individu: individuId, modalites: [ids.orange, ids.tva], date: DATE, valeur },
              { individu: individuId, modalites: [ids.sfr, ids.tva], date: DATE, valeur },
              { individu: individuId, modalites: [ids.ir, ids.sfr], date: DATE, valeur },
            ],
          }),
        )

      expect((await lot(1))._unsafeUnwrap()).toEqual({ total: 3, created: 3, updated: 0 })
      expect((await lot(2))._unsafeUnwrap()).toEqual({ total: 3, created: 0, updated: 3 })
      expect(await valeursParModalites(indicateurId)).toEqual(
        new Map([
          [cle(ids.orange, ids.tva), 2],
          [cle(ids.sfr, ids.tva), 2],
          [cle(ids.sfr, ids.ir), 2],
        ]),
      )
    }),
  )

  it(
    'agrège les erreurs de modalités par cause et n’applique rien',
    integrationTest(async () => {
      const { indicateurId, individuId, apiKey, axes, ids } = await indicateurADeuxAxes()
      const inconnue = testModaliteId()

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertValeursAvancementBatch(indicateurId, {
          items: [
            { individu: individuId, modalites: [ids.orange, inconnue], date: DATE, valeur: 1 },
            { individu: individuId, modalites: [ids.orange], date: DATE, valeur: 1 },
            { individu: individuId, modalites: [ids.sfr, inconnue], date: '2025-04-01', valeur: 1 },
            { individu: individuId, modalites: [ids.sfr, ids.fiscale], date: DATE, valeur: 1 },
            { individu: individuId, modalites: [ids.sfr, ids.orange], date: DATE, valeur: 1 },
            { individu: individuId, modalites: [ids.autre], date: DATE, valeur: 1 },
            { individu: individuId, modalites: [ids.sfr, ids.ir], date: DATE, valeur: 1 },
          ],
        }),
      )

      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'BATCH_INVALID',
        errors: [
          { code: 'MODALITE_INCONNUE', indices: [0, 2], modalite: inconnue },
          { code: 'MODALITE_MANQUANTE', indices: [1], axe: axes.fraude.publicId },
          { code: 'MODALITE_NON_FEUILLE', indices: [3], modalite: ids.fiscale },
          { code: 'MODALITES_MEME_AXE', indices: [4], axe: axes.operateur.publicId },
          { code: 'AXE_NON_DECLARE', indices: [5], modalite: ids.autre },
        ],
      })
      expect(await valeursParModalites(indicateurId)).toEqual(new Map())
    }),
  )

  it(
    'refuse un doublon de cellule, quel que soit l’ordre des modalités',
    integrationTest(async () => {
      const { indicateurId, individuId, apiKey, ids } = await indicateurADeuxAxes()

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertValeursAvancementBatch(indicateurId, {
          items: [
            { individu: individuId, modalites: [ids.orange, ids.tva], date: DATE, valeur: 1 },
            { individu: individuId, modalites: [ids.sfr, ids.tva], date: DATE, valeur: 2 },
            { individu: individuId, modalites: [ids.tva, ids.orange], date: DATE, valeur: 3 },
          ],
        }),
      )

      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'BATCH_INVALID',
        errors: [
          {
            code: 'DUPLICATE_KEY',
            indices: [0, 2],
            individu: individuId,
            modalites: [ids.orange, ids.tva],
            date: DATE,
          },
        ],
      })
    }),
  )

  it(
    'refuse des modalités sur un indicateur sans axe',
    integrationTest(async () => {
      const { indicateurId, individuId, apiKey, orange } = await indicateurSansAxe()

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertValeursAvancementBatch(indicateurId, {
          items: [
            { individu: individuId, date: DATE, valeur: 1 },
            { individu: individuId, modalites: [orange], date: '2025-04-01', valeur: 1 },
          ],
        }),
      )

      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'BATCH_INVALID',
        errors: [{ code: 'AXE_NON_DECLARE', indices: [1], modalite: orange }],
      })
    }),
  )
})

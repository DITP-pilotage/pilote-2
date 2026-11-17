import { okAsync } from 'neverthrow'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { IndicateurPermissionAction } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import {
  testAxeId,
  testDeptIds,
  testIndicateurId,
  testModaliteId,
  testReferentielId,
} from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'
import { decouvrirStructure, type Plan } from '@/valeurImport/calls/decouvrirStructure'
import { resoudreIndividus } from '@/valeurImport/calls/resoudreIndividus'
import { resolveLabels } from '@/valeurImport/calls/resolveLabels'
import { normaliserValeursImport } from '@/valeurImport/commands/normaliserValeursImport'

// Albert est remplacé par des doublures déterministes, partagées par les tests
// du fichier (d'où `concurrent: false`) :
//  - la découverte renvoie le plan choisi par le nom du fichier ;
//  - les individus se résolvent par leur nom exact ;
//  - la résolution des modalités par Albert ne rattache rien (seule la
//    correspondance exacte, faite sans Albert, rattache des libellés).
vi.mock('@/valeurImport/calls/decouvrirStructure', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/valeurImport/calls/decouvrirStructure')>()),
  decouvrirStructure: vi.fn(),
}))
vi.mock('@/valeurImport/calls/resoudreIndividus', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/valeurImport/calls/resoudreIndividus')>()),
  resoudreIndividus: vi.fn(),
}))
vi.mock('@/valeurImport/calls/resolveLabels', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/valeurImport/calls/resolveLabels')>()),
  resolveLabels: vi.fn(),
}))

const planLong = (colonnesAxes?: Plan['colonnesAxes']): Plan => ({
  layout: 'long',
  colonneIndividu: 'territoire',
  colonneDate: { nom: 'date' },
  colonneValeur: 'valeur',
  ...(colonnesAxes ? { colonnesAxes } : {}),
})

beforeEach(() => {
  vi.mocked(decouvrirStructure).mockReset()
  vi.mocked(resolveLabels).mockReset()
  vi.mocked(resoudreIndividus).mockImplementation(({ individusValides, libellesSources }) => {
    const parNom = new Map(individusValides.map((individu) => [individu.nom, individu.publicId]))
    return okAsync({
      mapping: libellesSources
        .filter((libelle) => parNom.has(libelle))
        .map((libelle) => ({ libelleSource: libelle, individuPublicId: parNom.get(libelle)! })),
      nonResolus: libellesSources
        .filter((libelle) => !parNom.has(libelle))
        .map((libelle) => ({ libelleSource: libelle, raison: 'Inconnu.' })),
    })
  })
  vi.mocked(resolveLabels).mockImplementation(({ libellesSources }) =>
    okAsync({
      mapping: [],
      nonResolus: libellesSources.map((libelle) => ({
        libelleSource: libelle,
        raison: 'Albert ne reconnaît pas ce libellé.',
      })),
    }),
  )
})

// Deux individus, dont une commune nommée « Orange » ; deux axes :
// Opérateur (Orange, SFR) puis Type de fraude (Fiscale > TVA, IR).
const indicateurWithTwoAxes = async () => {
  const indicateurId = testIndicateurId()
  const referentiel = { publicId: testReferentielId() }
  const [communeOrange, ain] = testDeptIds(2)
  await fixtures.indicateurReferentiel({ indicateur: { publicId: indicateurId }, referentiel })
  await fixtures.individu(
    { publicId: communeOrange, nom: 'Orange', referentiel },
    { publicId: ain, nom: 'Ain', referentiel },
  )
  const operateur = { publicId: testAxeId() }
  const fraude = { publicId: testAxeId() }
  const ids = {
    orange: testModaliteId(),
    sfr: testModaliteId(),
    fiscale: testModaliteId(),
    tva: testModaliteId(),
    ir: testModaliteId(),
  }
  await fixtures.axe({ ...operateur, nom: 'Opérateur' }, { ...fraude, nom: 'Type de fraude' })
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
  )
  await fixtures.indicateurAxe(
    { indicateur: { publicId: indicateurId }, axe: operateur, ordre: 1 },
    { indicateur: { publicId: indicateurId }, axe: fraude, ordre: 2 },
  )
  const apiKey = await fixtures.apiKey({
    permissions: [
      { indicateur: { publicId: indicateurId }, action: IndicateurPermissionAction.READ },
    ],
  })
  return { indicateurId, communeOrange, ain, apiKey, axes: { operateur, fraude }, ids }
}

describe('normaliserValeursImport — indicateur à axes', { concurrent: false }, () => {
  it(
    'layout long : résout chaque colonne contre les modalités de son axe, et écarte les lignes incomplètes',
    integrationTest(async () => {
      const { indicateurId, communeOrange, ain, apiKey, axes, ids } = await indicateurWithTwoAxes()
      vi.mocked(decouvrirStructure).mockImplementation(() =>
        okAsync(
          planLong([
            { colonne: 'operateur', axe: axes.operateur.publicId },
            { colonne: 'fraude', axe: axes.fraude.publicId },
          ]),
        ),
      )
      const rows = [
        { territoire: 'Orange', operateur: 'Orange', fraude: 'TVA', date: '2024-01-01', valeur: 1 },
        { territoire: 'Ain', operateur: 'sfr', fraude: 'IR', date: '2024-01-01', valeur: 2 },
        { territoire: 'Ain', operateur: 'Bouygues', fraude: 'TVA', date: '2024-01-01', valeur: 3 },
        { territoire: 'Ain', operateur: 'Orange', fraude: '', date: '2024-01-01', valeur: 4 },
        {
          territoire: 'Ain',
          operateur: 'Orange',
          fraude: 'Fiscale',
          date: '2024-01-01',
          valeur: 5,
        },
      ]

      const result = await runAsPrincipal(apiKey.id, () =>
        normaliserValeursImport(indicateurId, { rows, nomFichier: 'axes.csv' }),
      )

      const { items, warnings, resolution } = result._unsafeUnwrap()
      expect(items).toEqual([
        {
          individu: communeOrange,
          modalites: [ids.orange, ids.tva],
          date: '2024-01-01',
          valeur: 1,
        },
        { individu: ain, modalites: [ids.sfr, ids.ir], date: '2024-01-01', valeur: 2 },
      ])
      expect(warnings.map(({ code, libelleSource }) => ({ code, libelleSource }))).toEqual([
        { code: 'MODALITE_NON_RESOLUE', libelleSource: 'Bouygues' },
        { code: 'LIGNE_PARTIELLE', libelleSource: undefined },
        { code: 'MODALITE_NON_RESOLUE', libelleSource: 'Fiscale' },
      ])
      // Albert ne voit que les libellés que la correspondance exacte n'a pas
      // rattachés, et seulement les modalités feuilles de l'axe de la colonne.
      expect(
        vi.mocked(resolveLabels).mock.calls.map(([params]) => ({
          libelles: params.libellesSources,
          candidats: [...params.publicIdsValides].sort(),
        })),
      ).toEqual([
        { libelles: ['Bouygues'], candidats: [ids.orange, ids.sfr].sort() },
        { libelles: ['Fiscale'], candidats: [ids.tva, ids.ir].sort() },
      ])
      expect(resolution.colonnesAxes).toEqual([
        {
          colonne: 'operateur',
          axe: axes.operateur.publicId,
          mapping: [
            { libelleSource: 'Orange', modalitePublicId: ids.orange },
            { libelleSource: 'sfr', modalitePublicId: ids.sfr },
          ],
          nonResolus: [
            { libelleSource: 'Bouygues', raison: 'Albert ne reconnaît pas ce libellé.' },
          ],
        },
        {
          colonne: 'fraude',
          axe: axes.fraude.publicId,
          mapping: [
            { libelleSource: 'TVA', modalitePublicId: ids.tva },
            { libelleSource: 'IR', modalitePublicId: ids.ir },
          ],
          nonResolus: [{ libelleSource: 'Fiscale', raison: 'Albert ne reconnaît pas ce libellé.' }],
        },
      ])
    }),
  )

  it(
    'layout pivot : les modalités de la ligne valent pour chaque date',
    integrationTest(async () => {
      const { indicateurId, ain, apiKey, axes, ids } = await indicateurWithTwoAxes()
      vi.mocked(decouvrirStructure).mockImplementation(() =>
        okAsync({
          layout: 'pivot',
          colonneIndividu: 'territoire',
          colonnesPivot: [
            { nom: '2023', dateIso: '2023-01-01' },
            { nom: '2024', dateIso: '2024-01-01' },
          ],
          colonnesAxes: [
            { colonne: 'operateur', axe: axes.operateur.publicId },
            { colonne: 'fraude', axe: axes.fraude.publicId },
          ],
        }),
      )
      const rows = [{ territoire: 'Ain', operateur: 'SFR', fraude: 'TVA', 2023: 7, 2024: 8 }]

      const result = await runAsPrincipal(apiKey.id, () =>
        normaliserValeursImport(indicateurId, { rows, nomFichier: 'pivot.csv' }),
      )

      expect(result._unsafeUnwrap().items).toEqual([
        { individu: ain, modalites: [ids.sfr, ids.tva], date: '2023-01-01', valeur: 7 },
        { individu: ain, modalites: [ids.sfr, ids.tva], date: '2024-01-01', valeur: 8 },
      ])
      expect(resolveLabels).not.toHaveBeenCalled()
    }),
  )

  it(
    'n’importe rien quand un axe n’a pas de colonne dans le fichier',
    integrationTest(async () => {
      const { indicateurId, apiKey, axes } = await indicateurWithTwoAxes()
      vi.mocked(decouvrirStructure).mockImplementation(() =>
        okAsync(planLong([{ colonne: 'operateur', axe: axes.operateur.publicId }])),
      )
      const rows = [{ territoire: 'Ain', operateur: 'SFR', date: '2024-01-01', valeur: 1 }]

      const result = await runAsPrincipal(apiKey.id, () =>
        normaliserValeursImport(indicateurId, { rows, nomFichier: 'partiel.csv' }),
      )

      const { items, warnings } = result._unsafeUnwrap()
      expect(items).toEqual([])
      expect(warnings.map((warning) => warning.code)).toEqual(['AXE_NON_COUVERT'])
      expect(warnings[0]!.message).toContain('Type de fraude')
    }),
  )
})

describe('normaliserValeursImport — indicateur sans axe', { concurrent: false }, () => {
  it(
    'ne propose aucun axe à Albert et garde la sortie historique',
    integrationTest(async () => {
      const indicateurId = testIndicateurId()
      const referentiel = { publicId: testReferentielId() }
      const [ain] = testDeptIds(1)
      await fixtures.indicateurReferentiel({ indicateur: { publicId: indicateurId }, referentiel })
      await fixtures.individu({ publicId: ain, nom: 'Ain', referentiel })
      const apiKey = await fixtures.apiKey({
        permissions: [
          { indicateur: { publicId: indicateurId }, action: IndicateurPermissionAction.READ },
        ],
      })
      vi.mocked(decouvrirStructure).mockImplementation(() => okAsync(planLong()))
      const rows = [{ territoire: 'Ain', date: '2024-01-01', valeur: 1 }]

      const result = await runAsPrincipal(apiKey.id, () =>
        normaliserValeursImport(indicateurId, { rows, nomFichier: 'mono.csv' }),
      )

      expect(vi.mocked(decouvrirStructure).mock.calls[0]![0].axes).toEqual([])
      expect(result._unsafeUnwrap()).toEqual({
        plan: planLong(),
        resolution: { mapping: [{ libelleSource: 'Ain', individuPublicId: ain }], nonResolus: [] },
        items: [{ individu: ain, date: '2024-01-01', valeur: 1 }],
        warnings: [],
        rapport: {
          totalLignes: 1,
          totalItemsProduits: 1,
          totalLibellesSources: 1,
          totalLibellesMappes: 1,
          totalLibellesNonResolus: 0,
        },
      })
      expect(resolveLabels).not.toHaveBeenCalled()
    }),
  )
})

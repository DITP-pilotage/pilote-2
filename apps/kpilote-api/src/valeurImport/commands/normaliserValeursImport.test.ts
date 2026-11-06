import { okAsync } from 'neverthrow'
import { describe, expect, it, vi } from 'vitest'

import { FonctionAgregation } from '@/generated/prisma/enums'
import { decouvrirStructure, type Plan } from '@/valeurImport/calls/decouvrirStructure'
import { resoudreIndividus } from '@/valeurImport/calls/resoudreIndividus'
import { normaliserValeursImport } from '@/valeurImport/commands/normaliserValeursImport'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testIndividuId, testReferentielId } from '@/test/randomIds'
import { runAsAdmin } from '@/test/runAsPrincipal'

// Albert est mocké. Les tests tournant en concurrence, les faux sont fixés une fois
// pour toutes et déterministes : le plan est choisi par nom de fichier, la
// résolution rattache un libellé au membre de même nom PARMI CEUX FOURNIS (ambigu →
// non résolu). Une résolution contre tous les individus confondrait donc « Orange »
// commune et « Orange » opérateur : les tests de collision le vérifient.
vi.mock('@/valeurImport/calls/decouvrirStructure', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/valeurImport/calls/decouvrirStructure')>()),
  decouvrirStructure: vi.fn(),
}))
vi.mock('@/valeurImport/calls/resoudreIndividus', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/valeurImport/calls/resoudreIndividus')>()),
  resoudreIndividus: vi.fn(),
}))

const planLong: Plan = {
  layout: 'long',
  colonneIndividu: 'territoire',
  colonnesIdentiteSupplementaires: ['operateur'],
  colonneDate: { nom: 'date' },
  colonneValeur: 'valeur',
}

// Colonnes d'identité dans l'ordre inverse des dimensions : les coordonnées restent canoniques.
const planPivot: Plan = {
  layout: 'pivot',
  colonneIndividu: 'operateur',
  colonnesIdentiteSupplementaires: ['territoire'],
  colonnesPivot: [
    { nom: '2025-01', dateIso: '2025-01-01' },
    { nom: '2025-02', dateIso: '2025-02-01' },
  ],
}

const planTerritoireSeul: Plan = {
  layout: 'long',
  colonneIndividu: 'territoire',
  colonneDate: { nom: 'date' },
  colonneValeur: 'valeur',
}

// Mono : Albert propose à tort une seconde colonne, retirée par la commande.
const planMono: Plan = {
  layout: 'long',
  colonneIndividu: 'zone',
  colonnesIdentiteSupplementaires: ['commentaire'],
  colonneDate: { nom: 'date' },
  colonneValeur: 'valeur',
}

const plansParFichier = new Map<string, Plan>([
  ['long.csv', planLong],
  ['pivot.csv', planPivot],
  ['territoire-seul.csv', planTerritoireSeul],
  ['mono.csv', planMono],
])

vi.mocked(decouvrirStructure).mockImplementation(({ nomFichier }) =>
  okAsync(plansParFichier.get(nomFichier)!),
)
vi.mocked(resoudreIndividus).mockImplementation(({ individusValides, libellesSources }) => {
  const mapping = []
  const nonResolus = []
  for (const libelleSource of libellesSources) {
    const candidats = individusValides.filter((individu) => individu.nom === libelleSource)
    if (candidats.length === 1) {
      mapping.push({ libelleSource, individuPublicId: candidats[0]!.publicId })
    } else {
      nonResolus.push({ libelleSource, raison: candidats.length ? 'Ambigu.' : 'Inconnu.' })
    }
  }
  return okAsync({ mapping, nonResolus })
})

// Cube Territoire × Opérateur nommé pour l'import : la commune « Orange » et
// l'opérateur « Orange » coexistent.
const preparerCube = async (options: { fonctionMarginaleOperateur?: FonctionAgregation } = {}) => {
  const ids = await fixtures.cubeTerritoireOperateur({
    ...(options.fonctionMarginaleOperateur
      ? { operateur: { fonctionAgregation: options.fonctionMarginaleOperateur } }
      : {}),
  })
  await fixtures.individu(
    { publicId: ids.deptA, nom: 'Orange' },
    { publicId: ids.deptB, nom: 'Avignon' },
    { publicId: ids.orange, nom: 'Orange' },
    { publicId: ids.sfr, nom: 'SFR' },
  )
  const apiKey = await fixtures.apiKey()
  return { ids, apiKey }
}

describe.concurrent('normaliserValeursImport — multi-dimension', () => {
  it(
    'layout long à deux colonnes d’identité : items à coordonnées canoniques, sans collision « Orange »',
    integrationTest(async () => {
      const { ids, apiKey } = await preparerCube()

      const result = await runAsAdmin(apiKey.id, () =>
        normaliserValeursImport(ids.indicateur, {
          nomFichier: 'long.csv',
          rows: [
            { territoire: 'Orange', operateur: 'SFR', date: '2025-01-01', valeur: '10' },
            { territoire: 'Orange', operateur: 'Orange', date: '2025-01-01', valeur: '11' },
            { territoire: 'Avignon', operateur: 'Orange', date: '2025-01-01', valeur: '12,5' },
          ],
        }),
      )

      const data = result._unsafeUnwrap()
      expect(data.items).toEqual([
        {
          individu: `${ids.deptA}~${ids.sfr}`,
          coordonnees: [ids.deptA, ids.sfr],
          date: '2025-01-01',
          valeur: 10,
        },
        {
          individu: `${ids.deptA}~${ids.orange}`,
          coordonnees: [ids.deptA, ids.orange],
          date: '2025-01-01',
          valeur: 11,
        },
        {
          individu: `${ids.deptB}~${ids.orange}`,
          coordonnees: [ids.deptB, ids.orange],
          date: '2025-01-01',
          valeur: 12.5,
        },
      ])
      expect(data.warnings).toEqual([])
      expect(data.plan).toEqual(planLong)
      expect(data.resolution.colonnesIdentite).toEqual([
        {
          colonne: 'territoire',
          dimension: { id: ids.dimensionTerritoire, nom: expect.any(String) },
        },
        { colonne: 'operateur', dimension: { id: ids.dimensionOperateur, nom: 'Opérateur' } },
      ])
      // Correspondance indexée par (colonne, libellé) : « Orange » vise deux membres.
      expect(data.resolution.mapping).toEqual(
        expect.arrayContaining([
          { colonne: 'territoire', libelleSource: 'Orange', individuPublicId: ids.deptA },
          { colonne: 'operateur', libelleSource: 'Orange', individuPublicId: ids.orange },
        ]),
      )
      expect(data.rapport).toEqual({
        totalLignes: 3,
        totalItemsProduits: 3,
        totalLibellesSources: 4,
        totalLibellesMappes: 4,
        totalLibellesNonResolus: 0,
      })
    }),
  )

  it(
    'layout pivot à deux colonnes d’identité : une valeur par colonne-date, coordonnées dans l’ordre des dimensions',
    integrationTest(async () => {
      const { ids, apiKey } = await preparerCube()

      const result = await runAsAdmin(apiKey.id, () =>
        normaliserValeursImport(ids.indicateur, {
          nomFichier: 'pivot.csv',
          rows: [
            { operateur: 'Orange', territoire: 'Avignon', '2025-01': '1', '2025-02': '2' },
            { operateur: 'SFR', territoire: 'Orange', '2025-01': '3', '2025-02': '' },
          ],
        }),
      )

      const data = result._unsafeUnwrap()
      expect(data.items).toEqual([
        {
          individu: `${ids.deptB}~${ids.orange}`,
          coordonnees: [ids.deptB, ids.orange],
          date: '2025-01-01',
          valeur: 1,
        },
        {
          individu: `${ids.deptB}~${ids.orange}`,
          coordonnees: [ids.deptB, ids.orange],
          date: '2025-02-01',
          valeur: 2,
        },
        {
          individu: `${ids.deptA}~${ids.sfr}`,
          coordonnees: [ids.deptA, ids.sfr],
          date: '2025-01-01',
          valeur: 3,
        },
      ])
      expect(data.warnings).toEqual([])
      expect(data.plan).toEqual(planPivot)
      // Ordre canonique (celui des coordonnées), pas celui du plan.
      expect(data.resolution.colonnesIdentite?.map(({ colonne }) => colonne)).toEqual([
        'territoire',
        'operateur',
      ])
    }),
  )

  it(
    'écarte une ligne partielle (une identité non résolue) avec avertissement',
    integrationTest(async () => {
      const { ids, apiKey } = await preparerCube()

      const result = await runAsAdmin(apiKey.id, () =>
        normaliserValeursImport(ids.indicateur, {
          nomFichier: 'long.csv',
          rows: [
            { territoire: 'Avignon', operateur: 'SFR', date: '2025-01-01', valeur: '1' },
            { territoire: 'Avignon', operateur: 'Bouygues', date: '2025-01-01', valeur: '2' },
            { territoire: 'Orange', operateur: '', date: '2025-01-01', valeur: '3' },
          ],
        }),
      )

      const data = result._unsafeUnwrap()
      expect(data.items).toEqual([
        {
          individu: `${ids.deptB}~${ids.sfr}`,
          coordonnees: [ids.deptB, ids.sfr],
          date: '2025-01-01',
          valeur: 1,
        },
      ])
      expect(data.warnings.map((warning) => [warning.code, warning.ligneSource])).toEqual([
        ['INDIVIDU_NON_RESOLU', 1],
        ['LIGNE_PARTIELLE', 1],
        ['LIGNE_PARTIELLE', 2],
      ])
      expect(data.warnings[0]).toMatchObject({
        libelleSource: 'Bouygues',
        colonneSource: 'operateur',
      })
      expect(data.resolution.nonResolus).toEqual([
        { colonne: 'operateur', libelleSource: 'Bouygues', raison: 'Inconnu.' },
      ])
    }),
  )

  it(
    'signale une dimension à marginale agrégée qu’aucune colonne ne couvre',
    integrationTest(async () => {
      const { ids, apiKey } = await preparerCube()

      const result = await runAsAdmin(apiKey.id, () =>
        normaliserValeursImport(ids.indicateur, {
          nomFichier: 'territoire-seul.csv',
          rows: [{ territoire: 'Avignon', date: '2025-01-01', valeur: '1' }],
        }),
      )

      const data = result._unsafeUnwrap()
      expect(data.items).toEqual([{ individu: ids.deptB, date: '2025-01-01', valeur: 1 }])
      expect(data.warnings).toEqual([
        expect.objectContaining({
          code: 'DIMENSIONS_NON_COUVERTES',
          message: expect.stringContaining('« Opérateur »'),
        }),
      ])
    }),
  )

  it(
    'n’exige pas de colonne pour une dimension à marginale NONE',
    integrationTest(async () => {
      const { ids, apiKey } = await preparerCube({
        fonctionMarginaleOperateur: FonctionAgregation.NONE,
      })

      const result = await runAsAdmin(apiKey.id, () =>
        normaliserValeursImport(ids.indicateur, {
          nomFichier: 'territoire-seul.csv',
          rows: [{ territoire: 'Avignon', date: '2025-01-01', valeur: '1' }],
        }),
      )

      const data = result._unsafeUnwrap()
      expect(data.items).toEqual([{ individu: ids.deptB, date: '2025-01-01', valeur: 1 }])
      expect(data.warnings).toEqual([])
    }),
  )
})

describe.concurrent('normaliserValeursImport — mono-dimension', () => {
  it(
    'sortie historique : pas de coordonnées, pas de colonne dans la résolution, plan sans colonne supplémentaire',
    integrationTest(async () => {
      const indicateur = testIndicateurId()
      const referentiel = testReferentielId()
      const [ain, aisne] = [testIndividuId().toUpperCase(), testIndividuId().toUpperCase()]
      await fixtures.individu(
        { publicId: ain, nom: 'Ain', referentiel: { publicId: referentiel } },
        { publicId: aisne, nom: 'Aisne', referentiel: { publicId: referentiel } },
      )
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indicateur },
        referentiel: { publicId: referentiel },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsAdmin(apiKey.id, () =>
        normaliserValeursImport(indicateur, {
          nomFichier: 'mono.csv',
          rows: [
            { zone: 'Ain', commentaire: 'x', date: '2025-01-01', valeur: '1' },
            { zone: 'Aisne', commentaire: 'y', date: '2025-01-01', valeur: '2' },
          ],
        }),
      )

      const data = result._unsafeUnwrap()
      expect(data.plan).toStrictEqual({
        layout: 'long',
        colonneIndividu: 'zone',
        colonneDate: { nom: 'date' },
        colonneValeur: 'valeur',
      })
      expect(data.items).toStrictEqual([
        { individu: ain, date: '2025-01-01', valeur: 1 },
        { individu: aisne, date: '2025-01-01', valeur: 2 },
      ])
      expect(data.resolution).toStrictEqual({
        mapping: [
          { libelleSource: 'Ain', individuPublicId: ain },
          { libelleSource: 'Aisne', individuPublicId: aisne },
        ],
        nonResolus: [],
      })
      expect(data.warnings).toEqual([])
    }),
  )
})

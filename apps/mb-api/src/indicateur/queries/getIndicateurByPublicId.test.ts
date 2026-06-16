import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import { getIndicateurByPublicId } from '@/indicateur/queries/getIndicateurByPublicId'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testReferentielId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('getIndicateurByPublicId', () => {
  it(
    "retourne l'indicateur avec ses référentiels liés triés par publicId",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refDetailA = testReferentielId()
      const refDetailB = testReferentielId()
      const indicateur = await fixtures.indicateur({ publicId: indId, nom: 'Indicateur de test' })
      const [ref1, ref2] = await fixtures.referentiel(
        { publicId: refDetailB },
        { publicId: refDetailA },
      )
      await db().indicateurReferentiel.createMany({
        data: [
          { indicateurId: indicateur.id, referentielId: ref1!.id, fonctionAgregation: 'SUM' },
          { indicateurId: indicateur.id, referentielId: ref2!.id, fonctionAgregation: 'SUM' },
        ],
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => getIndicateurByPublicId(indId))

      const referentielsTries = [
        {
          referentielPublicId: refDetailA,
          referentielNom: 'Référentiel de test',
          fonctionAgregation: 'SUM' as const,
        },
        {
          referentielPublicId: refDetailB,
          referentielNom: 'Référentiel de test',
          fonctionAgregation: 'SUM' as const,
        },
      ].sort((a, b) => a.referentielPublicId.localeCompare(b.referentielPublicId))

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({
        id: indId,
        nom: 'Indicateur de test',
        visibilite: 'PRIVE',
        unite: null,
        description: null,
        methodeCalcul: null,
        sourceDonnees: null,
        sourceUrl: null,
        periodeMiseAJour: null,
        jourMiseAJour: null,
        referentiels: referentielsTries,
        createdAt: indicateur.createdAt.toISOString(),
        updatedAt: indicateur.updatedAt.toISOString(),
      })
    }),
  )

  it(
    "sérialise l'unité enrichie (code + libellé + abréviation) quand renseignée",
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.indicateur({ publicId: indId, unite: 'POURCENTAGE' })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => getIndicateurByPublicId(indId))

      expect(result._unsafeUnwrap().unite).toEqual({
        code: 'POURCENTAGE',
        libelle: 'Pourcentage',
        abbreviation: '%',
      })
    }),
  )

  it(
    'expose les métadonnées (description, méthode, sources, période/jour) quand renseignées',
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.indicateur({
        publicId: indId,
        description: 'Description longue de l’indicateur',
        methodeCalcul: 'Somme pondérée',
        sourceDonnees: 'INSEE',
        sourceUrl: 'https://www.insee.fr/source',
        periodeMiseAJour: 'TRIMESTRIELLE',
        jourMiseAJour: 15,
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => getIndicateurByPublicId(indId))

      const indicateur = result._unsafeUnwrap()
      expect(indicateur.description).toBe('Description longue de l’indicateur')
      expect(indicateur.methodeCalcul).toBe('Somme pondérée')
      expect(indicateur.sourceDonnees).toBe('INSEE')
      expect(indicateur.sourceUrl).toBe('https://www.insee.fr/source')
      expect(indicateur.periodeMiseAJour).toBe('TRIMESTRIELLE')
      expect(indicateur.jourMiseAJour).toBe(15)
    }),
  )

  it(
    'expose le nom du référentiel dans les configurations',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refNomId = testReferentielId()
      const indicateur = await fixtures.indicateur({ publicId: indId })
      const referentiel = await fixtures.referentiel({
        publicId: refNomId,
        nom: 'Périmètre national',
      })
      await db().indicateurReferentiel.create({
        data: {
          indicateurId: indicateur.id,
          referentielId: referentiel.id,
          fonctionAgregation: 'SUM',
        },
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => getIndicateurByPublicId(indId))

      expect(result._unsafeUnwrap().referentiels).toEqual([
        {
          referentielPublicId: refNomId,
          referentielNom: 'Périmètre national',
          fonctionAgregation: 'SUM',
        },
      ])
    }),
  )

  it(
    "retourne un indicateur PUBLIC même quand le principal n'a aucune permission",
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.indicateur({ publicId: indId, visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getIndicateurByPublicId(indId))

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap().visibilite).toBe('PUBLIC')
    }),
  )

  it(
    "retourne l'indicateur quand le principal a la permission WRITE (WRITE implique READ)",
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.indicateur({ publicId: indId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => getIndicateurByPublicId(indId))

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap().referentiels).toEqual([])
    }),
  )

  it(
    "lève une erreur quand le principal n'a aucune permission sur l'indicateur",
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.indicateur({ publicId: indId })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () => getIndicateurByPublicId(indId)),
      ).rejects.toThrow()
    }),
  )

  it(
    'lève une erreur quand aucun indicateur ne correspond',
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()
      await expect(
        runAsPrincipal(apiKey.id, () => getIndicateurByPublicId(testIndicateurId())),
      ).rejects.toThrow()
    }),
  )
})

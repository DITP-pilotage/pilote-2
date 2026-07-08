import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import { getIndicateurByPublicId } from '@/indicateur/queries/getIndicateurByPublicId'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId, testPanierId, testReferentielId } from '@/test/randomIds'
import { runAsAdmin, runAsPrincipal } from '@/test/runAsPrincipal'

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
          id: refDetailA,
          nom: 'Référentiel de test',
          fonctionAgregation: 'SUM' as const,
        },
        {
          id: refDetailB,
          nom: 'Référentiel de test',
          fonctionAgregation: 'SUM' as const,
        },
      ].sort((a, b) => a.id.localeCompare(b.id))

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
        delaiMiseADisposition: null,
        referentiels: referentielsTries,
        responsables: [],
        dateDerniereValeur: null,
        dateProchaineValeur: null,
        dateMiseADisposition: null,
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
    'calcule les dates dérivées (dernière valeur, prochaine valeur, mise à disposition)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.valeurAvancement(
        {
          indicateur: {
            publicId: indId,
            periodeMiseAJour: 'ANNUELLE',
            delaiMiseADispositionNombre: 6,
            delaiMiseADispositionUnite: 'MOIS',
          },
          individu: {},
          date: '2022-12-01',
          valeur: 5,
        },
        {
          indicateur: { publicId: indId },
          individu: {},
          date: '2023-12-01',
          valeur: 10,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => getIndicateurByPublicId(indId))
      const indicateur = result._unsafeUnwrap()

      expect(indicateur.delaiMiseADisposition).toEqual({ nombre: 6, unite: 'MOIS' })
      expect(indicateur.dateDerniereValeur).toBe('2023-12-01')
      expect(indicateur.dateProchaineValeur).toBe('2024-12-01')
      expect(indicateur.dateMiseADisposition).toBe('2025-06-01')
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
          id: refNomId,
          nom: 'Périmètre national',
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
    'retourne un indicateur PRIVÉ pour un principal ADMIN sans permission explicite (cohérent avec la liste)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.indicateur({ publicId: indId, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsAdmin(apiKey.id, () => getIndicateurByPublicId(indId))

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap().visibilite).toBe('PRIVE')
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

  it(
    "retourne tous les champs d'un responsable de l'indicateur",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const liaison = await fixtures.indicateurResponsable({
        indicateur: { publicId: indId, visibilite: 'PUBLIC' },
        utilisateur: {
          email: `resp-${indId}@example.com`,
          nom: 'Martin',
          prenom: 'Alice',
          service: 'DITP',
          fonction: 'Chargée de mission',
        },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getIndicateurByPublicId(indId))

      expect(result._unsafeUnwrap().responsables).toEqual([
        {
          id: liaison.utilisateurId,
          email: `resp-${indId}@example.com`,
          nom: 'Martin',
          prenom: 'Alice',
          service: 'DITP',
          fonction: 'Chargée de mission',
        },
      ])
    }),
  )

  it(
    'retourne les responsables dans le bon ordre (createdAt ASC) quand plusieurs sont assignés',
    integrationTest(async () => {
      const indOrd = testIndicateurId()
      // Insertions séquentielles pour garantir des createdAt distincts.
      await fixtures.indicateurResponsable({
        indicateur: { publicId: indOrd, visibilite: 'PUBLIC' },
        utilisateur: { email: `aa-ord-${indOrd}@example.com` },
      })
      await fixtures.indicateurResponsable({
        indicateur: { publicId: indOrd },
        utilisateur: { email: `bb-ord-${indOrd}@example.com` },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getIndicateurByPublicId(indOrd))
      const emails = result._unsafeUnwrap().responsables.map((r) => r.email)

      expect(emails).toEqual([`aa-ord-${indOrd}@example.com`, `bb-ord-${indOrd}@example.com`])
    }),
  )

  it(
    'expose les responsables via une permission READ propagée par un panier',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const panId = testPanierId()
      await fixtures.indicateurResponsable({
        indicateur: { publicId: indId, visibilite: 'PRIVE' },
        utilisateur: { email: `resp2-${indId}@example.com` },
      })
      await fixtures.panier({ publicId: panId, indicateurs: [{ publicId: indId }] })
      const apiKey = await fixtures.apiKey({
        panierPermissions: [{ panier: { publicId: panId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => getIndicateurByPublicId(indId))

      expect(result._unsafeUnwrap().responsables).toHaveLength(1)
    }),
  )
})

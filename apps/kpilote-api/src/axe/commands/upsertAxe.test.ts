import { describe, expect, it } from 'vitest'

import { upsertAxe } from '@/axe/commands/upsertAxe'
import { db } from '@/framework/persistence/dbStore'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testAxeId, testIndicateurId, testIndicateurIds } from '@/test/randomIds'
import { runAsAdmin, runAsContributor, runAsUser } from '@/test/runAsPrincipal'

const niveauxDe = async (publicId: string) => {
  const niveaux = await db().niveauAxe.findMany({
    where: { axe: { publicId } },
    orderBy: { ordre: 'asc' },
  })
  return niveaux.map(({ ordre, nom }) => ({ ordre, nom }))
}

describe.concurrent('upsertAxe', () => {
  it(
    'crée l’axe et ses niveaux, ordonnés par position à partir de 1',
    integrationTest(async () => {
      const publicId = testAxeId()

      const result = await runAsAdmin('principal-upsert-axe-creation', () =>
        upsertAxe({
          publicId,
          body: {
            nom: 'Type de fraude',
            description: 'Familles et types',
            niveaux: [{ nom: 'Famille' }, { nom: 'Type' }],
          },
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(await db().axe.findUnique({ where: { publicId } })).toMatchObject({
        nom: 'Type de fraude',
        description: 'Familles et types',
      })
      expect(await niveauxDe(publicId)).toEqual([
        { ordre: 1, nom: 'Famille' },
        { ordre: 2, nom: 'Type' },
      ])
    }),
  )

  it(
    'met à jour le nom et la description d’un axe existant',
    integrationTest(async () => {
      const axe = await fixtures.axe({ nom: 'Ancien nom', description: 'Ancienne description' })

      await runAsAdmin('principal-upsert-axe-maj', () =>
        upsertAxe({
          publicId: axe.publicId,
          body: { nom: 'Nouveau nom', description: null, niveaux: [{ nom: 'Opérateur' }] },
        }),
      )

      expect(await db().axe.findUnique({ where: { publicId: axe.publicId } })).toMatchObject({
        id: axe.id,
        nom: 'Nouveau nom',
        description: null,
      })
    }),
  )

  it(
    'renomme les niveaux par position et ajoute les nouveaux',
    integrationTest(async () => {
      const axe = { publicId: testAxeId() }
      const niveauOperateur = await fixtures.niveauAxe({ axe, ordre: 1, nom: 'Opérateur' })

      await runAsAdmin('principal-upsert-axe-renommage', () =>
        upsertAxe({
          publicId: axe.publicId,
          body: {
            nom: 'Opérateur',
            description: null,
            niveaux: [{ nom: 'Groupe' }, { nom: 'Opérateur' }],
          },
        }),
      )

      expect(await niveauxDe(axe.publicId)).toEqual([
        { ordre: 1, nom: 'Groupe' },
        { ordre: 2, nom: 'Opérateur' },
      ])
      // Le niveau d'ordre 1 est renommé, pas recréé.
      expect(await db().niveauAxe.findUnique({ where: { id: niveauOperateur.id } })).toMatchObject({
        nom: 'Groupe',
      })
    }),
  )

  it(
    'supprime les derniers niveaux quand ils ne portent pas de modalités',
    integrationTest(async () => {
      const axe = { publicId: testAxeId() }
      await fixtures.niveauAxe({ axe, ordre: 1, nom: 'Famille' }, { axe, ordre: 2, nom: 'Type' })

      const result = await runAsAdmin('principal-upsert-axe-raccourci', () =>
        upsertAxe({
          publicId: axe.publicId,
          body: { nom: 'Fraude', description: null, niveaux: [{ nom: 'Famille' }] },
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(await niveauxDe(axe.publicId)).toEqual([{ ordre: 1, nom: 'Famille' }])
    }),
  )

  it(
    'refuse de supprimer des niveaux qui portent des modalités, sans rien modifier',
    integrationTest(async () => {
      const axe = { publicId: testAxeId(), nom: 'Type de fraude' }
      await fixtures.niveauAxe(
        { axe, ordre: 1, nom: 'Famille' },
        { axe, ordre: 2, nom: 'Type' },
        { axe, ordre: 3, nom: 'Sous-type' },
      )
      await fixtures.modalite({ niveau: { axe, ordre: 3 } })

      const result = await runAsAdmin('principal-upsert-axe-porteur', () =>
        upsertAxe({
          publicId: axe.publicId,
          body: { nom: 'Renommé', description: null, niveaux: [{ nom: 'Famille' }] },
        }),
      )

      expect(result._unsafeUnwrapErr()).toEqual({ type: 'NIVEAU_PORTE_MODALITES', ordres: [3] })
      expect(await db().axe.findUnique({ where: { publicId: axe.publicId } })).toMatchObject({
        nom: 'Type de fraude',
      })
      expect(await niveauxDe(axe.publicId)).toEqual([
        { ordre: 1, nom: 'Famille' },
        { ordre: 2, nom: 'Type' },
        { ordre: 3, nom: 'Sous-type' },
      ])
    }),
  )

  it(
    'refuse de changer le nombre de niveaux d’un axe déclaré par des indicateurs, sans rien modifier',
    integrationTest(async () => {
      const axe = { publicId: testAxeId(), nom: 'Opérateur' }
      const [premier, second] = testIndicateurIds(2)
      await fixtures.niveauAxe({ axe, ordre: 1, nom: 'Opérateur' })
      await fixtures.indicateurAxe(
        { indicateur: { publicId: second }, axe },
        { indicateur: { publicId: premier }, axe },
      )

      const result = await runAsAdmin('principal-upsert-axe-utilise', () =>
        upsertAxe({
          publicId: axe.publicId,
          body: {
            nom: 'Renommé',
            description: null,
            niveaux: [{ nom: 'Groupe' }, { nom: 'Opérateur' }],
          },
        }),
      )

      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'AXE_UTILISE',
        indicateurs: [premier, second],
      })
      expect(await db().axe.findUnique({ where: { publicId: axe.publicId } })).toMatchObject({
        nom: 'Opérateur',
      })
      expect(await niveauxDe(axe.publicId)).toEqual([{ ordre: 1, nom: 'Opérateur' }])
    }),
  )

  it(
    'renomme les niveaux d’un axe déclaré par un indicateur',
    integrationTest(async () => {
      const axe = { publicId: testAxeId() }
      await fixtures.niveauAxe({ axe, ordre: 1, nom: 'Opérateur' })
      await fixtures.indicateurAxe({ indicateur: { publicId: testIndicateurId() }, axe })

      const result = await runAsAdmin('principal-upsert-axe-utilise-renommage', () =>
        upsertAxe({
          publicId: axe.publicId,
          body: { nom: 'Opérateurs', description: null, niveaux: [{ nom: 'Marque' }] },
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(await niveauxDe(axe.publicId)).toEqual([{ ordre: 1, nom: 'Marque' }])
    }),
  )

  it(
    'refuse une clé API qui n’est pas ADMIN',
    integrationTest(async () => {
      await expect(
        runAsContributor('principal-upsert-axe-contributor', () =>
          upsertAxe({
            publicId: testAxeId(),
            body: { nom: 'Opérateur', description: null, niveaux: [{ nom: 'Opérateur' }] },
          }),
        ),
      ).rejects.toThrow('Cette opération requiert une clé API de rôle ADMIN')
    }),
  )

  it(
    'refuse un utilisateur OIDC',
    integrationTest(async () => {
      await expect(
        runAsUser('utilisateur-upsert-axe-oidc', () =>
          upsertAxe({
            publicId: testAxeId(),
            body: { nom: 'Opérateur', description: null, niveaux: [{ nom: 'Opérateur' }] },
          }),
        ),
      ).rejects.toThrow('Cette opération requiert une clé API de rôle ADMIN')
    }),
  )
})

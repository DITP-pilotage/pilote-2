import { describe, expect, it } from 'vitest'

import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { ProviderType } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'
import { updateUtilisateur } from '@/utilisateur/commands/updateUtilisateur'

const ADMIN_ID = '00000000-0000-0000-0000-000000000301'

describe.concurrent('updateUtilisateur', () => {
  it(
    "met à jour les 4 champs éditables (nom, prénom, service, fonction) sans casser l'email",
    integrationTest(async () => {
      const u = await fixtures.utilisateur({
        email: 'edit-me@example.gouv.fr',
        nom: 'AvantNom',
        prenom: 'AvantPrenom',
        service: 'AvantService',
        fonction: 'AvantFonction',
      })
      const result = await runAsAdmin(ADMIN_ID, () =>
        updateUtilisateur(u.id, {
          nom: 'ApresNom',
          prenom: 'ApresPrenom',
          service: 'ApresService',
          fonction: 'ApresFonction',
        }),
      )
      const updated = result._unsafeUnwrap()
      expect(updated.nom).toBe('ApresNom')
      expect(updated.prenom).toBe('ApresPrenom')
      expect(updated.service).toBe('ApresService')
      expect(updated.fonction).toBe('ApresFonction')
      expect(updated.email).toBe('edit-me@example.gouv.fr')

      const row = await db().utilisateur.findUniqueOrThrow({ where: { id: u.id } })
      expect(row.email).toBe('edit-me@example.gouv.fr')
    }),
  )

  it(
    "préserve les identités externes lors d'un update",
    integrationTest(async () => {
      const u = await fixtures.utilisateur({
        email: 'linked@example.gouv.fr',
        identite: { provider: ProviderType.keycloak, providerSub: 'sub-linked-kc' },
      })
      const result = await runAsAdmin(ADMIN_ID, () =>
        updateUtilisateur(u.id, {
          nom: 'Nouveau',
          prenom: 'Prenom',
          service: 'Service',
          fonction: 'Fonction',
        }),
      )
      const updated = result._unsafeUnwrap()
      expect(updated.status).toBe('actif')
      expect(updated.providers).toEqual(['keycloak'])
    }),
  )

  it(
    'rejette une clé CONTRIBUTOR (ForbiddenError)',
    integrationTest(async () => {
      const u = await fixtures.utilisateur({ email: 'forbidden-edit@example.gouv.fr' })
      await expect(
        runAsContributor(ADMIN_ID, () =>
          updateUtilisateur(u.id, {
            nom: 'N',
            prenom: 'P',
            service: 'S',
            fonction: 'F',
          }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )

  it(
    'rejette un id inconnu',
    integrationTest(async () => {
      await expect(
        runAsAdmin(ADMIN_ID, () =>
          updateUtilisateur('00000000-0000-0000-0000-0000000003ff', {
            nom: 'N',
            prenom: 'P',
            service: 'S',
            fonction: 'F',
          }),
        ),
      ).rejects.toThrow()
    }),
  )
})

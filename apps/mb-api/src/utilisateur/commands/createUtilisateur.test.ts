import { describe, expect, it } from 'vitest'

import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor, runAsUser } from '@/test/runAsPrincipal'
import { createUtilisateur } from '@/utilisateur/commands/createUtilisateur'

const ADMIN_ID = '00000000-0000-0000-0000-000000000101'

describe.concurrent('createUtilisateur', () => {
  it(
    'crée un utilisateur en attente (status=en_attente, providers=[])',
    integrationTest(async () => {
      const result = await runAsAdmin(ADMIN_ID, () =>
        createUtilisateur({
          email: 'agent.a@example.gouv.fr',
          nom: 'Aaa',
          prenom: 'Aline',
          service: 'DITP',
          fonction: 'Chargée de mission',
        }),
      )
      const created = result._unsafeUnwrap()
      expect(created.status).toBe('en_attente')
      expect(created.providers).toEqual([])
      expect(created.email).toBe('agent.a@example.gouv.fr')

      const row = await db().utilisateur.findUniqueOrThrow({ where: { id: created.id } })
      expect(row.nom).toBe('Aaa')
      const principal = await db().principal.findUniqueOrThrow({ where: { id: created.id } })
      expect(principal.id).toBe(created.id)
    }),
  )

  it(
    'rejette une clé CONTRIBUTOR (ForbiddenError)',
    integrationTest(async () => {
      await expect(
        runAsContributor(ADMIN_ID, () =>
          createUtilisateur({
            email: 'agent.b@example.gouv.fr',
            nom: 'Bbb',
            prenom: 'Ben',
            service: 'DITP',
            fonction: 'Chef',
          }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )

  it(
    'rejette un utilisateur OIDC (ForbiddenError)',
    integrationTest(async () => {
      await expect(
        runAsUser('00000000-0000-0000-0000-000000000102', () =>
          createUtilisateur({
            email: 'agent.c@example.gouv.fr',
            nom: 'Ccc',
            prenom: 'Cléa',
            service: 'DITP',
            fonction: 'Agent',
          }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )

  it(
    "throw PrismaClientKnownRequestError P2002 quand l'email est déjà utilisé",
    integrationTest(async () => {
      await fixtures.utilisateur({ email: 'existant@example.gouv.fr' })
      await expect(
        runAsAdmin(ADMIN_ID, () =>
          createUtilisateur({
            email: 'existant@example.gouv.fr',
            nom: 'Ddd',
            prenom: 'Dora',
            service: 'DITP',
            fonction: 'Agent',
          }),
        ),
      ).rejects.toMatchObject({
        constructor: Prisma.PrismaClientKnownRequestError,
        code: 'P2002',
      })
    }),
  )
})

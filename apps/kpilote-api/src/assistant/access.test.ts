import { describe, expect, it } from 'vitest'

import { checkAssistantAccess } from '@/assistant/access'
import { type Principal } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { ApiKeyRole } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

const asPrincipal = (utilisateur: { id: string; email: string }): Principal => ({
  kind: 'user',
  user: { id: utilisateur.id, email: utilisateur.email, prenom: 'A', nom: 'B' },
})

const setActif = (actif: boolean) =>
  db().assistantParametres.update({ where: { id: 1 }, data: { actif } })

describe('checkAssistantAccess', { concurrent: false }, () => {
  it(
    'ouvre l’assistant à un utilisateur autorisé quand il est actif',
    integrationTest(async () => {
      const utilisateur = await fixtures.assistantUtilisateur()

      expect(await checkAssistantAccess(asPrincipal(utilisateur))).toBe(true)
    }),
  )

  it(
    'le refuse à tous quand il est coupé',
    integrationTest(async () => {
      const utilisateur = await fixtures.assistantUtilisateur()
      await setActif(false)

      expect(await checkAssistantAccess(asPrincipal(utilisateur))).toBe(false)
    }),
  )

  it(
    'le refuse à un utilisateur qui n’est pas dans la liste',
    integrationTest(async () => {
      await fixtures.assistantUtilisateur()
      const autre = await fixtures.utilisateur()

      expect(await checkAssistantAccess(asPrincipal(autre))).toBe(false)
    }),
  )

  it(
    'le refuse aux clés API',
    integrationTest(async () => {
      await setActif(true)

      expect(
        await checkAssistantAccess({
          kind: 'apiKey',
          apiKey: { id: 'k', label: 'cle', role: ApiKeyRole.ADMIN },
        }),
      ).toBe(false)
    }),
  )

  it(
    'le refuse sans paramètres en base',
    integrationTest(async () => {
      const utilisateur = await fixtures.assistantUtilisateur()
      await db().assistantParametres.deleteMany()

      expect(await checkAssistantAccess(asPrincipal(utilisateur))).toBe(false)
    }),
  )

  it(
    'oublie l’autorisation d’un utilisateur supprimé',
    integrationTest(async () => {
      const utilisateur = await fixtures.assistantUtilisateur()
      await db().principal.delete({ where: { id: utilisateur.id } })

      expect(
        await db().assistantAccesUtilisateur.count({ where: { utilisateurId: utilisateur.id } }),
      ).toBe(0)
    }),
  )
})

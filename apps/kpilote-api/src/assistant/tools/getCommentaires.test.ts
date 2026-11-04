import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { getCommentaires } from '@/assistant/tools/getCommentaires'
import { Visibilite } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runToolAs } from '@/test/toolHarness'

const givenIndicateurIndividu = async (visibilite: Visibilite) => {
  const marqueur = randomUUID().slice(0, 8)
  const indicateur = await fixtures.indicateur({ nom: `Indicateur ${marqueur}`, visibilite })
  const { id, publicId } = await fixtures.individu({ nom: `Individu ${marqueur}` })
  return {
    indicateur: { id: indicateur.id, publicId: indicateur.publicId },
    individu: { id, publicId },
  }
}

describe('get_commentaires', () => {
  it(
    'regroupe par type, en texte, sans les versions identiques',
    integrationTest(async () => {
      const { indicateur, individu } = await givenIndicateurIndividu(Visibilite.PUBLIC)
      const auteur = (await fixtures.utilisateur()).id
      await fixtures.commentaire({
        indicateur,
        individu,
        createdBy: auteur,
        contenu: '<p>Retard pris</p>',
      })
      await fixtures.commentaire({
        indicateur,
        individu,
        createdBy: auteur,
        contenu: '<p>Retard  pris</p>',
      })
      await fixtures.commentaire({
        indicateur,
        individu,
        createdBy: auteur,
        type: 'CONFIANCE',
        contenu: '<p>Données fiables</p>',
      })

      const output = await runToolAs(randomUUID(), 'get_commentaires', getCommentaires, {
        cible: 'INDICATEUR',
        indicateurId: indicateur.publicId,
        individuId: individu.publicId,
      })

      expect(output).toEqual({
        groupes: [
          {
            type: 'Commentaire',
            versions: [expect.objectContaining({ texte: 'Retard pris' })],
            truncated: false,
          },
          {
            type: 'Niveau de confiance',
            versions: [expect.objectContaining({ texte: 'Données fiables' })],
            truncated: false,
          },
        ],
        notFound: [],
      })
    }),
  )

  it(
    'rend notFound pour un indicateur que le principal ne peut pas lire',
    integrationTest(async () => {
      const { indicateur, individu } = await givenIndicateurIndividu(Visibilite.PRIVE)

      const output = await runToolAs(randomUUID(), 'get_commentaires', getCommentaires, {
        cible: 'INDICATEUR',
        indicateurId: indicateur.publicId,
        individuId: individu.publicId,
      })

      expect(output).toEqual({ groupes: [], notFound: [indicateur.publicId] })
    }),
  )
})

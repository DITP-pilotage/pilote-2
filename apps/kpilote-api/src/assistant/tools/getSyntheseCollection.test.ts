import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { getSyntheseCollection } from '@/assistant/tools/getSyntheseCollection'
import { Visibilite } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runToolAs } from '@/test/toolHarness'

const token = () => randomUUID().slice(0, 8)

const givenCollection = async (visibilite: Visibilite) => {
  const marqueur = token()
  const indicateur = await fixtures.indicateur({
    nom: `Indicateur ${marqueur}`,
    visibilite: Visibilite.PUBLIC,
  })
  const collection = await fixtures.collection({
    nom: `Collection ${marqueur}`,
    visibilite,
    indicateurs: [{ id: indicateur.id, publicId: indicateur.publicId }],
  })
  const { id, publicId } = await fixtures.individu({ nom: `Individu ${marqueur}` })
  return { indicateur, collection, individu: { id, publicId }, marqueur }
}

describe('get_synthese_collection', () => {
  it(
    'rend la collection, l’individu et la contribution nommée de chaque indicateur',
    integrationTest(async () => {
      const { indicateur, collection, individu, marqueur } = await givenCollection(
        Visibilite.PUBLIC,
      )

      const output = await runToolAs(
        randomUUID(),
        'get_synthese_collection',
        getSyntheseCollection,
        {
          collectionId: collection.publicId,
          individuId: individu.publicId,
        },
      )

      expect(output).toEqual(
        expect.objectContaining({
          collection: expect.objectContaining({
            id: collection.publicId,
            nom: `Collection ${marqueur}`,
          }),
          individu: { id: individu.publicId, nom: `Individu ${marqueur}` },
          contributions: [
            expect.objectContaining({
              indicateur: { id: indicateur.publicId, nom: `Indicateur ${marqueur}` },
            }),
          ],
          notFound: [],
        }),
      )
    }),
  )

  it(
    'rend notFound pour une collection que le principal ne peut pas lire',
    integrationTest(async () => {
      const { collection, individu } = await givenCollection(Visibilite.PRIVE)

      const output = await runToolAs(
        randomUUID(),
        'get_synthese_collection',
        getSyntheseCollection,
        {
          collectionId: collection.publicId,
          individuId: individu.publicId,
        },
      )

      expect(output).toEqual(
        expect.objectContaining({ collection: null, notFound: [collection.publicId] }),
      )
    }),
  )
})

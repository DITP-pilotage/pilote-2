import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import {
  findCollectionNames,
  findIndicateurNames,
  findIndividuNames,
} from '@/assistant/tools/search/nameQueries'
import { Visibilite } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsUser } from '@/test/runAsPrincipal'

const token = () => randomUUID().slice(0, 8)

describe('requêtes légères de noms', () => {
  it(
    'ne renvoie que les indicateurs lisibles par le principal',
    integrationTest(async () => {
      const marqueur = token()
      await fixtures.indicateur(
        { nom: `Public ${marqueur}`, visibilite: Visibilite.PUBLIC },
        { nom: `Prive ${marqueur}`, visibilite: Visibilite.PRIVE },
      )

      const found = await runAsUser(randomUUID(), () =>
        findIndicateurNames({ term: marqueur, limit: 10 }),
      )

      expect(found.items.map((item) => item.nom)).toEqual([`Public ${marqueur}`])
    }),
  )

  it(
    'compte le total au-delà de la limite',
    integrationTest(async () => {
      const marqueur = token()
      await fixtures.indicateur(
        { nom: `A ${marqueur}`, visibilite: Visibilite.PUBLIC },
        { nom: `B ${marqueur}`, visibilite: Visibilite.PUBLIC },
        { nom: `C ${marqueur}`, visibilite: Visibilite.PUBLIC },
      )

      const found = await runAsUser(randomUUID(), () =>
        findIndicateurNames({ term: marqueur, limit: 2 }),
      )

      expect(found.items).toHaveLength(2)
      expect(found.total).toBe(3)
    }),
  )

  it(
    'ne renvoie que les collections lisibles par le principal',
    integrationTest(async () => {
      const marqueur = token()
      await fixtures.collection({ nom: `Publique ${marqueur}`, visibilite: Visibilite.PUBLIC })
      await fixtures.collection({ nom: `Privee ${marqueur}`, visibilite: Visibilite.PRIVE })

      const found = await runAsUser(randomUUID(), () =>
        findCollectionNames({ term: marqueur, limit: 10 }),
      )

      expect(found.items.map((item) => item.nom)).toEqual([`Publique ${marqueur}`])
    }),
  )

  it(
    'filtre les individus par référentiel et donne le nom du référentiel',
    integrationTest(async () => {
      const marqueur = token()
      const academies = await fixtures.referentiel({ nom: `Académies ${marqueur}` })
      const bassins = await fixtures.referentiel({ nom: `Bassins ${marqueur}` })
      await fixtures.individu(
        { nom: `Nord ${marqueur}`, referentiel: academies },
        { nom: `Nord ${marqueur}`, referentiel: bassins },
      )

      const found = await runAsUser(randomUUID(), () =>
        findIndividuNames({ term: marqueur, referentielId: bassins.publicId, limit: 10 }),
      )

      expect(found.items).toEqual([
        expect.objectContaining({
          nom: `Nord ${marqueur}`,
          referentiel: { id: bassins.publicId, nom: `Bassins ${marqueur}` },
        }),
      ])
    }),
  )
})

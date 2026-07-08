import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import { encodeCursor } from '@/framework/persistence/paginate'
import { listIndicateurs } from '@/indicateur/queries/listIndicateurs'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurIds, testDossierId, testReferentielId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('listIndicateurs', () => {
  it(
    "retourne une liste vide quand aucun indicateur n'existe",
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()
      const result = await runAsPrincipal(apiKey.id, () => listIndicateurs({}))

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({
        items: [],
        pagination: { cursor: null, hasMore: false },
        total: 0,
      })
    }),
  )

  it(
    "n'inclut que les indicateurs sur lesquels le principal a une permission",
    integrationTest(async () => {
      const [accessible, hidden] = testIndicateurIds(2)
      await fixtures.indicateur({ publicId: accessible }, { publicId: hidden })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: accessible }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => listIndicateurs({}))

      const value = result._unsafeUnwrap()
      expect(value.items.map((i) => i.id)).toEqual([accessible])
      expect(value.total).toBe(1)
    }),
  )

  it(
    "inclut les indicateurs PUBLIC sur lesquels le principal n'a aucune permission",
    integrationTest(async () => {
      const [pub, priv] = testIndicateurIds(2)
      await fixtures.indicateur(
        { publicId: pub, visibilite: 'PUBLIC' },
        { publicId: priv, visibilite: 'PRIVE' },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => listIndicateurs({}))

      const value = result._unsafeUnwrap()
      expect(value.items.map((i) => i.id)).toEqual([pub])
      expect(value.items.map((i) => i.visibilite)).toEqual(['PUBLIC'])
    }),
  )

  it(
    'propage READ via les permissions dossier : un principal qui a accès à un dossier voit ses indicateurs PRIVE',
    integrationTest(async () => {
      const [viaDossier, hidden] = testIndicateurIds(2)
      const dosPropag = testDossierId()
      await fixtures.indicateur(
        { publicId: viaDossier, visibilite: 'PRIVE' },
        { publicId: hidden, visibilite: 'PRIVE' },
      )
      await fixtures.dossier({
        publicId: dosPropag,
        visibilite: 'PRIVE',
        indicateurs: [{ publicId: viaDossier }],
      })
      const apiKey = await fixtures.apiKey({
        dossierPermissions: [{ dossier: { publicId: dosPropag }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => listIndicateurs({}))

      const value = result._unsafeUnwrap()
      expect(value.items.map((i) => i.id)).toEqual([viaDossier])
      expect(value.total).toBe(1)
    }),
  )

  it(
    'la propagation dossier → indicateur fonctionne aussi avec WRITE sur le dossier',
    integrationTest(async () => {
      const [viaDossier] = testIndicateurIds(1)
      const dosPropag = testDossierId()
      await fixtures.indicateur({ publicId: viaDossier, visibilite: 'PRIVE' })
      await fixtures.dossier({
        publicId: dosPropag,
        visibilite: 'PRIVE',
        indicateurs: [{ publicId: viaDossier }],
      })
      const apiKey = await fixtures.apiKey({
        dossierPermissions: [{ dossier: { publicId: dosPropag }, action: 'WRITE' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => listIndicateurs({}))

      const value = result._unsafeUnwrap()
      expect(value.items.map((i) => i.id)).toEqual([viaDossier])
    }),
  )

  it(
    'retourne tous les indicateurs autorisés quand leur nombre est inférieur à la taille de page',
    integrationTest(async () => {
      const [ind1, ind2, ind3] = testIndicateurIds(3)
      await fixtures.indicateur(
        { publicId: ind1, nom: 'Alpha' },
        { publicId: ind2, nom: 'Bravo' },
        { publicId: ind3, nom: 'Charlie' },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [
          { indicateur: { publicId: ind1 }, action: 'READ' },
          { indicateur: { publicId: ind2 }, action: 'READ' },
          { indicateur: { publicId: ind3 }, action: 'READ' },
        ],
      })

      const result = await runAsPrincipal(apiKey.id, () => listIndicateurs({}))

      const value = result._unsafeUnwrap()
      expect(value.items.map((i) => i.id)).toEqual([ind1, ind2, ind3])
      expect(value.pagination).toEqual({ cursor: null, hasMore: false })
      expect(value.total).toBe(3)
    }),
  )

  it(
    "pagine quand le nombre d'indicateurs dépasse la taille de page",
    integrationTest(async () => {
      const ids = testIndicateurIds(6)
      const created = await fixtures.indicateur(
        { publicId: ids[0] },
        { publicId: ids[1] },
        { publicId: ids[2] },
        { publicId: ids[3] },
        { publicId: ids[4] },
        { publicId: ids[5] },
      )
      const apiKey = await fixtures.apiKey({
        permissions: ids.map((publicId) => ({
          indicateur: { publicId },
          action: 'READ' as const,
        })),
      })

      const result = await runAsPrincipal(apiKey.id, () => listIndicateurs({ pageSize: 5 }))

      const value = result._unsafeUnwrap()
      expect(value.items.map((i) => i.id)).toEqual(ids.slice(0, 5))
      expect(value.pagination).toEqual({ cursor: encodeCursor(created[4]!.id), hasMore: true })
      expect(value.total).toBe(6)
    }),
  )

  it(
    'retourne la page suivante en utilisant le cursor',
    integrationTest(async () => {
      const ids = testIndicateurIds(6)
      const created = await fixtures.indicateur(
        { publicId: ids[0] },
        { publicId: ids[1] },
        { publicId: ids[2] },
        { publicId: ids[3] },
        { publicId: ids[4] },
        { publicId: ids[5] },
      )
      const apiKey = await fixtures.apiKey({
        permissions: ids.map((publicId) => ({
          indicateur: { publicId },
          action: 'READ' as const,
        })),
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listIndicateurs({ cursor: encodeCursor(created[4]!.id) }),
      )

      const value = result._unsafeUnwrap()
      expect(value.items.map((i) => i.id)).toEqual([ids[5]])
      expect(value.pagination).toEqual({ cursor: null, hasMore: false })
      expect(value.total).toBe(6)
    }),
  )

  it(
    'filtre les indicateurs par recherche de manière case-insensitive',
    integrationTest(async () => {
      const [ind1, ind2, ind3] = testIndicateurIds(3)
      await fixtures.indicateur(
        { publicId: ind1, nom: 'Taux de satisfaction' },
        { publicId: ind2, nom: 'Délai moyen' },
        { publicId: ind3, nom: 'SATISFACTION client' },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [
          { indicateur: { publicId: ind1 }, action: 'READ' },
          { indicateur: { publicId: ind2 }, action: 'READ' },
          { indicateur: { publicId: ind3 }, action: 'READ' },
        ],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listIndicateurs({ recherche: 'satisfaction' }),
      )

      const value = result._unsafeUnwrap()
      expect(value.items.map((i) => i.id)).toEqual([ind1, ind3])
      expect(value.pagination).toEqual({ cursor: null, hasMore: false })
      expect(value.total).toBe(2)
    }),
  )

  it(
    'combine la recherche et la pagination',
    integrationTest(async () => {
      const ids = testIndicateurIds(7)
      const created = await fixtures.indicateur(
        { publicId: ids[0], nom: 'Satisfaction 1' },
        { publicId: ids[1], nom: 'Satisfaction 2' },
        { publicId: ids[2], nom: 'Satisfaction 3' },
        { publicId: ids[3], nom: 'Satisfaction 4' },
        { publicId: ids[4], nom: 'Satisfaction 5' },
        { publicId: ids[5], nom: 'Satisfaction 6' },
        { publicId: ids[6], nom: 'Délai moyen' },
      )
      const apiKey = await fixtures.apiKey({
        permissions: ids.map((publicId) => ({
          indicateur: { publicId },
          action: 'READ' as const,
        })),
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listIndicateurs({ recherche: 'satisfaction', pageSize: 5 }),
      )

      const value = result._unsafeUnwrap()
      expect(value.items.map((i) => i.id)).toEqual(ids.slice(0, 5))
      expect(value.pagination).toEqual({ cursor: encodeCursor(created[4]!.id), hasMore: true })
      expect(value.total).toBe(6)
    }),
  )

  it(
    'filtre les indicateurs par ids quand le paramètre est fourni',
    integrationTest(async () => {
      const [ind1, ind2, ind3] = testIndicateurIds(3)
      await fixtures.indicateur({ publicId: ind1 }, { publicId: ind2 }, { publicId: ind3 })
      const apiKey = await fixtures.apiKey({
        permissions: [
          { indicateur: { publicId: ind1 }, action: 'READ' },
          { indicateur: { publicId: ind2 }, action: 'READ' },
          { indicateur: { publicId: ind3 }, action: 'READ' },
        ],
      })

      const result = await runAsPrincipal(apiKey.id, () => listIndicateurs({ ids: [ind1, ind3] }))

      const value = result._unsafeUnwrap()
      expect(value.items.map((i) => i.id).sort()).toEqual([ind1, ind3].sort())
      expect(value.total).toBe(2)
    }),
  )

  it(
    'applique les permissions par-dessus le filtre ids (un id non autorisé est silencieusement écarté)',
    integrationTest(async () => {
      const [accessible, hidden] = testIndicateurIds(2)
      await fixtures.indicateur({ publicId: accessible }, { publicId: hidden })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: accessible }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listIndicateurs({ ids: [accessible, hidden] }),
      )

      const value = result._unsafeUnwrap()
      expect(value.items.map((i) => i.id)).toEqual([accessible])
      expect(value.total).toBe(1)
    }),
  )

  it(
    'expose referentiels triés par publicId ASC sur chaque item',
    integrationTest(async () => {
      const [accessible] = testIndicateurIds(1)
      const refListZ = testReferentielId()
      const refListM = testReferentielId()
      const indicateur = await fixtures.indicateur({ publicId: accessible })
      const [ref1, ref2] = await fixtures.referentiel(
        { publicId: refListZ },
        { publicId: refListM },
      )
      await db().indicateurReferentiel.createMany({
        data: [
          { indicateurId: indicateur.id, referentielId: ref1!.id, fonctionAgregation: 'SUM' },
          { indicateurId: indicateur.id, referentielId: ref2!.id, fonctionAgregation: 'SUM' },
        ],
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: accessible }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => listIndicateurs({}))

      const referentielsTries = [
        {
          id: refListM,
          nom: 'Référentiel de test',
          fonctionAgregation: 'SUM' as const,
        },
        {
          id: refListZ,
          nom: 'Référentiel de test',
          fonctionAgregation: 'SUM' as const,
        },
      ].sort((a, b) => a.id.localeCompare(b.id))

      const value = result._unsafeUnwrap()
      expect(value.items.find((i) => i.id === accessible)?.referentiels).toEqual(referentielsTries)
    }),
  )
})

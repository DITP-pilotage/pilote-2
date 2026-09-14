import { SLUG_BASE_MAX_LENGTH } from '@pilote/kpilote-shared/slug'
import { describe, expect, it } from 'vitest'

import { resolveSlug } from '@/framework/persistence/resolveSlug'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testCollectionId, testIndicateurId } from '@/test/randomIds'

describe('resolveSlug', () => {
  it(
    'rend le slug nu quand il est libre',
    integrationTest(async () => {
      const base = testIndicateurId()

      expect(await resolveSlug({ entite: 'indicateur', base })).toBe(base)
    }),
  )

  it(
    'suffixe à partir de 2 quand le slug nu est pris',
    integrationTest(async () => {
      const base = testIndicateurId()
      await fixtures.indicateur({ publicId: base })

      expect(await resolveSlug({ entite: 'indicateur', base })).toBe(`${base}-2`)
    }),
  )

  it(
    'repart du plus grand suffixe pris, sans combler les trous',
    integrationTest(async () => {
      const base = testIndicateurId()
      await fixtures.indicateur(
        { publicId: base },
        { publicId: `${base}-2` },
        { publicId: `${base}-7` },
      )

      expect(await resolveSlug({ entite: 'indicateur', base })).toBe(`${base}-8`)
    }),
  )

  it(
    'compare sans distinguer la casse',
    integrationTest(async () => {
      const base = testIndicateurId()
      await fixtures.indicateur({ publicId: base.toUpperCase() })

      expect(await resolveSlug({ entite: 'indicateur', base })).toBe(`${base}-2`)
    }),
  )

  it(
    'ignore les slugs qui ne font que commencer par la racine',
    integrationTest(async () => {
      const base = testIndicateurId()
      await fixtures.indicateur({ publicId: `${base}bis` }, { publicId: `${base}-bis` })

      expect(await resolveSlug({ entite: 'indicateur', base })).toBe(base)
    }),
  )

  it(
    'cloisonne la numérotation par entité',
    integrationTest(async () => {
      const base = testCollectionId()
      await fixtures.indicateur({ publicId: base })

      expect(await resolveSlug({ entite: 'collection', base })).toBe(base)
    }),
  )

  it(
    'tronque la racine pour laisser la place au suffixe',
    integrationTest(async () => {
      const base = `a${testIndicateurId()}`.repeat(20)

      expect(await resolveSlug({ entite: 'indicateur', base })).toHaveLength(SLUG_BASE_MAX_LENGTH)
    }),
  )
})

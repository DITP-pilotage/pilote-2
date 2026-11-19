import { errAsync, ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'
import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import { prisma } from '@/framework/persistence/prisma'
import { withTransaction } from '@/framework/persistence/withTransaction'

// `withTransaction` ouvre une vraie transaction, hors d'`integrationTest` : ce qui
// est committé est visible par le client global, et le test le supprime ensuite.
const createPrincipal = (id: string) =>
  ResultAsync.fromSafePromise(db().principal.create({ data: { id } }))

const principalExists = async (id: string): Promise<boolean> =>
  (await prisma.principal.findUnique({ where: { id } })) !== null

describe.concurrent('withTransaction', () => {
  it('commit les écritures quand le Result est ok', async () => {
    const id = uuidv7()
    try {
      const result = await withTransaction(() => createPrincipal(id).map(() => 'fait'))

      expect(result._unsafeUnwrap()).toBe('fait')
      expect(await principalExists(id)).toBe(true)
    } finally {
      await prisma.principal.deleteMany({ where: { id } })
    }
  })

  it('annule les écritures et rend l’erreur quand le Result est en erreur', async () => {
    const id = uuidv7()

    const result = await withTransaction(() =>
      createPrincipal(id).andThen(() => errAsync({ type: 'REFUS' })),
    )

    expect(result._unsafeUnwrapErr()).toEqual({ type: 'REFUS' })
    expect(await principalExists(id)).toBe(false)
  })

  it('annule les écritures et propage une exception', async () => {
    const id = uuidv7()

    await expect(
      withTransaction(() =>
        createPrincipal(id).andThen(() =>
          ResultAsync.fromSafePromise(Promise.reject(new Error('panne'))),
        ),
      ),
    ).rejects.toThrow('panne')
    expect(await principalExists(id)).toBe(false)
  })
})

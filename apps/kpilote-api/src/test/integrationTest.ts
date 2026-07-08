import { withTransaction } from '@/framework/persistence/withTransaction'

const ROLLBACK = Symbol('rollback')

export const integrationTest = (testFn: () => Promise<void>) => async (): Promise<void> => {
  try {
    await withTransaction(async () => {
      await testFn()
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- sentinel symbol used to force a transaction rollback
      throw ROLLBACK
    })
  } catch (error) {
    if (error !== ROLLBACK) throw error
  }
}

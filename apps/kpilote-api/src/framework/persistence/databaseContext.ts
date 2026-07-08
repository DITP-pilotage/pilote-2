import { createMiddleware } from 'hono/factory'

import { withAppDatabase } from '@/framework/persistence/withAppDatabase'

export const databaseContext = createMiddleware(async (_context, next) => {
  await withAppDatabase(next)
})

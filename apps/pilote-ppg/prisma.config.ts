import 'dotenv/config'

import { defineConfig, env } from 'prisma/config'

// Prisma 7 ne lit plus le champ `prisma` du package.json et refuse `url` dans le
// schéma : le chemin du schéma, celui des migrations, le seed et l'URL de Migrate
// se déclarent tous ici. Le CLI ne charge plus non plus les variables
// d'environnement tout seul, d'où l'import de dotenv.
export default defineConfig({
  schema: 'src/database/prisma/schema.prisma',
  migrations: {
    path: 'src/database/prisma/migrations',
    seed: 'tsx src/database/prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})

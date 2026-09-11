import 'dotenv/config'

import { defineConfig, env } from 'prisma/config'

// Prisma 7 ne lit plus le champ `prisma` du package.json et refuse `url` dans le
// schéma : le chemin du schéma, celui des migrations, le seed et l'URL de Migrate
// se déclarent tous ici. Le CLI ne charge plus non plus les variables
// d'environnement tout seul, d'où l'import de dotenv.
//
// `env()` résout DATABASE_URL au chargement du fichier et lève si elle manque, ce qui
// casse même `prisma generate` — qui n'ouvre pourtant aucune connexion. C'est
// volontaire de garder cette erreur explicite : le job de lint de la CI fournit une
// URL factice plutôt qu'un vrai service postgres, ce qui suffit à charger la config
// sans démarrer une base pour rien.
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

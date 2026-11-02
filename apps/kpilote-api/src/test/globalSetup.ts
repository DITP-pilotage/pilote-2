import { execSync } from 'node:child_process'

import { config } from 'dotenv'

export const setup = (): void => {
  config({ path: '.env.test' })
  execSync('pnpm prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env },
  })
  // Dimension de test par défaut (cf. `fixtures.dimension`) : créée hors des
  // transactions de test, pour que les tests concurrents la lisent sans se
  // bloquer sur son unicité.
  execSync('pnpm prisma db execute --stdin', {
    input:
      "INSERT INTO dimension (id, public_id, nom, description, created_at, updated_at) VALUES ('019a4000-0000-7000-8000-00000000d1e0', 'DIM-TEST-DEFAUT', 'Dimension de test', NULL, now(), now()) ON CONFLICT (public_id) DO NOTHING;",
    stdio: ['pipe', 'inherit', 'inherit'],
    env: { ...process.env },
  })
}

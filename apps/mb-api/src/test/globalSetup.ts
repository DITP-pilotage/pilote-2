import { execSync } from 'node:child_process'

import { config } from 'dotenv'

export const setup = (): void => {
  config({ path: '.env.test' })
  execSync('pnpm prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env },
  })
}

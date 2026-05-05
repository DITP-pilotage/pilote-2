import { PrismaPg } from '@prisma/adapter-pg'
import { uuidv7 } from 'uuidv7'

import { PrismaClient } from '../src/generated/prisma/client.js'

const databaseUrl = process.env['DATABASE_URL']
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run the seed script.')
}

const adapter = new PrismaPg({ connectionString: databaseUrl })
const prisma = new PrismaClient({ adapter })

const indicateursSeed: ReadonlyArray<{ publicId: string; nom: string }> = [
  { publicId: 'IND-001', nom: 'Taux de chômage' },
  { publicId: 'IND-002', nom: 'Émissions de CO2' },
  { publicId: 'IND-003', nom: 'Couverture fibre' },
  { publicId: 'IND-004', nom: 'Délai de traitement préfectures' },
  { publicId: 'IND-005', nom: 'Effectif police nationale' },
  { publicId: 'IND-006', nom: 'Indicateur expérimental ancien' },
  { publicId: 'IND-007', nom: 'Indicateur en pause' },
  { publicId: 'IND-008', nom: 'Satisfaction usagers services publics' },
]

const utilisateursSeed: ReadonlyArray<{ providerSub: string; providerType: 'keycloak' }> = [
  { providerSub: 'ee35b706-7840-4df0-9493-01d272af8778', providerType: 'keycloak' },
]

const main = async () => {
  for (const item of indicateursSeed) {
    await prisma.indicateur.upsert({
      where: { publicId: item.publicId },
      update: { nom: item.nom },
      create: { id: uuidv7(), publicId: item.publicId, nom: item.nom },
    })
  }
  for (const item of utilisateursSeed) {
    await prisma.utilisateur.upsert({
      where: {
        utilisateur_provider_sub_type_unique: {
          providerSub: item.providerSub,
          providerType: item.providerType,
        },
      },
      update: {},
      create: {
        id: uuidv7(),
        providerSub: item.providerSub,
        providerType: item.providerType,
      },
    })
  }
  console.log(
    `Seed terminé : ${indicateursSeed.length} indicateurs, ${utilisateursSeed.length} utilisateurs.`,
  )
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => {
    void prisma.$disconnect()
  })

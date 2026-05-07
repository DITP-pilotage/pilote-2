import { PrismaPg } from '@prisma/adapter-pg'
import { uuidv7 } from 'uuidv7'

import { PrismaClient } from '../src/generated/prisma/client.js'

import {
  individusSeed,
  referentielsSeed,
  relationsSeed,
  valeursAvancementSeed,
} from './seedData/geo.js'

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

const utilisateursSeed: ReadonlyArray<{ providerSub: string; providerType: 'proconnect' }> = [
  { providerSub: '530f9db1-7ade-4ef2-9b3b-693e5614e2e4', providerType: 'proconnect' },
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

  for (const item of referentielsSeed) {
    await prisma.referentiel.upsert({
      where: { publicId: item.publicId },
      update: { nom: item.nom, description: item.description },
      create: {
        id: uuidv7(),
        publicId: item.publicId,
        nom: item.nom,
        description: item.description,
      },
    })
  }

  for (const item of individusSeed) {
    await prisma.individu.upsert({
      where: { publicId: item.publicId },
      update: { nom: item.nom },
      create: {
        id: uuidv7(),
        publicId: item.publicId,
        nom: item.nom,
      },
    })
  }

  for (const item of individusSeed) {
    const individu = await prisma.individu.findUniqueOrThrow({
      where: { publicId: item.publicId },
      select: { id: true },
    })
    for (const referentielPublicId of item.referentiels) {
      const referentiel = await prisma.referentiel.findUniqueOrThrow({
        where: { publicId: referentielPublicId },
        select: { id: true },
      })
      await prisma.referentielIndividu.upsert({
        where: {
          referentielId_individuId: {
            referentielId: referentiel.id,
            individuId: individu.id,
          },
        },
        update: {},
        create: { referentielId: referentiel.id, individuId: individu.id },
      })
    }
  }

  for (const item of relationsSeed) {
    const parent = await prisma.individu.findUniqueOrThrow({
      where: { publicId: item.parent },
      select: { id: true },
    })
    const child = await prisma.individu.findUniqueOrThrow({
      where: { publicId: item.child },
      select: { id: true },
    })
    await prisma.relation.upsert({
      where: {
        parentId_childId: {
          parentId: parent.id,
          childId: child.id,
        },
      },
      update: {},
      create: {
        id: uuidv7(),
        parentId: parent.id,
        childId: child.id,
      },
    })
  }

  for (const item of valeursAvancementSeed) {
    const indicateur = await prisma.indicateur.findUniqueOrThrow({
      where: { publicId: item.indicateurPublicId },
      select: { id: true },
    })
    const individu = await prisma.individu.findUniqueOrThrow({
      where: { publicId: item.individuPublicId },
      select: { id: true },
    })
    await prisma.valeurAvancement.upsert({
      where: {
        valeur_avancement_unique: {
          indicateurId: indicateur.id,
          individuId: individu.id,
          date: item.date,
        },
      },
      update: { valeur: item.valeur },
      create: {
        id: uuidv7(),
        indicateurId: indicateur.id,
        individuId: individu.id,
        date: item.date,
        valeur: item.valeur,
      },
    })
  }

  console.log(
    `Seed terminé : ${indicateursSeed.length} indicateurs, ${utilisateursSeed.length} utilisateurs, ${referentielsSeed.length} référentiels, ${individusSeed.length} individus, ${relationsSeed.length} relations, ${valeursAvancementSeed.length} valeurs.`,
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

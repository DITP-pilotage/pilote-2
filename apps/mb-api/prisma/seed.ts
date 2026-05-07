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
  { publicId: 'IND-009', nom: 'Délai moyen de prise en charge urgences' },
  { publicId: 'IND-010', nom: 'Taux de vaccination infantile' },
  { publicId: 'IND-011', nom: 'Accès aux soins de proximité' },
  { publicId: 'IND-012', nom: 'Couverture des services France Santé' },
  { publicId: 'IND-013', nom: 'Déploiement de France Santé' },
  { publicId: 'IND-014', nom: "Amélioration de l'orientation des élèves" },
  { publicId: 'IND-015', nom: 'Taux de réussite au baccalauréat' },
  { publicId: 'IND-016', nom: 'Nombre de places en crèche' },
  { publicId: 'IND-017', nom: 'Logements rénovés énergétiquement' },
  { publicId: 'IND-018', nom: "Production d'énergies renouvelables" },
  { publicId: 'IND-019', nom: 'Émissions de gaz à effet de serre' },
  { publicId: 'IND-020', nom: "Qualité de l'air en zones urbaines" },
  { publicId: 'IND-021', nom: 'Aires protégées (terre et mer)' },
  { publicId: 'IND-022', nom: 'Tri et valorisation des déchets' },
  { publicId: 'IND-023', nom: 'Délai de traitement CAF' },
  { publicId: 'IND-024', nom: 'Délai de traitement Pôle emploi' },
  { publicId: 'IND-025', nom: "Délai de délivrance des titres d'identité" },
  { publicId: 'IND-026', nom: 'Présence postale en zone rurale' },
  { publicId: 'IND-027', nom: 'Maisons France Services ouvertes' },
  { publicId: 'IND-028', nom: 'Désertification médicale' },
  { publicId: 'IND-029', nom: 'Effectifs gendarmerie nationale' },
  { publicId: 'IND-030', nom: 'Élucidation des cambriolages' },
  { publicId: 'IND-031', nom: 'Sécurité routière — accidents mortels' },
  { publicId: 'IND-032', nom: 'Délai de jugement civil' },
  { publicId: 'IND-033', nom: 'Délai de jugement pénal' },
  { publicId: 'IND-034', nom: 'Recettes fiscales nettes' },
  { publicId: 'IND-035', nom: 'Dette publique / PIB' },
  { publicId: 'IND-036', nom: 'Croissance du PIB' },
  { publicId: 'IND-037', nom: 'Inflation (IPC)' },
  { publicId: 'IND-038', nom: "Taux d'emploi des seniors" },
  { publicId: 'IND-039', nom: "Taux d'emploi des jeunes" },
  { publicId: 'IND-040', nom: 'Apprentissage — contrats signés' },
  { publicId: 'IND-041', nom: "Création nette d'entreprises" },
  { publicId: 'IND-042', nom: 'Exportations de biens' },
  { publicId: 'IND-043', nom: 'Couverture 5G du territoire' },
  { publicId: 'IND-044', nom: 'Dématérialisation des démarches administratives' },
  { publicId: 'IND-045', nom: "Cyberattaques traitées par l'ANSSI" },
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

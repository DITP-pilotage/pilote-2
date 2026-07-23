import { PrismaPg } from '@prisma/adapter-pg'
import { uuidv7 } from 'uuidv7'

import {
  type PeriodeMiseAJour,
  type UniteDuree,
  type UniteIndicateurCode,
} from '@pilote/kpilote-shared/indicateur'

import { Prisma, PrismaClient } from '../src/generated/prisma/client.js'
import { type FonctionAgregation } from '../src/generated/prisma/enums.js'

import {
  buildObjectifsPourIndicateur,
  buildValeursPourIndicateur,
  individusSeed,
  referentielsSeed,
  relationsSeed,
} from './seedData/geo.js'
import { widgetsSeed } from './seedData/widgets.js'

const databaseUrl = process.env['DATABASE_URL']
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run the seed script.')
}

const adapter = new PrismaPg({ connectionString: databaseUrl })
const prisma = new PrismaClient({ adapter })

const indicateursSeed: ReadonlyArray<{
  publicId: string
  nom: string
  visibilite?: 'PUBLIC' | 'PRIVE'
  unite?: UniteIndicateurCode
  description?: string
  methodeCalcul?: string
  sourceDonnees?: string
  sourceUrl?: string
  periodeMiseAJour?: PeriodeMiseAJour
  jourMiseAJour?: number
  delaiMiseADispositionNombre?: number
  delaiMiseADispositionUnite?: UniteDuree
}> = [
  {
    publicId: 'IND-001',
    nom: 'Taux de chômage',
    unite: 'POURCENTAGE',
    description:
      'Part de la population active sans emploi cherchant activement un travail, au sens du Bureau international du travail.',
    methodeCalcul: 'Nombre de chômeurs BIT / population active × 100',
    sourceDonnees: 'INSEE — Enquête Emploi',
    sourceUrl: 'https://www.insee.fr/fr/statistiques/2489483',
    periodeMiseAJour: 'TRIMESTRIELLE',
    jourMiseAJour: 15,
    // L'INSEE publie le taux de chômage BIT environ 50 jours après la fin du trimestre.
    delaiMiseADispositionNombre: 2,
    delaiMiseADispositionUnite: 'MOIS',
  },
  {
    publicId: 'IND-002',
    nom: 'Émissions de CO2',
    unite: 'TONNES_CO2',
    description: "Émissions totales de dioxyde de carbone d'origine anthropique sur le territoire.",
    methodeCalcul: 'Inventaire national selon les lignes directrices du GIEC',
    sourceDonnees: 'CITEPA — Secten',
    sourceUrl: 'https://www.citepa.org/fr/secten/',
    periodeMiseAJour: 'ANNUELLE',
    // L'inventaire CITEPA d'une année n'est consolidé et publié qu'environ 18 mois
    // plus tard : la donnée arrive après la valeur théorique suivante.
    delaiMiseADispositionNombre: 18,
    delaiMiseADispositionUnite: 'MOIS',
  },
  {
    publicId: 'IND-003',
    nom: 'Couverture fibre',
    unite: 'POURCENTAGE',
    description:
      'Part des locaux raccordables à la fibre optique (FttH) sur le territoire national.',
    methodeCalcul: 'Locaux raccordables FttH / locaux totaux × 100',
    sourceDonnees: 'ARCEP — Observatoire du très haut débit',
    sourceUrl: 'https://www.arcep.fr/cartes-et-donnees/nos-cartes/couverture-fixe.html',
    periodeMiseAJour: 'TRIMESTRIELLE',
    jourMiseAJour: 1,
  },
  {
    publicId: 'IND-004',
    nom: 'Délai de traitement préfectures',
    unite: 'JOURS',
    description:
      "Délai moyen d'instruction des collections déposés en préfecture, en jours ouvrés.",
    sourceDonnees: 'Ministère de l’Intérieur — DGCL',
    periodeMiseAJour: 'MENSUELLE',
    jourMiseAJour: 5,
  },
  { publicId: 'IND-005', nom: 'Effectif police nationale', unite: 'ETP' },
  { publicId: 'IND-006', nom: 'Indicateur expérimental ancien' },
  { publicId: 'IND-007', nom: 'Indicateur en pause', periodeMiseAJour: 'AUCUNE' },
  {
    publicId: 'IND-008',
    nom: 'Satisfaction usagers services publics',
    unite: 'POINTS',
    description: 'Note de satisfaction globale des usagers des services publics, sur 10.',
    methodeCalcul: 'Moyenne arithmétique des notes individuelles collectées par enquête',
    sourceDonnees: 'DITP — Baromètre Services Publics+',
    sourceUrl: 'https://www.plus.transformation.gouv.fr/',
    periodeMiseAJour: 'SEMESTRIELLE',
    // Résultats du baromètre consolidés environ 2 mois après la fin de la vague.
    delaiMiseADispositionNombre: 2,
    delaiMiseADispositionUnite: 'MOIS',
  },
  { publicId: 'IND-009', nom: 'Délai moyen de prise en charge urgences', unite: 'MINUTES' },
  {
    publicId: 'IND-010',
    nom: 'Taux de vaccination infantile',
    unite: 'POURCENTAGE',
    description:
      "Part des enfants de 24 mois ayant reçu l'ensemble des vaccins du calendrier vaccinal obligatoire.",
    sourceDonnees: 'Santé publique France',
    sourceUrl: 'https://www.santepubliquefrance.fr/',
    periodeMiseAJour: 'ANNUELLE',
  },
  { publicId: 'IND-011', nom: 'Accès aux soins de proximité', unite: 'POURCENTAGE' },
  { publicId: 'IND-012', nom: 'Couverture des services France Santé', unite: 'POURCENTAGE' },
  { publicId: 'IND-013', nom: 'Déploiement de France Santé', unite: 'POURCENTAGE' },
  { publicId: 'IND-014', nom: "Amélioration de l'orientation des élèves" },
  { publicId: 'IND-015', nom: 'Taux de réussite au baccalauréat', unite: 'POURCENTAGE' },
  { publicId: 'IND-016', nom: 'Nombre de places en crèche', unite: 'VALEUR_UNITAIRE' },
  { publicId: 'IND-017', nom: 'Logements rénovés énergétiquement', unite: 'VALEUR_UNITAIRE' },
  { publicId: 'IND-018', nom: "Production d'énergies renouvelables", unite: 'TERAWATT' },
  { publicId: 'IND-019', nom: 'Émissions de gaz à effet de serre', unite: 'TONNES_CO2' },
  { publicId: 'IND-020', nom: "Qualité de l'air en zones urbaines" },
  { publicId: 'IND-021', nom: 'Aires protégées (terre et mer)', unite: 'HECTARES' },
  { publicId: 'IND-022', nom: 'Tri et valorisation des déchets', unite: 'POURCENTAGE' },
  { publicId: 'IND-023', nom: 'Délai de traitement CAF', unite: 'JOURS' },
  { publicId: 'IND-024', nom: 'Délai de traitement Pôle emploi', unite: 'JOURS' },
  { publicId: 'IND-025', nom: "Délai de délivrance des titres d'identité", unite: 'JOURS' },
  { publicId: 'IND-026', nom: 'Présence postale en zone rurale' },
  { publicId: 'IND-027', nom: 'Maisons France Services ouvertes', unite: 'VALEUR_UNITAIRE' },
  { publicId: 'IND-028', nom: 'Désertification médicale' },
  { publicId: 'IND-029', nom: 'Effectifs gendarmerie nationale', unite: 'ETP' },
  { publicId: 'IND-030', nom: 'Élucidation des cambriolages', unite: 'POURCENTAGE' },
  { publicId: 'IND-031', nom: 'Sécurité routière — accidents mortels', unite: 'VALEUR_UNITAIRE' },
  { publicId: 'IND-032', nom: 'Délai de jugement civil', unite: 'MOIS' },
  { publicId: 'IND-033', nom: 'Délai de jugement pénal', unite: 'MOIS' },
  { publicId: 'IND-034', nom: 'Recettes fiscales nettes', unite: 'MILLIARDS_EUROS' },
  { publicId: 'IND-035', nom: 'Dette publique / PIB', unite: 'POURCENTAGE' },
  { publicId: 'IND-036', nom: 'Croissance du PIB', unite: 'POURCENTAGE' },
  { publicId: 'IND-037', nom: 'Inflation (IPC)', unite: 'POURCENTAGE' },
  { publicId: 'IND-038', nom: "Taux d'emploi des seniors", unite: 'POURCENTAGE' },
  { publicId: 'IND-039', nom: "Taux d'emploi des jeunes", unite: 'POURCENTAGE' },
  { publicId: 'IND-040', nom: 'Apprentissage — contrats signés', unite: 'VALEUR_UNITAIRE' },
  { publicId: 'IND-041', nom: "Création nette d'entreprises", unite: 'VALEUR_UNITAIRE' },
  { publicId: 'IND-042', nom: 'Exportations de biens', unite: 'MILLIARDS_EUROS' },
  { publicId: 'IND-043', nom: 'Couverture 5G du territoire', unite: 'POURCENTAGE' },
  {
    publicId: 'IND-044',
    nom: 'Dématérialisation des démarches administratives',
    unite: 'POURCENTAGE',
  },
  { publicId: 'IND-045', nom: "Cyberattaques traitées par l'ANSSI", unite: 'VALEUR_UNITAIRE' },
  {
    publicId: 'IND-046',
    nom: 'Indicateur public — Démographie',
    visibilite: 'PUBLIC',
    unite: 'MILLIONS',
  },
  {
    publicId: 'IND-047',
    nom: 'Indicateur public — Espérance de vie',
    visibilite: 'PUBLIC',
    unite: 'ANNEES',
  },
  {
    publicId: 'IND-048',
    nom: 'Indicateur public — Pauvreté',
    visibilite: 'PUBLIC',
    unite: 'POURCENTAGE',
  },
  {
    publicId: 'IND-049',
    nom: "Indicateur public — Taux d'alphabétisation",
    visibilite: 'PUBLIC',
    unite: 'POURCENTAGE',
  },
  {
    publicId: 'IND-050',
    nom: 'Indicateur public — Accès à internet haut débit',
    visibilite: 'PUBLIC',
    unite: 'POURCENTAGE',
  },
]

const utilisateursSeed: ReadonlyArray<{
  email: string
  nom: string
  prenom: string
  service: string
  fonction: string
}> = [
  {
    email: 'ditp.admin@example.com',
    nom: 'Admin',
    prenom: 'DITP',
    service: 'DITP',
    fonction: 'Administrateur',
  },
  {
    email: 'claire.dupont@example.com',
    nom: 'Dupont',
    prenom: 'Claire',
    service: 'Bureau des indicateurs',
    fonction: 'Chargée de mission',
  },
]

// Clusters de mise à jour : plusieurs indicateurs peuvent partager la même
// date de mise à jour (réaliste : on bouge plusieurs fiches le même jour).
const indicateurUpdatedAtClusters = [
  '2024-02-12T09:30:00Z',
  '2024-05-22T14:15:00Z',
  '2024-08-08T11:00:00Z',
  '2024-10-30T16:45:00Z',
  '2024-12-18T08:20:00Z',
  '2025-02-05T13:10:00Z',
  '2025-04-17T10:50:00Z',
  '2025-07-03T15:40:00Z',
  '2025-09-25T12:30:00Z',
  '2025-12-10T09:15:00Z',
  '2026-01-28T17:20:00Z',
  '2026-03-14T11:35:00Z',
  '2026-04-22T08:00:00Z',
] as const

const indicateurDates = (index: number): { createdAt: Date; updatedAt: Date } => {
  const updatedAt = new Date(
    indicateurUpdatedAtClusters[index % indicateurUpdatedAtClusters.length]!,
  )
  const offsetDays = 30 + ((index * 17) % 300)
  const createdAt = new Date(updatedAt.getTime() - offsetDays * 86_400_000)
  return { createdAt, updatedAt }
}

// Maille de saisie par défaut : on saisit toujours sur la maille la plus fine
// déclarée pour l'indicateur (DEPT > REG > NAT). Pour les niveaux SUM, la
// valeur est dérivée à la lecture (cf. doc d'archi indicateur-derives.md).
const PRIORITE_MAILLE = ['REF-DEPT', 'REF-REG', 'REF-NAT'] as const

const mailleLaPlusFine = (liensReferentielPublicIds: ReadonlyArray<string>): string | undefined =>
  PRIORITE_MAILLE.find((ref) => liensReferentielPublicIds.includes(ref))

// Indicateurs qui représentent des taux, délais, indices ou ratios : agrégés
// par moyenne arithmétique (non pondérée) à la remontée hiérarchique, plutôt
// que par somme. Classification indicative de seed ; le métier reste seul
// juge sur chaque indicateur réel.
const INDICATEURS_EN_MOYENNE = new Set<string>([
  'IND-009', // Délai moyen de prise en charge urgences
  'IND-010', // Taux de vaccination infantile
  'IND-011', // Accès aux soins de proximité
  'IND-012', // Couverture des services France Santé
  'IND-014', // Amélioration de l'orientation des élèves (indice)
  'IND-015', // Taux de réussite au baccalauréat
  'IND-020', // Qualité de l'air en zones urbaines (indice)
  'IND-023', // Délai de traitement CAF
  'IND-024', // Délai de traitement Pôle emploi
  'IND-025', // Délai de délivrance des titres d'identité
  'IND-026', // Présence postale en zone rurale (couverture)
  'IND-028', // Désertification médicale (taux)
  'IND-030', // Élucidation des cambriolages (taux)
  'IND-032', // Délai de jugement civil
  'IND-033', // Délai de jugement pénal
  'IND-035', // Dette publique / PIB (ratio)
  'IND-036', // Croissance du PIB (taux)
  'IND-037', // Inflation (IPC, taux)
  'IND-038', // Taux d'emploi des seniors
  'IND-039', // Taux d'emploi des jeunes
  'IND-043', // Couverture 5G du territoire
  'IND-044', // Dématérialisation des démarches (taux)
  'IND-047', // Espérance de vie (moyenne)
  'IND-048', // Pauvreté (taux)
  'IND-049', // Taux d'alphabétisation
  'IND-050', // Accès à internet haut débit (couverture)
])

const fonctionAgregationGenerique = (publicId: string): FonctionAgregation =>
  INDICATEURS_EN_MOYENNE.has(publicId) ? 'AVG' : 'SUM'

const main = async () => {
  for (const [index, item] of indicateursSeed.entries()) {
    const { createdAt, updatedAt } = indicateurDates(index)
    const visibilite = item.visibilite ?? 'PRIVE'
    const unite = item.unite ?? null
    const metadonnees = {
      description: item.description ?? null,
      methodeCalcul: item.methodeCalcul ?? null,
      sourceDonnees: item.sourceDonnees ?? null,
      sourceUrl: item.sourceUrl ?? null,
      periodeMiseAJour: item.periodeMiseAJour ?? null,
      jourMiseAJour: item.jourMiseAJour ?? null,
      delaiMiseADispositionNombre: item.delaiMiseADispositionNombre ?? null,
      delaiMiseADispositionUnite: item.delaiMiseADispositionUnite ?? null,
    }
    await prisma.indicateur.upsert({
      where: { publicId: item.publicId },
      update: { nom: item.nom, visibilite, unite, ...metadonnees, updatedAt },
      create: {
        id: uuidv7(),
        publicId: item.publicId,
        nom: item.nom,
        visibilite,
        unite,
        ...metadonnees,
        createdAt,
        updatedAt,
      },
    })
  }
  for (const item of utilisateursSeed) {
    const existing = await prisma.utilisateur.findUnique({ where: { email: item.email } })
    if (existing) {
      await prisma.utilisateur.update({
        where: { email: item.email },
        data: {
          nom: item.nom,
          prenom: item.prenom,
          service: item.service,
          fonction: item.fonction,
        },
      })
      continue
    }
    const id = uuidv7()
    await prisma.$transaction([
      prisma.principal.create({ data: { id } }),
      prisma.utilisateur.create({
        data: {
          id,
          email: item.email,
          nom: item.nom,
          prenom: item.prenom,
          service: item.service,
          fonction: item.fonction,
        },
      }),
    ])
  }

  const ditpAdmin = await prisma.utilisateur.findUniqueOrThrow({
    where: { email: 'ditp.admin@example.com' },
    select: { id: true },
  })
  for (const item of indicateursSeed.slice(0, 8)) {
    const indicateur = await prisma.indicateur.findUniqueOrThrow({
      where: { publicId: item.publicId },
      select: { id: true },
    })
    for (const action of ['READ', 'WRITE'] as const) {
      await prisma.indicateurPermission.upsert({
        where: {
          principalId_indicateurId_action: {
            principalId: ditpAdmin.id,
            indicateurId: indicateur.id,
            action,
          },
        },
        update: {},
        create: {
          principalId: ditpAdmin.id,
          indicateurId: indicateur.id,
          action,
        },
      })
    }
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
    const referentiel = await prisma.referentiel.findUniqueOrThrow({
      where: { publicId: item.referentiel },
      select: { id: true },
    })
    const metadata =
      item.metadata === null ? Prisma.DbNull : (item.metadata as Prisma.InputJsonValue)
    await prisma.individu.upsert({
      where: { publicId: item.publicId },
      update: { nom: item.nom, referentielId: referentiel.id, metadata },
      create: {
        id: uuidv7(),
        publicId: item.publicId,
        nom: item.nom,
        referentielId: referentiel.id,
        metadata,
      },
    })
  }

  for (const item of widgetsSeed) {
    const widget = await prisma.widget.upsert({
      where: { publicId: item.publicId },
      update: {
        type: item.type,
        nom: item.nom,
        joinKey: item.joinKey,
      },
      create: {
        id: uuidv7(),
        publicId: item.publicId,
        type: item.type,
        nom: item.nom,
        joinKey: item.joinKey,
      },
    })
    for (const refPublicId of item.referentielPublicIds) {
      const referentiel = await prisma.referentiel.findUniqueOrThrow({
        where: { publicId: refPublicId },
        select: { id: true },
      })
      await prisma.referentielWidget.upsert({
        where: {
          referentielId_widgetId: { referentielId: referentiel.id, widgetId: widget.id },
        },
        update: {},
        create: { referentielId: referentiel.id, widgetId: widget.id },
      })
    }
  }

  const indicateurReferentielsSeed: ReadonlyArray<{
    indicateurPublicId: string
    referentiels: ReadonlyArray<{
      id: string
      fonctionAgregation: FonctionAgregation
    }>
  }> = [
    {
      indicateurPublicId: 'IND-001',
      referentiels: [
        { id: 'REF-DEPT', fonctionAgregation: 'NONE' },
        { id: 'REF-REG', fonctionAgregation: 'NONE' },
        { id: 'REF-NAT', fonctionAgregation: 'NONE' },
      ],
    },
    {
      indicateurPublicId: 'IND-002',
      referentiels: [
        { id: 'REF-DEPT', fonctionAgregation: 'SUM' },
        { id: 'REF-REG', fonctionAgregation: 'SUM' },
        { id: 'REF-NAT', fonctionAgregation: 'SUM' },
      ],
    },
    {
      indicateurPublicId: 'IND-003',
      referentiels: [
        { id: 'REF-NAT', fonctionAgregation: 'NONE' },
        { id: 'REF-REG', fonctionAgregation: 'NONE' },
        { id: 'REF-DEPT', fonctionAgregation: 'NONE' },
      ],
    },
    {
      indicateurPublicId: 'IND-004',
      referentiels: [
        { id: 'REF-DEPT', fonctionAgregation: 'NONE' },
        { id: 'REF-REG', fonctionAgregation: 'AVG' },
        { id: 'REF-NAT', fonctionAgregation: 'AVG' },
      ],
    },
    {
      indicateurPublicId: 'IND-005',
      referentiels: [
        { id: 'REF-DEPT', fonctionAgregation: 'NONE' },
        { id: 'REF-REG', fonctionAgregation: 'SUM' },
        { id: 'REF-NAT', fonctionAgregation: 'SUM' },
      ],
    },
    {
      indicateurPublicId: 'IND-006',
      referentiels: [{ id: 'REF-EMPTY', fonctionAgregation: 'NONE' }],
    },
    {
      indicateurPublicId: 'IND-007',
      referentiels: [{ id: 'REF-EMPTY', fonctionAgregation: 'NONE' }],
    },
    {
      indicateurPublicId: 'IND-008',
      referentiels: [{ id: 'REF-EMPTY', fonctionAgregation: 'NONE' }],
    },
    ...indicateursSeed
      .filter((ind) => parseInt(ind.publicId.replace('IND-', ''), 10) >= 9)
      .map((ind) => {
        // Politique simple : tous les indicateurs "neutres" sont rattachés à
        // DEPT (NONE) + REG + NAT. La saisie va sur dept, la hiérarchie
        // supérieure se dérive — par somme pour les volumes/cumuls, par
        // moyenne pour les taux/délais/indices (cf. INDICATEURS_EN_MOYENNE).
        const fonction = fonctionAgregationGenerique(ind.publicId)
        return {
          indicateurPublicId: ind.publicId,
          referentiels: [
            { id: 'REF-DEPT', fonctionAgregation: 'NONE' as const },
            { id: 'REF-REG', fonctionAgregation: fonction },
            { id: 'REF-NAT', fonctionAgregation: fonction },
          ],
        }
      }),
  ]

  for (const item of indicateurReferentielsSeed) {
    const indicateur = await prisma.indicateur.findUniqueOrThrow({
      where: { publicId: item.indicateurPublicId },
      select: { id: true },
    })
    for (const configuration of item.referentiels) {
      const referentiel = await prisma.referentiel.findUniqueOrThrow({
        where: { publicId: configuration.id },
        select: { id: true },
      })
      await prisma.indicateurReferentiel.upsert({
        where: {
          indicateurId_referentielId: {
            indicateurId: indicateur.id,
            referentielId: referentiel.id,
          },
        },
        update: { fonctionAgregation: configuration.fonctionAgregation },
        create: {
          indicateurId: indicateur.id,
          referentielId: referentiel.id,
          fonctionAgregation: configuration.fonctionAgregation,
        },
      })
    }
  }

  const liaisonsCount = indicateurReferentielsSeed.reduce(
    (acc, item) => acc + item.referentiels.length,
    0,
  )

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

  // Indexation pour la génération bulk des valeurs : on a besoin d'aller vite
  // pour saisir ~100k lignes (~50 indicateurs × 101 dépts × jusqu'à 36 mois).
  const indicateursParPublicId = new Map(
    (
      await prisma.indicateur.findMany({
        where: { publicId: { in: indicateursSeed.map((i) => i.publicId) } },
      })
    ).map((row) => [row.publicId, row.id]),
  )
  const individusParPublicId = new Map(
    (
      await prisma.individu.findMany({
        where: { publicId: { in: individusSeed.map((i) => i.publicId) } },
      })
    ).map((row) => [row.publicId, { id: row.id, referentielId: row.referentielId }]),
  )
  const referentielParPublicId = new Map(
    (
      await prisma.referentiel.findMany({
        where: { publicId: { in: referentielsSeed.map((r) => r.publicId) } },
      })
    ).map((row) => [row.publicId, row.id]),
  )
  const individusParReferentielId = new Map<string, string[]>()
  for (const individu of individusSeed) {
    const refId = referentielParPublicId.get(individu.referentiel)
    if (!refId) continue
    const liste = individusParReferentielId.get(refId) ?? []
    liste.push(individu.publicId)
    individusParReferentielId.set(refId, liste)
  }

  const unitePourIndicateur = new Map(indicateursSeed.map((i) => [i.publicId, i.unite ?? null]))

  // Purge ciblée pour les indicateurs en POURCENTAGE : la contrainte d'unicité
  // (indicateurId, individuId, date) + `skipDuplicates` garderait sinon les
  // valeurs des seeds antérieurs (où ces indicateurs héritaient d'un profil
  // cyclique générique, ex. base 720 000 pour le chômage). On supprime pour
  // forcer un ré-insert avec le profil borné [0, 100].
  const indicateursAPurger = indicateursSeed
    .filter((i) => i.unite === 'POURCENTAGE')
    .map((i) => indicateursParPublicId.get(i.publicId))
    .filter((id): id is string => id !== undefined)
  if (indicateursAPurger.length > 0) {
    await prisma.valeurAvancement.deleteMany({
      where: { indicateurId: { in: indicateursAPurger } },
    })
    await prisma.objectifIndicateurIndividu.deleteMany({
      where: { indicateurId: { in: indicateursAPurger } },
    })
  }

  let valeursCount = 0
  for (const lien of indicateurReferentielsSeed) {
    const refPublicId = mailleLaPlusFine(lien.referentiels.map((r) => r.id))
    if (!refPublicId) continue // ex. REF-EMPTY → pas de saisie
    const refId = referentielParPublicId.get(refPublicId)
    if (!refId) continue
    const individusPublicIds = individusParReferentielId.get(refId) ?? []
    if (individusPublicIds.length === 0) continue
    const indicateurId = indicateursParPublicId.get(lien.indicateurPublicId)
    if (!indicateurId) continue

    const generated = buildValeursPourIndicateur({
      indicateurPublicId: lien.indicateurPublicId,
      individuPublicIds: individusPublicIds,
      estPourcentage: unitePourIndicateur.get(lien.indicateurPublicId) === 'POURCENTAGE',
    })
    const rows = generated
      .map((g) => {
        const individu = individusParPublicId.get(g.individuPublicId)
        if (!individu) return null
        return {
          id: uuidv7(),
          indicateurId,
          individuId: individu.id,
          date: g.date,
          valeur: new Prisma.Decimal(g.valeur),
        }
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)

    // createMany skipDuplicates : la contrainte unique
    // (indicateurId, individuId, date) garantit l'idempotence du seed sans
    // payer le coût d'un upsert par ligne (~5ms × 100k = 8 min vs ~10s).
    const result = await prisma.valeurAvancement.createMany({
      data: rows,
      skipDuplicates: true,
    })
    valeursCount += result.count
  }

  // Objectifs d'avancement : indicateurs avec une maille de saisie connue —
  // 3 dates-cibles annuelles (2024, 2025, 2026) × individus de la maille.
  // - IND-001..005 : indicateurs PRIVE de démonstration (ditp.admin a accès).
  // - IND-046..050 : indicateurs PUBLIC, indispensables pour que les collections
  //   publics (COL-001..004) exposent un taux de progression calculable à tout
  //   utilisateur authentifié.
  const INDICATEURS_OBJECTIFS = [
    'IND-001',
    'IND-002',
    'IND-003',
    'IND-004',
    'IND-005',
    'IND-046',
    'IND-047',
    'IND-048',
    'IND-049',
    'IND-050',
  ]
  let objectifsCount = 0
  for (const indicateurPublicId of INDICATEURS_OBJECTIFS) {
    const lien = indicateurReferentielsSeed.find((l) => l.indicateurPublicId === indicateurPublicId)
    if (!lien) continue
    const refPublicId = mailleLaPlusFine(lien.referentiels.map((r) => r.id))
    if (!refPublicId) continue
    const refId = referentielParPublicId.get(refPublicId)
    if (!refId) continue
    const individusPublicIds = individusParReferentielId.get(refId) ?? []
    if (individusPublicIds.length === 0) continue
    const indicateurId = indicateursParPublicId.get(indicateurPublicId)
    if (!indicateurId) continue

    const generated = buildObjectifsPourIndicateur({
      indicateurPublicId,
      individuPublicIds: individusPublicIds,
      estPourcentage: unitePourIndicateur.get(indicateurPublicId) === 'POURCENTAGE',
    })
    const rows = generated
      .map((g) => {
        const individu = individusParPublicId.get(g.individuPublicId)
        if (!individu) return null
        return {
          id: uuidv7(),
          indicateurId,
          individuId: individu.id,
          dateCible: g.dateCible,
          valeurCible: new Prisma.Decimal(g.valeurCible),
        }
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)

    const result = await prisma.objectifIndicateurIndividu.createMany({
      data: rows,
      skipDuplicates: true,
    })
    objectifsCount += result.count
  }

  // Collections d'indicateurs : collections thématiques pour le front. L'ordre
  // du tableau `indicateurPublicIds` détermine l'ordre d'affichage (via createdAt
  // ASC de la jonction).
  //
  // Visibilité (cf. docs/architecture/permissions-design.md) :
  // - PUBLIC : visible à tout principal authentifié ;
  // - PRIVE : visible uniquement aux principals avec une permission explicite
  //   sur la collection (et propage READ sur ses indicateurs).
  //
  // COL-001..004 restent PUBLIC pour conserver le comportement antérieur (les
  // 5 indicateurs IND-046..050 sont eux-mêmes PUBLIC, donc accessibles à tous).
  // COL-005 est PRIVE et contient des indicateurs PRIVE (IND-001..003) : il
  // démontre la propagation collection → indicateur (un principal qui a accès à
  // COL-005 voit IND-001..003 même sans permission directe sur eux).
  const collectionsSeed: ReadonlyArray<{
    publicId: string
    nom: string
    description: string | null
    visibilite: 'PUBLIC' | 'PRIVE'
    indicateurPublicIds: ReadonlyArray<string>
  }> = [
    {
      publicId: 'COL-001',
      nom: 'Indicateurs sociaux',
      description: 'Pauvreté, alphabétisation et accès numérique.',
      visibilite: 'PUBLIC',
      indicateurPublicIds: ['IND-048', 'IND-049', 'IND-050'],
    },
    {
      publicId: 'COL-002',
      nom: 'Santé et démographie',
      description: 'Démographie générale et espérance de vie.',
      visibilite: 'PUBLIC',
      indicateurPublicIds: ['IND-046', 'IND-047'],
    },
    {
      publicId: 'COL-003',
      nom: "Vue d'ensemble — indicateurs publics",
      description: "L'ensemble des indicateurs publics du référentiel mb.",
      visibilite: 'PUBLIC',
      indicateurPublicIds: ['IND-046', 'IND-047', 'IND-048', 'IND-049', 'IND-050'],
    },
    {
      publicId: 'COL-004',
      nom: 'Niveau de vie',
      description: 'Indicateurs de bien-être matériel et de connectivité.',
      visibilite: 'PUBLIC',
      indicateurPublicIds: ['IND-048', 'IND-050'],
    },
    {
      publicId: 'COL-005',
      nom: 'Collection admin — économie',
      description: 'Collection privé démontrant la propagation READ vers ses indicateurs.',
      visibilite: 'PRIVE',
      indicateurPublicIds: ['IND-001', 'IND-002', 'IND-003'],
    },
  ]

  const collectionsByPublicId = new Map<string, { id: string }>()
  for (const collectionItem of collectionsSeed) {
    const collection = await prisma.collection.upsert({
      where: { publicId: collectionItem.publicId },
      update: {
        nom: collectionItem.nom,
        description: collectionItem.description,
        visibilite: collectionItem.visibilite,
      },
      create: {
        id: uuidv7(),
        publicId: collectionItem.publicId,
        nom: collectionItem.nom,
        description: collectionItem.description,
        visibilite: collectionItem.visibilite,
      },
    })
    collectionsByPublicId.set(collectionItem.publicId, { id: collection.id })
    for (const indicateurPublicId of collectionItem.indicateurPublicIds) {
      const indicateur = await prisma.indicateur.findUniqueOrThrow({
        where: { publicId: indicateurPublicId },
        select: { id: true },
      })
      await prisma.collectionIndicateur.upsert({
        where: {
          collectionId_indicateurId: {
            collectionId: collection.id,
            indicateurId: indicateur.id,
          },
        },
        update: {},
        create: { collectionId: collection.id, indicateurId: indicateur.id },
      })
    }
  }
  const collectionLiaisonsCount = collectionsSeed.reduce(
    (acc, item) => acc + item.indicateurPublicIds.length,
    0,
  )

  // Permissions collection : on accorde READ + WRITE à ditp.admin sur COL-005
  // (la collection privée). Comme COL-005 contient des indicateurs PRIVE
  // (IND-001..003) sur lesquels ditp.admin a déjà des permissions directes
  // (cf. boucle indicateursSeed.slice(0, 8) plus haut), la propagation
  // n'apporte rien ici en pratique pour ditp.admin — c'est volontaire : la
  // démo de propagation reste vérifiée en tests d'intégration.
  for (const action of ['READ', 'WRITE'] as const) {
    const collection = collectionsByPublicId.get('COL-005')
    if (!collection) continue
    await prisma.collectionPermission.upsert({
      where: {
        principalId_collectionId_action: {
          principalId: ditpAdmin.id,
          collectionId: collection.id,
          action,
        },
      },
      update: {},
      create: {
        principalId: ditpAdmin.id,
        collectionId: collection.id,
        action,
      },
    })
  }
  const collectionPermissionsCount = 2

  // Responsables collection : ditp.admin et claire.dupont sont responsables de COL-005.
  const col005 = collectionsByPublicId.get('COL-005')!
  const col004 = collectionsByPublicId.get('COL-004')!
  const claireDupont = await prisma.utilisateur.findUniqueOrThrow({
    where: { email: 'claire.dupont@example.com' },
    select: { id: true },
  })
  for (const utilisateurId of [ditpAdmin.id, claireDupont.id]) {
    await prisma.collectionResponsable.upsert({
      where: { collectionId_utilisateurId: { collectionId: col005.id, utilisateurId } },
      update: {},
      create: { collectionId: col005.id, utilisateurId },
    })
  }
  const collectionResponsablesCount = 2

  // Responsables indicateur : ditp.admin et claire.dupont sont responsables de IND-001.
  const indicateurIdInd001 = indicateursParPublicId.get('IND-001')!
  for (const utilisateurId of [ditpAdmin.id, claireDupont.id]) {
    await prisma.indicateurResponsable.upsert({
      where: { indicateurId_utilisateurId: { indicateurId: indicateurIdInd001, utilisateurId } },
      update: {},
      create: { indicateurId: indicateurIdInd001, utilisateurId },
    })
  }
  const indicateurResponsablesCount = 2

  // ── Organismes ────────────────────────────────────────────────────────────────

  const ditp = await prisma.organisme.upsert({
    where: { id: 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c401' },
    update: {},
    create: {
      id: 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c401',
      nom: 'Direction interministérielle de la transformation publique (DITP)',
    },
  })

  const dinum = await prisma.organisme.upsert({
    where: { id: 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c402' },
    update: {},
    create: {
      id: 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c402',
      nom: 'Direction interministérielle du numérique (DINUM)',
    },
  })

  // ── Contacts utiles ────────────────────────────────────────────────────────────

  const supportMethodo = await prisma.contactUtile.upsert({
    where: { id: 'b1c2d3e4-f5a6-4b7c-8d9e-f0a1b2c3d401' },
    update: {},
    create: {
      id: 'b1c2d3e4-f5a6-4b7c-8d9e-f0a1b2c3d401',
      organismeId: ditp.id,
      nom: 'Support méthodologique et accompagnement',
      description:
        'Accompagnement des équipes projet dans la démarche de pilotage par les résultats',
      telephone: '01 23 45 67 89',
      email: 'support.methodologie@ditp.gouv.fr',
      url: 'https://www.modernisation.gouv.fr',
      adresse: '20 avenue de Ségur, 75007 Paris',
    },
  })

  const celluleFormation = await prisma.contactUtile.upsert({
    where: { id: 'b1c2d3e4-f5a6-4b7c-8d9e-f0a1b2c3d402' },
    update: {},
    create: {
      id: 'b1c2d3e4-f5a6-4b7c-8d9e-f0a1b2c3d402',
      organismeId: ditp.id,
      nom: 'Cellule formation et montée en compétences',
      description: 'Formations au pilotage par les résultats, ateliers et webinaires',
      telephone: '01 23 45 67 90',
      email: 'formation@ditp.gouv.fr',
    },
  })

  const supportTechnique = await prisma.contactUtile.upsert({
    where: { id: 'b1c2d3e4-f5a6-4b7c-8d9e-f0a1b2c3d403' },
    update: {},
    create: {
      id: 'b1c2d3e4-f5a6-4b7c-8d9e-f0a1b2c3d403',
      organismeId: dinum.id,
      nom: 'Support technique Pilote',
      email: 'support@pilote.gouv.fr',
      url: 'https://pilote.numerique.gouv.fr',
    },
  })

  const ouvertureDonnees = await prisma.contactUtile.upsert({
    where: { id: 'b1c2d3e4-f5a6-4b7c-8d9e-f0a1b2c3d404' },
    update: {},
    create: {
      id: 'b1c2d3e4-f5a6-4b7c-8d9e-f0a1b2c3d404',
      organismeId: dinum.id,
      nom: 'Département ouverture des données',
      description: "Accompagnement à l'ouverture et au partage des données publiques",
      email: 'data@numerique.gouv.fr',
      url: 'https://data.gouv.fr',
    },
  })

  // ── Rattachements ──────────────────────────────────────────────────────────────

  for (const contact of [supportMethodo, celluleFormation, supportTechnique, ouvertureDonnees]) {
    await prisma.collectionContactUtile.upsert({
      where: {
        collectionId_contactUtileId: { collectionId: col005.id, contactUtileId: contact.id },
      },
      update: {},
      create: { collectionId: col005.id, contactUtileId: contact.id },
    })
  }

  await prisma.collectionContactUtile.upsert({
    where: {
      collectionId_contactUtileId: { collectionId: col004.id, contactUtileId: ouvertureDonnees.id },
    },
    update: {},
    create: { collectionId: col004.id, contactUtileId: ouvertureDonnees.id },
  })

  const contactsUtilesCount = 4

  const permissionsCount = 8 * 2
  const widgetLiaisonsCount = widgetsSeed.reduce((acc, w) => acc + w.referentielPublicIds.length, 0)
  console.log(
    `Seed terminé : ${indicateursSeed.length} indicateurs, ${utilisateursSeed.length} utilisateurs, ${permissionsCount} permissions indicateur, ${referentielsSeed.length} référentiels, ${individusSeed.length} individus, ${liaisonsCount} liaisons indicateur-référentiel, ${relationsSeed.length} relations, ${valeursCount} valeurs insérées, ${objectifsCount} objectifs insérés (les doublons ont été ignorés), ${widgetsSeed.length} widgets, ${widgetLiaisonsCount} liaisons référentiel-widget, ${collectionsSeed.length} collections (${collectionLiaisonsCount} liaisons collection-indicateur, ${collectionPermissionsCount} permissions collection, ${collectionResponsablesCount} responsable collection, ${contactsUtilesCount} contacts utiles), ${indicateurResponsablesCount} responsables indicateur.`,
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

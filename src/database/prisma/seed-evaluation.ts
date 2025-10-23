import {
  referentiel_critere,
  referentiel_sous_critere,
  referentiel_rattachement,
  referentiel_objectif,
  fiche_evaluation,
  etape_evaluation,
  rattachement_utilisateur_etape_jalon,
  $Enums,
  evaluation_objectif,
  evaluation_critere,
} from "@prisma/client";
import { prisma } from "@/server/db/prisma";

const criteres: referentiel_critere[] = [
  {
    id: "831cb1a5-036b-4609-a560-68cd1852397f",
    libelle: "Transparence des marchés publics",
    descriptif:
      "Publication, accessibilité et traçabilité des appels d'offres et attributions.",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    id: "dedffbcf-97dc-40c9-9df4-a5be78617ba6",
    libelle: "Délais d'exécution des chantiers",
    descriptif:
      "Respect des jalons, pilotage des retards, communication aux parties prenantes.",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    id: "9cc999b6-b0da-48c5-bae7-2b9d38e5f1bd",
    libelle: "Impact territorial et environnemental",
    descriptif:
      "Insertion locale, nuisances maîtrisées, clauses environnementales.",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
];

const sousCriteres: referentiel_sous_critere[] = [
  {
    id: "48b2635e-d65f-4197-8e77-5623ad4eb46c",
    libelle: "Taux de publication dans les délais",
    descriptif: "Part des avis publiés dans les délais réglementaires.",
    parent_id: "831cb1a5-036b-4609-a560-68cd1852397f",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    id: "176bb1a0-1827-4762-9508-1eaaf5e2d1c0",
    libelle: "Données ouvertes conformes",
    descriptif:
      "Conformité des données aux schémas open data (profil d'acheteur).",
    parent_id: "831cb1a5-036b-4609-a560-68cd1852397f",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    id: "60b875a6-90fd-4deb-87e4-230c91e8246a",
    libelle: "Respect des jalons critiques",
    descriptif: "Proportion de jalons respectés à ±10 jours.",
    parent_id: "dedffbcf-97dc-40c9-9df4-a5be78617ba6",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    id: "1da91469-c6f2-46f5-b8fd-81942ef7e7db",
    libelle: "Plan d'actions sur retards",
    descriptif: "Existence et suivi d'un plan d'actions correctives.",
    parent_id: "dedffbcf-97dc-40c9-9df4-a5be78617ba6",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    id: "92ca5b55-ae9f-4809-abdf-111732ab9772",
    libelle: "Insertion locale",
    descriptif:
      "Part des heures réservées à l'insertion socio-professionnelle.",
    parent_id: "9cc999b6-b0da-48c5-bae7-2b9d38e5f1bd",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    id: "4969b17c-965b-4d01-9546-31a46ceda590",
    libelle: "Clauses environnementales",
    descriptif: "Présence d'objectifs de réduction des déchets et d'émissions.",
    parent_id: "9cc999b6-b0da-48c5-bae7-2b9d38e5f1bd",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
];

const evaluationsCriteresAutoEvaluation: evaluation_critere[] = [
  {
    id: "a04ccc87-2dca-437e-9551-395a1aeb55ea",
    critere_id: "831cb1a5-036b-4609-a560-68cd1852397f",
    note: 10,
    commentaire: "Un commentaire 1",
    etape_evaluation_id: "d6050c26-c872-4134-90d3-c45a8a9dc539",
    auteur_id: "e57fa03f-03f0-4a93-974c-b5107c9c68b1",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    id: "2a4e6053-0d3f-425d-a3b9-44c0a13642b7",
    critere_id: "dedffbcf-97dc-40c9-9df4-a5be78617ba6",
    note: 11,
    commentaire: "Un commentaire 2",
    etape_evaluation_id: "d6050c26-c872-4134-90d3-c45a8a9dc539",
    auteur_id: "e57fa03f-03f0-4a93-974c-b5107c9c68b1",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    id: "27d97e2a-3422-4829-8b9f-4956be9d4077",
    critere_id: "9cc999b6-b0da-48c5-bae7-2b9d38e5f1bd",
    note: 12,
    commentaire: "Un commentaire 3",
    etape_evaluation_id: "d6050c26-c872-4134-90d3-c45a8a9dc539",
    auteur_id: "e57fa03f-03f0-4a93-974c-b5107c9c68b1",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
];

const evaluationsCriteresConsolidation: evaluation_critere[] = [
  {
    id: "4a38e120-0b58-49d9-932a-dbb2b8fccb4d",
    critere_id: "831cb1a5-036b-4609-a560-68cd1852397f",
    note: 10,
    commentaire: "Un commentaire 1",
    etape_evaluation_id: "3ec9fca0-854f-4e53-9664-53244c40060f",
    auteur_id: "e57fa03f-03f0-4a93-974c-b5107c9c68b1",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    id: "2d2a8cb0-058d-4ab0-a388-eefd62ec6437",
    critere_id: "dedffbcf-97dc-40c9-9df4-a5be78617ba6",
    note: 11,
    commentaire: "Un commentaire 2",
    etape_evaluation_id: "3ec9fca0-854f-4e53-9664-53244c40060f",
    auteur_id: "e57fa03f-03f0-4a93-974c-b5107c9c68b1",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    id: "13203ec8-06ae-4484-900b-bc17fb71076f",
    critere_id: "9cc999b6-b0da-48c5-bae7-2b9d38e5f1bd",
    note: 12,
    commentaire: "Un commentaire 3",
    etape_evaluation_id: "3ec9fca0-854f-4e53-9664-53244c40060f",
    auteur_id: "e57fa03f-03f0-4a93-974c-b5107c9c68b1",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
];

const rattachements: referentiel_rattachement[] = [
  {
    code: "POL-75",
    libelle: "Préfecture de police de Paris",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    code: "DEPT-59",
    libelle: "Département Nord",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    code: "REG-75",
    libelle: "Région Île-de-France",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
];

const objectifs: referentiel_objectif[] = [
  {
    id: "4883a4f7-8acc-4310-af42-c3fedece4c69",
    libelle: "Accélérer la publication des appels d'offres",
    descriptif: "Mise en ligne des DCE sous 10 jours après validation.",
    jalon: 1,
    rattachement_code: "POL-75",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    id: "182a28d8-b7f0-473f-94a2-a438bb8cb926",
    libelle: "Suivre hebdomadairement les jalons critiques",
    descriptif: "Rituel hebdo avec tableau de bord partagé.",
    jalon: 2,
    rattachement_code: "POL-75",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    id: "4fbbf458-c00d-400d-888c-30a03844d297",
    libelle: "Déployer clauses d'insertion",
    descriptif: "Atteindre 5% d'heures d'insertion sur chantiers majeurs.",
    jalon: 1,
    rattachement_code: "DEPT-59",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    id: "ea790ca1-3695-4445-a626-44f0c1333c0d",
    libelle: "Réduire les déchets de chantier",
    descriptif: "Plan de valorisation matière à 70%.",
    jalon: 3,
    rattachement_code: "REG-75",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
];

const rattachementsUtilisateur: rattachement_utilisateur_etape_jalon[] = [
  {
    id: "80c0867f-a1e1-4f98-8dc6-7d6db335cb83",
    etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
    jalon: 2025,
    utilisateur_id: "e57fa03f-03f0-4a93-974c-b5107c9c68b1",
    rattachement_code: "POL-75",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    id: "a69048f5-09b2-4ae7-b4d7-cf5136778162",
    etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
    jalon: 2025,
    utilisateur_id: "e57fa03f-03f0-4a93-974c-b5107c9c68b1",
    rattachement_code: "DEPT-59",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    id: "60770452-4210-422a-97f6-dff9e8e92331",
    etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
    jalon: 2025,
    utilisateur_id: "e57fa03f-03f0-4a93-974c-b5107c9c68b1",
    rattachement_code: "DEPT-59",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    id: "ae81df55-e22a-4799-b5be-6e8c61e28a94",
    etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
    jalon: 2025,
    utilisateur_id: "e57fa03f-03f0-4a93-974c-b5107c9c68b1",
    rattachement_code: "REG-75",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    id: "f73c609d-8649-441a-8092-38ddc0cee441",
    etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
    jalon: 2025,
    utilisateur_id: "e57fa03f-03f0-4a93-974c-b5107c9c68b1",
    rattachement_code: "REG-75",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
];

const fichesEvaluation: fiche_evaluation[] = [
  {
    id: "d66e07e2-cabf-41d9-9bf9-75829df8b3ad",
    jalon: 2024,
    etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
    rattachement_code: "REG-75",
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: "3ac2cea5-dbb2-4e54-b5b1-b399a99949dd",
    jalon: 2024,
    etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
    rattachement_code: "DEPT-59",
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: "ff103f90-7911-46b7-8c4c-7bb9a0eea2a4",
    jalon: 2024,
    etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
    rattachement_code: "POL-75",
    created_at: new Date(),
    updated_at: new Date(),
  },
];

const evaluationsObjectifsAutoEvaluation: evaluation_objectif[] = [
  {
    id: "3a6f53ff-8221-4513-96a4-bde397c8aca3",
    objectif_id: "4fbbf458-c00d-400d-888c-30a03844d297",
    etape_evaluation_id: "d6050c26-c872-4134-90d3-c45a8a9dc539",
    auteur_id: "e57fa03f-03f0-4a93-974c-b5107c9c68b1",
    note: 10,
    commentaire: "Un commentaire d'auto evaluation",
    created_at: new Date(),
    updated_at: new Date(),
  },
];

const evaluationsObjectifsConsolidation: evaluation_objectif[] = [
  {
    id: "fc2def49-719d-46c4-8cc8-617954ac68f9",
    objectif_id: "4fbbf458-c00d-400d-888c-30a03844d297",
    etape_evaluation_id: "3ec9fca0-854f-4e53-9664-53244c40060f",
    auteur_id: "e57fa03f-03f0-4a93-974c-b5107c9c68b1",
    note: 10,
    commentaire: "Un commentaire d'auto evaluation",
    created_at: new Date(),
    updated_at: new Date(),
  },
];

const etapesEvaluation: etape_evaluation[] = [
  {
    id: "e868c426-33c3-4d30-94ef-559c28386c28",
    fiche_evaluation_id: fichesEvaluation[0].id,
    type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
    read_only: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: "d6050c26-c872-4134-90d3-c45a8a9dc539",
    fiche_evaluation_id: fichesEvaluation[1].id,
    type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
    read_only: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: "3ec9fca0-854f-4e53-9664-53244c40060f",
    fiche_evaluation_id: fichesEvaluation[1].id,
    type: $Enums.etape_evaluation_enum.CONSOLIDATION,
    read_only: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: "d79f61b7-487e-438e-9662-c9bcdc301897",
    fiche_evaluation_id: fichesEvaluation[2].id,
    type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
    read_only: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
];

async function run() {
  // Clean database
  await prisma.evaluation_objectif.deleteMany({});
  await prisma.evaluation_critere.deleteMany({});
  await prisma.rattachement_utilisateur_etape_jalon.deleteMany({});
  await prisma.etape_evaluation.deleteMany({});
  await prisma.fiche_evaluation.deleteMany({});
  await prisma.objectif.deleteMany({});
  await prisma.referentiel_rattachement.deleteMany({});
  await prisma.referentiel_sous_critere.deleteMany({});
  await prisma.referentiel_critere.deleteMany({});

  // Upsert criteres first
  for (const critere of criteres) {
    await prisma.referentiel_critere.upsert({
      where: { id: critere.id },
      create: critere,
      update: critere,
    });
  }
  // Upsert sous-criteres (depends on criteres)
  for (const sousCritere of sousCriteres) {
    await prisma.referentiel_sous_critere.upsert({
      where: { id: sousCritere.id },
      create: sousCritere,
      update: sousCritere,
    });
  }
  // Upsert rattachements
  for (const rattachement of rattachements) {
    await prisma.referentiel_rattachement.upsert({
      where: { code: rattachement.code },
      create: rattachement,
      update: rattachement,
    });
  }
  // Upsert objectifs (depends on rattachements)
  for (const objectif of objectifs) {
    await prisma.referentiel_objectif.upsert({
      where: { id: objectif.id },
      create: objectif,
      update: objectif,
    });
  }

  for (const ficheEvaluation of fichesEvaluation) {
    await prisma.fiche_evaluation.upsert({
      where: { id: ficheEvaluation.id },
      create: ficheEvaluation,
      update: ficheEvaluation,
    });
  }

  for (const etapeEvaluation of etapesEvaluation) {
    await prisma.etape_evaluation.upsert({
      where: { id: etapeEvaluation.id },
      create: etapeEvaluation,
      update: etapeEvaluation,
    });
  }

  for (const rattachementUtilisateur of rattachementsUtilisateur) {
    await prisma.rattachement_utilisateur_etape_jalon.upsert({
      where: { id: rattachementUtilisateur.id },
      create: rattachementUtilisateur,
      update: rattachementUtilisateur,
    });
  }

  for (const evaluationCritere of [
    ...evaluationsCriteresAutoEvaluation,
    ...evaluationsCriteresConsolidation,
  ]) {
    await prisma.evaluation_critere.upsert({
      where: { id: evaluationCritere.id },
      create: evaluationCritere,
      update: evaluationCritere,
    });
  }

  for (const evaluationObjectif of [
    ...evaluationsObjectifsAutoEvaluation,
    ...evaluationsObjectifsConsolidation,
  ]) {
    await prisma.evaluation_objectif.upsert({
      where: { id: evaluationObjectif.id },
      create: evaluationObjectif,
      update: evaluationObjectif,
    });
  }
}

run();

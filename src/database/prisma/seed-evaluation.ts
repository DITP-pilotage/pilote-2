import {
  referentiel_critere,
  referentiel_sous_critere,
  referentiel_rattachement,
  referentiel_objectif,
  fiche_evaluation,
  etape_evaluation,
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

/* sous critères
id,libelle,descriptif,parent_id,created_at,updated_at
48b2635e-d65f-4197-8e77-5623ad4eb46c,Taux de publication dans les délais,Part des avis publiés dans les délais réglementaires.,831cb1a5-036b-4609-a560-68cd1852397f,2025-10-07T10:00:00,2025-10-07T10:00:00
176bb1a0-1827-4762-9508-1eaaf5e2d1c0,Données ouvertes conformes,Conformité des données aux schémas open data (profil d'acheteur).,831cb1a5-036b-4609-a560-68cd1852397f,2025-10-07T10:00:00,2025-10-07T10:00:00
60b875a6-90fd-4deb-87e4-230c91e8246a,Respect des jalons critiques,Proportion de jalons respectés à ±10 jours.,dedffbcf-97dc-40c9-9df4-a5be78617ba6,2025-10-07T10:00:00,2025-10-07T10:00:00
1da91469-c6f2-46f5-b8fd-81942ef7e7db,Plan d'actions sur retards,Existence et suivi d'un plan d'actions correctives.,dedffbcf-97dc-40c9-9df4-a5be78617ba6,2025-10-07T10:00:00,2025-10-07T10:00:00
92ca5b55-ae9f-4809-abdf-111732ab9772,Insertion locale,Part des heures réservées à l'insertion socio-professionnelle.,9cc999b6-b0da-48c5-bae7-2b9d38e5f1bd,2025-10-07T10:00:00,2025-10-07T10:00:00
4969b17c-965b-4d01-9546-31a46ceda590,Clauses environnementales,Présence d'objectifs de réduction des déchets et d'émissions.,9cc999b6-b0da-48c5-bae7-2b9d38e5f1bd,2025-10-07T10:00:00,2025-10-07T10:00:00

 */

/* rattachements
code,libelle,created_at,updated_at
PREF-75,Préfecture de Paris (Département 75),2025-10-07T10:00:00,2025-10-07T10:00:00
DEPT-59,Préfecture du Nord (Département 59),2025-10-07T10:00:00,2025-10-07T10:00:00
REG-75,Région Île-de-France,2025-10-07T10:00:00,2025-10-07T10:00:00

 */

const rattachements: referentiel_rattachement[] = [
  {
    code: "PREF-75",
    libelle: "Préfecture de Paris (Département 75)",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    code: "DEPT-59",
    libelle: "Préfecture du Nord (Département 59)",
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

/* objectifs
id,libelle,descriptif,jalon,rattachement_code,created_at,updated_at
4883a4f7-8acc-4310-af42-c3fedece4c69,Accélérer la publication des appels d'offres,Mise en ligne des DCE sous 10 jours après validation.,1,PREF-75,2025-10-07T10:00:00,2025-10-07T10:00:00
182a28d8-b7f0-473f-94a2-a438bb8cb926,Suivre hebdomadairement les jalons critiques,Rituel hebdo avec tableau de bord partagé.,2,PREF-75,2025-10-07T10:00:00,2025-10-07T10:00:00
4fbbf458-c00d-400d-888c-30a03844d297,Déployer clauses d'insertion,Atteindre 5% d'heures d'insertion sur chantiers majeurs.,1,DEPT-59,2025-10-07T10:00:00,2025-10-07T10:00:00
ea790ca1-3695-4445-a626-44f0c1333c0d,Réduire les déchets de chantier,Plan de valorisation matière à 70%.,3,REG-75,2025-10-07T10:00:00,2025-10-07T10:00:00

 */

const objectifs: referentiel_objectif[] = [
  {
    id: "4883a4f7-8acc-4310-af42-c3fedece4c69",
    libelle: "Accélérer la publication des appels d'offres",
    descriptif: "Mise en ligne des DCE sous 10 jours après validation.",
    jalon: 1,
    rattachement_code: "PREF-75",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    id: "182a28d8-b7f0-473f-94a2-a438bb8cb926",
    libelle: "Suivre hebdomadairement les jalons critiques",
    descriptif: "Rituel hebdo avec tableau de bord partagé.",
    jalon: 2,
    rattachement_code: "PREF-75",
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

async function run() {
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

  const ficheEvaluation: fiche_evaluation = {
    id: "d66e07e2-cabf-41d9-9bf9-75829df8b3ad",
    jalon: 2024,
    etape_courante: "AUTO_EVALUATION",
    rattachement_code: "REG-75",
    created_at: new Date(),
    updated_at: new Date(),
  };
  await prisma.fiche_evaluation.upsert({
    where: { id: ficheEvaluation.id },
    create: ficheEvaluation,
    update: ficheEvaluation,
  });

  const etapeEvaluation: etape_evaluation = {
    id: "e868c426-33c3-4d30-94ef-559c28386c28",
    fiche_evaluation_id: ficheEvaluation.id,
    type: "AUTO_EVALUATION",
    created_at: new Date(),
    updated_at: new Date(),
  };
  await prisma.etape_evaluation.upsert({
    where: { id: etapeEvaluation.id },
    create: etapeEvaluation,
    update: etapeEvaluation,
  });
}

run();

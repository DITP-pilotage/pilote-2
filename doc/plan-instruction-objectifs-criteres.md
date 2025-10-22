# Plan d'implémentation : Instruire les objectifs et critères (PIL-926)

## Contexte initial

Nous allons créer un nouveau plan pour notre nouvelle fonctionnalité "Instruire les objectifs et critères"

Etape 1

Pour cela, nous allons créé plusieurs nouvelles tables en base de données via le `src/database/prisma/schema.prisma`

1/ referentiel_tutelle, avec comme colonne id, nom, ca sera des uuid comme fait souvent dans nos tables

2/ ajouter une foreign key dans referentiel_objectif pour referentiel_tutelle, la foreign key peut être null dans le cas où y'a pas de tutelle associée

3/ instruction_objectif, avec comme colonne : id, objectif_id (associant à referentiel_objectif), rattachement_utilisateur_etape_jalon_id (associant à rattachement_utilisateur_etape_jalon)

4/ instruction_critere, similaire à instruction_objectif, sauf que le lien referentiel_objectif est remplacé par referentiel_critere

On créera la migration après par nous même

Une fois fais, on va compléter le `src/database/prisma/seed-evaluation.ts` pour ajouter des lignes aux tables d'instructions en se basant sur les critères et objectifs déjà présent dedans. Pour cela, on créera un nouveau rattachement_utilisateur_etape_jalon qui aura comme étape INSTRUCTION, et on associera les nouvelles instructions a cette nouvelle ligne de rattachement.

Etape 2

Nous allons créer une nouvelle page instructions.tsx.

On créera un nouveau pour la réaliser la partie affichage de cette page, qui ressemblera beaucoup à consolidation. Pour cette étape là, nous allons nous concentrer sur la query.

On va commencer par créer les tests de récupérations des données d'instructions.

On souhaite que pour un utilisateurId récupéré via la session, récupérer, les fiches associées a ses rattachement_utilisateur_etape_jalon en etape INSTRUCTION, ainsi que les evaluations d'auto-evaluation, consolidation et instruction des objectifs et criteres associés à la fiche, mais uniquement filtré par ceux dont l'utilisateur possède l'accès, c'est a dire, ceux qui sont présent dans les tables respectives instruction_objectif et instruction critere.

Ensuite, tu pourras faire le code associé, je m'occuperais de lancer les tests et vérifier qu'ils sont bien rouge.

Ensuite, tu connais la rangaine, il faudra ajouter au container awilix, puis on l'affichera dans le get server side props

Etape 3 Affichage de l'instruction

Pour cette étape, on la completera après l'étape 1 et 2 car on va essayer d'utiliser le même tableau que TableauConsolidation pour éviter la duplication de code. Mais pour commencer, tu peux mettre en place le concept qu'on retrouve dans consolidation.tsx concernant la mise en place du context liant les props du get server side props au context react afin qu'on puisse les utiliser après dans l'affichage.

---

## Plan d'implémentation détaillé

### Étape 1 : Modifications de la base de données

#### 1.1 Modifications du schema Prisma

**Fichier**: `src/database/prisma/schema.prisma`

Ajouter les nouveaux modèles suivants :

```prisma
model referentiel_tutelle {
  id                   String                 @id @db.Uuid
  nom                  String
  created_at           DateTime               @default(now())
  updated_at           DateTime               @updatedAt
  objectifs            referentiel_objectif[]

  @@schema("public")
}

model instruction_objectif {
  id                                   String                               @id @db.Uuid
  objectif_id                          String                               @db.Uuid
  objectif                             referentiel_objectif                 @relation(fields: [objectif_id], references: [id], onDelete: Cascade, onUpdate: Cascade)
  rattachement_utilisateur_etape_jalon_id String                            @db.Uuid
  rattachement_utilisateur_etape_jalon rattachement_utilisateur_etape_jalon @relation(fields: [rattachement_utilisateur_etape_jalon_id], references: [id], onDelete: Cascade, onUpdate: Cascade)
  created_at                           DateTime                             @default(now())
  updated_at                           DateTime                             @updatedAt

  @@unique([objectif_id, rattachement_utilisateur_etape_jalon_id])
  @@schema("public")
}

model instruction_critere {
  id                                   String                               @id @db.Uuid
  critere_id                           String                               @db.Uuid
  critere                              referentiel_critere                  @relation(fields: [critere_id], references: [id], onDelete: Cascade, onUpdate: Cascade)
  rattachement_utilisateur_etape_jalon_id String                            @db.Uuid
  rattachement_utilisateur_etape_jalon rattachement_utilisateur_etape_jalon @relation(fields: [rattachement_utilisateur_etape_jalon_id], references: [id], onDelete: Cascade, onUpdate: Cascade)
  created_at                           DateTime                             @default(now())
  updated_at                           DateTime                             @updatedAt

  @@unique([critere_id, rattachement_utilisateur_etape_jalon_id])
  @@schema("public")
}
```

Modifier le modèle `referentiel_objectif` pour ajouter la relation avec tutelle :

```prisma
model referentiel_objectif {
  // ... colonnes existantes ...
  tutelle_id              String?                    @db.Uuid
  tutelle                 referentiel_tutelle?       @relation(fields: [tutelle_id], references: [id], onDelete: SetNull, onUpdate: Cascade)
  instructions            instruction_objectif[]
  // ... autres relations existantes ...
}
```

Modifier le modèle `referentiel_critere` pour ajouter la relation avec instructions :

```prisma
model referentiel_critere {
  // ... colonnes existantes ...
  instructions            instruction_critere[]
  // ... autres relations existantes ...
}
```

Modifier le modèle `rattachement_utilisateur_etape_jalon` pour ajouter les relations :

```prisma
model rattachement_utilisateur_etape_jalon {
  // ... colonnes existantes ...
  instruction_objectifs   instruction_objectif[]
  instruction_criteres    instruction_critere[]
  // ... autres relations existantes ...
}
```

#### 1.2 Mise à jour du seed

**Fichier**: `src/database/prisma/seed-evaluation.ts`

Ajouter les données suivantes :

```typescript
// Tutelles
const tutelles: referentiel_tutelle[] = [
  {
    id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    nom: "Direction Interministérielle du Numérique (DINUM)",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
    nom: "Direction Générale de l'Administration et de la Fonction Publique (DGAFP)",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
];

// Rattachements utilisateurs pour l'étape INSTRUCTION
const rattachementsUtilisateurInstruction: rattachement_utilisateur_etape_jalon[] = [
  {
    id: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
    etape: $Enums.etape_evaluation_enum.INSTRUCTION,
    jalon: 2025,
    utilisateur_id: "e57fa03f-03f0-4a93-974c-b5107c9c68b1",
    rattachement_code: "POL-75",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    id: "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
    etape: $Enums.etape_evaluation_enum.INSTRUCTION,
    jalon: 2025,
    utilisateur_id: "e57fa03f-03f0-4a93-974c-b5107c9c68b1",
    rattachement_code: "DEPT-59",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    id: "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b",
    etape: $Enums.etape_evaluation_enum.INSTRUCTION,
    jalon: 2025,
    utilisateur_id: "e57fa03f-03f0-4a93-974c-b5107c9c68b1",
    rattachement_code: "REG-75",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
];

// Instructions objectifs
const instructionsObjectifs: instruction_objectif[] = [
  {
    id: "f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c",
    objectif_id: "4883a4f7-8acc-4310-af42-c3fedece4c69", // "Accélérer la publication des appels d'offres"
    rattachement_utilisateur_etape_jalon_id: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    id: "a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d",
    objectif_id: "182a28d8-b7f0-473f-94a2-a438bb8cb926", // "Suivre hebdomadairement les jalons critiques"
    rattachement_utilisateur_etape_jalon_id: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    id: "b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e",
    objectif_id: "4fbbf458-c00d-400d-888c-30a03844d297", // "Déployer clauses d'insertion"
    rattachement_utilisateur_etape_jalon_id: "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
];

// Instructions critères
const instructionsCriteres: instruction_critere[] = [
  {
    id: "c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f",
    critere_id: "831cb1a5-036b-4609-a560-68cd1852397f", // "Transparence des marchés publics"
    rattachement_utilisateur_etape_jalon_id: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    id: "d0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a",
    critere_id: "dedffbcf-97dc-40c9-9df4-a5be78617ba6", // "Délais d'exécution des chantiers"
    rattachement_utilisateur_etape_jalon_id: "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
  {
    id: "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
    critere_id: "9cc999b6-b0da-48c5-bae7-2b9d38e5f1bd", // "Impact territorial et environnemental"
    rattachement_utilisateur_etape_jalon_id: "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
];

// Évaluations d'instruction pour objectifs
const evaluationsObjectifsInstruction: evaluation_objectif[] = [
  {
    id: "f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c",
    objectif_id: "4fbbf458-c00d-400d-888c-30a03844d297",
    etape_evaluation_id: "INSTRUCTION_ETAPE_ID", // À créer avec les étapes d'évaluation
    auteur_id: "e57fa03f-03f0-4a93-974c-b5107c9c68b1",
    note: 15,
    commentaire: "Un commentaire d'instruction pour objectif",
    created_at: new Date(),
    updated_at: new Date(),
  },
];

// Évaluations d'instruction pour critères
const evaluationsCriteresInstruction: evaluation_critere[] = [
  {
    id: "a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d",
    critere_id: "831cb1a5-036b-4609-a560-68cd1852397f",
    note: 14,
    commentaire: "Un commentaire d'instruction pour critère 1",
    etape_evaluation_id: "INSTRUCTION_ETAPE_ID", // À créer avec les étapes d'évaluation
    auteur_id: "e57fa03f-03f0-4a93-974c-b5107c9c68b1",
    created_at: new Date("2025-10-07T10:00:00"),
    updated_at: new Date("2025-10-07T10:00:00"),
  },
];
```

Modifier la fonction `run()` pour inclure le seeding des nouvelles tables :

```typescript
async function run() {
  // Clean database (ajouter les nouvelles tables)
  await prisma.instruction_objectif.deleteMany({});
  await prisma.instruction_critere.deleteMany({});
  await prisma.evaluation_objectif.deleteMany({});
  await prisma.evaluation_critere.deleteMany({});
  await prisma.rattachement_utilisateur_etape_jalon.deleteMany({});
  await prisma.etape_evaluation.deleteMany({});
  await prisma.fiche_evaluation.deleteMany({});
  await prisma.objectif.deleteMany({});
  await prisma.referentiel_objectif.deleteMany({});
  await prisma.referentiel_rattachement.deleteMany({});
  await prisma.referentiel_sous_critere.deleteMany({});
  await prisma.referentiel_critere.deleteMany({});
  await prisma.referentiel_tutelle.deleteMany({});

  // Upsert tutelles
  for (const tutelle of tutelles) {
    await prisma.referentiel_tutelle.upsert({
      where: { id: tutelle.id },
      create: tutelle,
      update: tutelle,
    });
  }

  // ... (code existant pour critères, rattachements, objectifs, etc.)

  // Upsert rattachements utilisateur instruction
  for (const rattachementUtilisateur of [
    ...rattachementsUtilisateur,
    ...rattachementsUtilisateurInstruction,
  ]) {
    await prisma.rattachement_utilisateur_etape_jalon.upsert({
      where: { id: rattachementUtilisateur.id },
      create: rattachementUtilisateur,
      update: rattachementUtilisateur,
    });
  }

  // ... (code existant pour fiches et étapes d'évaluation)

  // Upsert instructions objectifs
  for (const instructionObjectif of instructionsObjectifs) {
    await prisma.instruction_objectif.upsert({
      where: { id: instructionObjectif.id },
      create: instructionObjectif,
      update: instructionObjectif,
    });
  }

  // Upsert instructions critères
  for (const instructionCritere of instructionsCriteres) {
    await prisma.instruction_critere.upsert({
      where: { id: instructionCritere.id },
      create: instructionCritere,
      update: instructionCritere,
    });
  }

  // ... (code existant pour évaluations, en ajoutant les évaluations d'instruction)
}
```

**Note**: La migration Prisma sera créée manuellement après ces modifications.

---

### Étape 2 : Création de la query de récupération des données d'instruction

#### 2.1 Tests de la query

**Fichier**: `src/server/fiche-instruction/usecases/AfficherInstruction.query.test.ts` (nouveau fichier)

Les tests devront créer manuellement les données nécessaires dans le `Given` de chaque test (pas d'utilisation de fichiers de seed).

Structure des tests à implémenter :

```typescript
describe("AfficherInstructionQuery", () => {
  describe("récupère les fiches associées aux rattachements INSTRUCTION de l'utilisateur", () => {
    // Créer manuellement : utilisateur, rattachement INSTRUCTION, fiche_evaluation
    // Vérifier que les fiches retournées correspondent bien aux rattachements INSTRUCTION
  });

  describe("filtre les objectifs selon les instruction_objectif de l'utilisateur", () => {
    // Créer : utilisateur, rattachement INSTRUCTION, objectifs, instruction_objectif
    // Vérifier que seuls les objectifs présents dans instruction_objectif sont retournés
  });

  describe("filtre les critères selon les instruction_critere de l'utilisateur", () => {
    // Créer : utilisateur, rattachement INSTRUCTION, critères, instruction_critere
    // Vérifier que seuls les critères présents dans instruction_critere sont retournés
  });

  describe("récupère les évaluations AUTO_EVALUATION, CONSOLIDATION et INSTRUCTION pour les objectifs", () => {
    // Créer : fiche avec les 3 étapes d'évaluation, objectifs, évaluations pour chaque étape
    // Vérifier que les 3 types d'évaluations sont bien récupérés
  });

  describe("récupère les évaluations AUTO_EVALUATION, CONSOLIDATION et INSTRUCTION pour les critères", () => {
    // Créer : fiche avec les 3 étapes d'évaluation, critères, évaluations pour chaque étape
    // Vérifier que les 3 types d'évaluations sont bien récupérés
  });

  describe("retourne un tableau vide si l'utilisateur n'a aucun rattachement INSTRUCTION", () => {
    // Créer : utilisateur sans rattachement INSTRUCTION
    // Vérifier que fiches est un tableau vide
  });

  describe("récupère la tutelle associée à un objectif si elle existe", () => {
    // Créer : objectif avec tutelle, objectif sans tutelle
    // Vérifier que la tutelle est présente quand elle existe, null sinon
  });
});
```

**Note** : L'implémentation détaillée des tests sera réalisée lors de l'étape 2.

#### 2.2 Implémentation de la query

**Fichier**: `src/server/fiche-instruction/usecases/AfficherInstruction.query.ts` (nouveau fichier)

```typescript
import { $Enums } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

export interface AfficherInstructionQueryInput {
  utilisateurId: string;
}

export interface EvaluationObjectif {
  id: string;
  note: number | null;
  commentaire: string;
  etape: $Enums.etape_evaluation_enum;
  auteur: {
    nom: string;
    prenom: string;
  };
}

export interface EvaluationCritere {
  id: string;
  note: number | null;
  commentaire: string;
  etape: $Enums.etape_evaluation_enum;
  auteur: {
    nom: string;
    prenom: string;
  };
}

export interface ObjectifInstruction {
  id: string;
  libelle: string;
  descriptif: string;
  jalon: number;
  tutelle: {
    id: string;
    nom: string;
  } | null;
  evaluations: EvaluationObjectif[];
}

export interface CritereInstruction {
  id: string;
  libelle: string;
  descriptif: string;
  sous_criteres: {
    id: string;
    libelle: string;
    descriptif: string;
  }[];
  evaluations: EvaluationCritere[];
}

export interface FicheInstruction {
  id: string;
  jalon: number;
  rattachement_code: string;
  rattachement_libelle: string;
  objectifs: ObjectifInstruction[];
  criteres: CritereInstruction[];
}

export interface AfficherInstructionQueryOutput {
  fiches: FicheInstruction[];
}

export class AfficherInstructionQuery {
  async run({
    utilisateurId,
  }: AfficherInstructionQueryInput): Promise<AfficherInstructionQueryOutput> {
    // Récupérer les rattachements INSTRUCTION de l'utilisateur
    const rattachementsInstruction =
      await prisma.rattachement_utilisateur_etape_jalon.findMany({
        where: {
          utilisateur_id: utilisateurId,
          etape: $Enums.etape_evaluation_enum.INSTRUCTION,
        },
        include: {
          rattachement: true,
          instruction_objectifs: {
            include: {
              objectif: {
                include: {
                  tutelle: true,
                  evaluations: {
                    include: {
                      auteur: {
                        select: {
                          nom: true,
                          prenom: true,
                        },
                      },
                      etape_evaluation: {
                        select: {
                          type: true,
                          fiche_evaluation_id: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          instruction_criteres: {
            include: {
              critere: {
                include: {
                  sous_criteres: true,
                  evaluations_criteres: {
                    include: {
                      auteur: {
                        select: {
                          nom: true,
                          prenom: true,
                        },
                      },
                      etape_evaluation: {
                        select: {
                          type: true,
                          fiche_evaluation_id: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

    // Grouper par fiche (rattachement_code + jalon)
    const fichesMap = new Map<string, FicheInstruction>();

    for (const rattachement of rattachementsInstruction) {
      const ficheKey = `${rattachement.rattachement_code}-${rattachement.jalon}`;

      if (!fichesMap.has(ficheKey)) {
        // Récupérer la fiche d'évaluation correspondante
        const ficheEvaluation = await prisma.fiche_evaluation.findUnique({
          where: {
            rattachement_code_jalon: {
              rattachement_code: rattachement.rattachement_code,
              jalon: rattachement.jalon,
            },
          },
          include: {
            etape_evaluations: true,
          },
        });

        fichesMap.set(ficheKey, {
          id: ficheEvaluation?.id || "",
          jalon: rattachement.jalon,
          rattachement_code: rattachement.rattachement_code,
          rattachement_libelle: rattachement.rattachement.libelle,
          objectifs: [],
          criteres: [],
        });
      }

      const fiche = fichesMap.get(ficheKey)!;

      // Ajouter les objectifs filtrés
      for (const instructionObjectif of rattachement.instruction_objectifs) {
        const objectif = instructionObjectif.objectif;

        // Filtrer les évaluations pour cette fiche
        const evaluations = objectif.evaluations
          .filter(
            (evaluation) =>
              evaluation.etape_evaluation.fiche_evaluation_id === fiche.id
          )
          .map((evaluation) => ({
            id: evaluation.id,
            note: evaluation.note,
            commentaire: evaluation.commentaire,
            etape: evaluation.etape_evaluation.type,
            auteur: {
              nom: evaluation.auteur.nom,
              prenom: evaluation.auteur.prenom,
            },
          }));

        fiche.objectifs.push({
          id: objectif.id,
          libelle: objectif.libelle,
          descriptif: objectif.descriptif,
          jalon: objectif.jalon,
          tutelle: objectif.tutelle
            ? {
                id: objectif.tutelle.id,
                nom: objectif.tutelle.nom,
              }
            : null,
          evaluations,
        });
      }

      // Ajouter les critères filtrés
      for (const instructionCritere of rattachement.instruction_criteres) {
        const critere = instructionCritere.critere;

        // Filtrer les évaluations pour cette fiche
        const evaluations = critere.evaluations_criteres
          .filter(
            (evaluation) =>
              evaluation.etape_evaluation.fiche_evaluation_id === fiche.id
          )
          .map((evaluation) => ({
            id: evaluation.id,
            note: evaluation.note,
            commentaire: evaluation.commentaire,
            etape: evaluation.etape_evaluation.type,
            auteur: {
              nom: evaluation.auteur.nom,
              prenom: evaluation.auteur.prenom,
            },
          }));

        fiche.criteres.push({
          id: critere.id,
          libelle: critere.libelle,
          descriptif: critere.descriptif,
          sous_criteres: critere.sous_criteres.map((sc) => ({
            id: sc.id,
            libelle: sc.libelle,
            descriptif: sc.descriptif,
          })),
          evaluations,
        });
      }
    }

    return {
      fiches: Array.from(fichesMap.values()),
    };
  }
}
```

#### 2.3 Ajout au container Awilix

**Fichier**: `src/server/dependances/piloteEval.ts`

```typescript
import { asClass } from "awilix";
import { AfficherInstructionQuery } from "@/server/fiche-instruction/usecases/AfficherInstruction.query";

// ... autres imports ...

export const piloteEvalContainer = {
  // ... autres dépendances ...

  // Queries
  afficherConsolidationQuery: asClass(AfficherConsolidationQuery),
  afficherInstructionQuery: asClass(AfficherInstructionQuery), // NOUVEAU

  // ... autres dépendances ...
};
```

#### 2.4 Création de la page instruction.tsx

**Fichier**: `src/pages/evaluation/instruction.tsx` (nouveau fichier)

```typescript
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import { $Enums } from "@prisma/client";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";
import { pageInstruction } from "@/components/PageInstruction/PageInstructionServerSideContext";
import { FormulaireInstruction } from "@/components/PageInstruction/FormulaireInstruction";
import { configurationFeatureFlip } from "@/config";

export const getServerSideProps = async ({
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await getServerSession(req, res, authOptions);
  assert(session);

  const featureFlipping = configurationFeatureFlip();

  const peutAccederEtapeInstruction = await getContainer("piloteEval")
    .resolve("accesFicheEvaluationService")
    .peutAccederEtapeInstruction({
      utilisateurId: session.user.id,
    });

  if (
    !featureFlipping.piloteEval ||
    !session.applicationsAccessibles.includes(
      $Enums.application_accessible.PILOTE_EVAL,
    ) ||
    !peutAccederEtapeInstruction
  ) {
    return {
      redirect: {
        destination: "/404",
      },
    };
  }

  return {
    props: await getContainer("piloteEval")
      .resolve("afficherInstructionQuery")
      .run({ utilisateurId: session.user.id }),
  };
};

export default function PageInstruction(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  return (
    <div className="mx-auto w-full max-w-[1200px] py-6">
      <pageInstruction.ServerSidePropsProvider value={props}>
        <FormulaireInstruction />
      </pageInstruction.ServerSidePropsProvider>
    </div>
  );
}
```

---

### Étape 3 : Affichage de l'instruction

#### 3.1 Création du context React

**Fichier**: `src/components/PageInstruction/PageInstructionServerSideContext.tsx` (nouveau fichier)

```typescript
import { createServerSidePropsContext } from "@/client/utils/createServerSidePropsContext";
import { AfficherInstructionQueryOutput } from "@/server/fiche-instruction/usecases/AfficherInstruction.query";

export const pageInstruction =
  createServerSidePropsContext<AfficherInstructionQueryOutput>();
```

#### 3.2 Création du composant FormulaireInstruction (squelette)

**Fichier**: `src/components/PageInstruction/FormulaireInstruction.tsx` (nouveau fichier)

```typescript
import { pageInstruction } from "./PageInstructionServerSideContext";

export function FormulaireInstruction() {
  const { fiches } = pageInstruction.useServerSideProps();

  return (
    <div>
      <h1 className="fr-h1">Instruction des objectifs et critères</h1>

      {fiches.length === 0 ? (
        <p>Aucune fiche d'instruction disponible.</p>
      ) : (
        <div>
          {fiches.map((fiche) => (
            <div key={fiche.id} className="fr-card fr-mb-4w">
              <div className="fr-card__body">
                <h2 className="fr-h3">
                  {fiche.rattachement_libelle} - Jalon {fiche.jalon}
                </h2>

                {/* TODO: Réutiliser TableauConsolidation ici */}
                <p>Objectifs: {fiche.objectifs.length}</p>
                <p>Critères: {fiche.criteres.length}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Note**: Cette étape sera complétée après les étapes 1 et 2, en réutilisant le composant `TableauConsolidation` pour éviter la duplication de code.

---

## Tâches à réaliser

### Étape 1 : Base de données
- [ ] Modifier `schema.prisma` pour ajouter les 4 nouveaux modèles
- [ ] Créer la migration Prisma (manuellement)
- [ ] Mettre à jour `seed-evaluation.ts` avec les nouvelles données
- [ ] Exécuter le seed pour vérifier que tout fonctionne

### Étape 2 : Query et page
- [ ] Créer les tests dans `AfficherInstruction.query.test.ts`
- [ ] Implémenter `AfficherInstruction.query.ts`
- [ ] Vérifier que les tests sont au rouge (avant implémentation)
- [ ] Vérifier que les tests passent au vert (après implémentation)
- [ ] Ajouter la query au container Awilix
- [ ] Créer le service `peutAccederEtapeInstruction` dans `accesFicheEvaluationService`
- [ ] Créer la page `instruction.tsx` avec `getServerSideProps`

### Étape 3 : Affichage
- [ ] Créer le context React `PageInstructionServerSideContext`
- [ ] Créer le composant squelette `FormulaireInstruction`
- [ ] Analyser `TableauConsolidation` pour identifier les parties réutilisables
- [ ] Adapter `TableauConsolidation` pour supporter l'étape INSTRUCTION
- [ ] Intégrer le tableau dans `FormulaireInstruction`
- [ ] Tests end-to-end de l'affichage

---

## Notes techniques

### Relations importantes
- `referentiel_tutelle` → `referentiel_objectif` (1-n, nullable)
- `instruction_objectif` → `referentiel_objectif` + `rattachement_utilisateur_etape_jalon`
- `instruction_critere` → `referentiel_critere` + `rattachement_utilisateur_etape_jalon`

### Contraintes d'unicité
- `instruction_objectif`: combinaison unique `(objectif_id, rattachement_utilisateur_etape_jalon_id)`
- `instruction_critere`: combinaison unique `(critere_id, rattachement_utilisateur_etape_jalon_id)`

### Permissions
L'accès à la page d'instruction requiert:
1. Feature flip `piloteEval` activé
2. Application `PILOTE_EVAL_PILOTAGE` accessible par l'utilisateur
3. Au moins un rattachement avec étape `INSTRUCTION` pour l'utilisateur

### Réutilisation de code
Le composant `TableauConsolidation` devra être adapté pour supporter:
- L'affichage des 3 types d'évaluations (auto-évaluation, consolidation, instruction)
- Le filtrage selon les tables `instruction_objectif` et `instruction_critere`
- La possibilité d'avoir une tutelle associée aux objectifs (affichage conditionnel)

import { $Enums } from "@prisma/client";
import { AfficherInstructionQuery } from "@/server/evaluation/queries/AfficherInstructionQuery";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";

describe("AfficherInstructionQuery", () => {
  let query: AfficherInstructionQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new AfficherInstructionQuery({ prisma: prismaPilote });
  });

  describe("#execute", () => {
    it("doit retourner un tableau vide quand l'utilisateur n'a pas d'accès INSTRUCTION", async () => {
      // Given
      const utilisateurId = "403a68eb-af5a-4c8c-a51b-6a7b949e1be2";
      const rattachementCode = "REG-TEST-01";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "no-instruction-access@example.com",
          nom: "No Instruction",
          prenom: "User",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement sans accès instruction",
        },
      });

      // When
      const result = await query.execute({ utilisateurId });

      // Then
      expect(result.rattachements).toEqual([]);
    });

    it("doit filtrer les objectifs selon les instruction_objectif de l'utilisateur", async () => {
      // Given
      const rattachementCode = "REG-TEST-02";
      const utilisateurId = "27973813-ad8f-4a76-acc5-2fcabcc09529";
      const ficheEvaluationId = "c274a257-7993-4595-901c-079c78a62de3";
      const etapeAutoEvaluationId = "d1b89cab-72ab-4b4d-bfdb-9d9677fcf3cf";
      const etapeConsolidationId = "606fcac0-2cb1-496a-8414-443b67e5dee1";
      const etapeInstructionId = "52128c56-6ec6-47d9-8123-4f969bd7775b";
      const objectif1Id = "b481aceb-8194-49c8-a53e-d7cb9986e953";
      const objectif2Id = "e6f4a278-fd0c-49fd-b3c6-05c84c9a6f43";
      const rattachementUtilisateurId = "41c6bf29-e07c-40cc-be1f-e2a5c7746721";
      const instructionObjectif1Id = "674beecd-1dc2-4992-aee2-693e661d3dfb";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "instruction-objectifs@example.com",
          nom: "Instruction",
          prenom: "Objectifs",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement avec objectifs filtrés",
          objectifs: {
            create: [
              {
                id: objectif1Id,
                libelle: "Objectif à instruire",
                descriptif: "Description objectif 1",
                jalon: 2025,
                indicateur_cible: "Atteindre 90% de conformité",
              },
              {
                id: objectif2Id,
                libelle: "Objectif non à instruire",
                descriptif: "Description objectif 2",
                jalon: 2025,
                indicateur_cible: "5 nouveaux partenariats",
              },
            ],
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "INSTRUCTION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: [
              {
                id: etapeAutoEvaluationId,
                type: "AUTO_EVALUATION",
              },
              {
                id: etapeConsolidationId,
                type: "CONSOLIDATION",
              },
              {
                id: etapeInstructionId,
                type: "INSTRUCTION",
              },
            ],
          },
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: rattachementUtilisateurId,
          rattachement_code: rattachementCode,
          utilisateur_id: utilisateurId,
          etape: "INSTRUCTION",
          jalon: 2025,
        },
      });

      await prisma.instruction_objectif.create({
        data: {
          id: instructionObjectif1Id,
          objectif_id: objectif1Id,
          rattachement_utilisateur_etape_jalon_id: rattachementUtilisateurId,
        },
      });

      // When
      const result = await query.execute({ utilisateurId });

      // Then
      expect(result.rattachements).toHaveLength(1);
      expect(result.rattachements[0].objectifs).toHaveLength(1);
      expect(result.rattachements[0].objectifs[0].id).toBe(objectif1Id);
    });

    it("doit filtrer les critères selon les instruction_critere de l'utilisateur", async () => {
      // Given
      const rattachementCode = "REG-TEST-03";
      const utilisateurId = "541326f8-950d-4a2f-a29f-c8a0c85022fc";
      const ficheEvaluationId = "47a83c5d-9132-4492-b296-4d8b3aa23c56";
      const etapeAutoEvaluationId = "ff36f33f-0774-4368-86c7-8cbd2274156c";
      const etapeConsolidationId = "9b2b5dbf-f10c-4272-ace1-74cd0856549d";
      const etapeInstructionId = "63616d2f-7244-4a11-90a0-733a2370a1ab";
      const critere1Id = "1f1f40d0-5149-4993-abca-8ffc0966551e";
      const critere2Id = "cc054010-dee2-479a-838a-5c7290a9aac7";
      const sousCritere1Id = "dbdd0871-d851-4dcc-b670-2f2fd202614c";
      const sousCritere2Id = "ed9be696-eadb-43e9-a6a1-b4eff1791493";
      const rattachementUtilisateurId = "e2fd3c47-39d3-47b1-992f-43e94edc8e93";
      const instructionCritere1Id = "e05aa43d-0a08-4585-bb6a-fcae17369732";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "instruction-criteres@example.com",
          nom: "Instruction",
          prenom: "Critères",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critere1Id,
          libelle: "Critère à instruire",
          descriptif: "Description critère 1",
          type: "COMMUNICATION",
          sous_criteres: {
            create: {
              id: sousCritere1Id,
              libelle: "Sous-critère 1",
              descriptif: "Description sous-critère 1",
            },
          },
        },
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critere2Id,
          libelle: "Critère non à instruire",
          descriptif: "Description critère 2",
          type: "SERVICES_PUBLICS",
          sous_criteres: {
            create: {
              id: sousCritere2Id,
              libelle: "Sous-critère 2",
              descriptif: "Description sous-critère 2",
            },
          },
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement avec critères filtrés",
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "INSTRUCTION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: [
              {
                id: etapeAutoEvaluationId,
                type: "AUTO_EVALUATION",
              },
              {
                id: etapeConsolidationId,
                type: "CONSOLIDATION",
              },
              {
                id: etapeInstructionId,
                type: "INSTRUCTION",
              },
            ],
          },
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: rattachementUtilisateurId,
          rattachement_code: rattachementCode,
          utilisateur_id: utilisateurId,
          etape: "INSTRUCTION",
          jalon: 2025,
        },
      });

      await prisma.instruction_critere.create({
        data: {
          id: instructionCritere1Id,
          critere_id: critere1Id,
          rattachement_utilisateur_etape_jalon_id: rattachementUtilisateurId,
        },
      });

      // When
      const result = await query.execute({ utilisateurId });

      // Then
      expect(result.rattachements).toHaveLength(1);
      expect(result.rattachements[0].criteres).toHaveLength(1);
      expect(result.rattachements[0].criteres[0].id).toBe(critere1Id);
      expect(result.criteres).toHaveLength(1);
      expect(result.criteres[0]).toEqual({
        id: critere1Id,
        libelle: "Critère à instruire",
        descriptif: "Description critère 1",
        type: "COMMUNICATION",
        sousCriteres: [
          {
            id: sousCritere1Id,
            libelle: "Sous-critère 1",
            descriptif: "Description sous-critère 1",
          },
        ],
      });
    });

    it("doit récupérer les évaluations CONSOLIDATION et INSTRUCTION pour les objectifs", async () => {
      // Given
      const rattachementCode = "REG-TEST-04";
      const utilisateurId = "d5cff9fd-fd0a-4287-8a38-5efbd7300336";
      const utilisateurAutoId = "047b4af8-566c-45fe-a8a2-e2f09414cc19";
      const utilisateurConsoId = "0bfcff26-7d9c-40bd-af60-be04cca1ddc5";
      const ficheEvaluationId = "348a2a02-68eb-4ac3-be18-efcfda9f0312";
      const etapeAutoEvaluationId = "6f2921fa-c55b-4254-8c3e-dccabed78e7b";
      const etapeConsolidationId = "d71f0a0e-a20c-4f6f-8a32-c97e18aa61e5";
      const etapeInstructionId = "f2c1fd36-944b-4514-b8ac-76e317c0f6e3";
      const objectifId = "ec671dbd-7111-47a6-939a-ea80b8d385cb";
      const rattachementUtilisateurId = "14e196ab-c593-4aba-8441-659542de2ab8";
      const instructionObjectifId = "e81004ad-5b8a-4069-9676-6f9cb6e419a6";
      const evaluationAutoId = "edeaf311-4fd4-4d71-b37a-d9650655fb92";
      const evaluationConsoId = "3bfd65c9-e473-444e-8c51-075364ac92f5";
      const evaluationInstructionId = "a52e5875-e921-4748-ab77-124524aeff4e";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "instruction-user@example.com",
          nom: "Instruction",
          prenom: "User",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.utilisateur.create({
        data: {
          id: utilisateurAutoId,
          email: "auto-user@example.com",
          nom: "Auto",
          prenom: "User",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.utilisateur.create({
        data: {
          id: utilisateurConsoId,
          email: "conso-user@example.com",
          nom: "Conso",
          prenom: "User",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement avec 3 étapes",
          objectifs: {
            create: {
              id: objectifId,
              libelle: "Objectif avec 3 évaluations",
              descriptif: "Description objectif",
              jalon: 2025,
              indicateur_cible: "1000 utilisateurs actifs par mois",
            },
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "INSTRUCTION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: [
              {
                id: etapeAutoEvaluationId,
                type: "AUTO_EVALUATION",
              },
              {
                id: etapeConsolidationId,
                type: "CONSOLIDATION",
              },
              {
                id: etapeInstructionId,
                type: "INSTRUCTION",
              },
            ],
          },
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: rattachementUtilisateurId,
          rattachement_code: rattachementCode,
          utilisateur_id: utilisateurId,
          etape: "INSTRUCTION",
          jalon: 2025,
        },
      });

      await prisma.instruction_objectif.create({
        data: {
          id: instructionObjectifId,
          objectif_id: objectifId,
          rattachement_utilisateur_etape_jalon_id: rattachementUtilisateurId,
        },
      });

      await prisma.evaluation_objectif.create({
        data: {
          id: evaluationAutoId,
          etape_evaluation_id: etapeAutoEvaluationId,
          objectif_id: objectifId,
          auteur_id: utilisateurAutoId,
          note: 10,
          commentaire: "Évaluation auto",
        },
      });

      await prisma.evaluation_objectif.create({
        data: {
          id: evaluationConsoId,
          etape_evaluation_id: etapeConsolidationId,
          objectif_id: objectifId,
          auteur_id: utilisateurConsoId,
          note: 12,
          commentaire: "Évaluation consolidation",
        },
      });

      await prisma.evaluation_objectif.create({
        data: {
          id: evaluationInstructionId,
          etape_evaluation_id: etapeInstructionId,
          objectif_id: objectifId,
          auteur_id: utilisateurId,
          note: 15,
          commentaire: "Évaluation instruction",
          annexe: "Super annexe",
        },
      });

      // When
      const result = await query.execute({ utilisateurId });

      // Then
      expect(result.rattachements).toHaveLength(1);
      expect(result.rattachements[0].objectifs).toHaveLength(1);
      expect(result.rattachements[0].objectifs[0]).toEqual({
        id: objectifId,
        libelle: "Objectif avec 3 évaluations",
        descriptif: "Description objectif",
        indicateurCible: "1000 utilisateurs actifs par mois",
        tutelle: null,
        evaluations: [
          {
            etape: $Enums.etape_evaluation_enum.INSTRUCTION,
            evaluation: {
              id: evaluationInstructionId,
              note: 15,
              commentaire: "Évaluation instruction",
              annexe: "Super annexe",
            },
            dateTraitement: null,
          },
          {
            etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
            evaluation: {
              id: evaluationConsoId,
              note: 12,
              commentaire: "Évaluation consolidation",
              annexe: "",
            },
            dateTraitement: null,
          },
        ],
      });
    });

    it("doit récupérer les évaluations CONSOLIDATION et INSTRUCTION pour les critères", async () => {
      // Given
      const rattachementCode = "REG-TEST-05";
      const utilisateurId = "4c9bd9fc-a5b2-4ce3-9d48-2a4dddec7030";
      const utilisateurAutoId = "612dc2df-01bf-4fa7-9b80-bddfa31d527a";
      const utilisateurConsoId = "f984e7cd-7b3a-45b7-86c1-833b3b1d63d2";
      const ficheEvaluationId = "fa991703-eda1-4c99-92c5-1743a18fe879";
      const etapeAutoEvaluationId = "e7789f23-9fdd-4e5d-9d6a-b3dcde9fc833";
      const etapeConsolidationId = "5c6d387e-4268-4273-804e-a46d535e14d1";
      const etapeInstructionId = "51463c9b-27a7-4fd9-b8c9-ac7d13652837";
      const critereId = "350d8f56-62d9-41e5-9f5d-4ce5abc8435f";
      const sousCritereId = "b6554c23-643c-4b2c-86a5-e6403e69bdb2";
      const rattachementUtilisateurId = "6d7fa205-5dba-4df2-a211-528c4b0df736";
      const instructionCritereId = "6b6a49fb-1fad-47f2-9cbf-38fd048f90cd";
      const evaluationAutoId = "81502c9c-a16f-4948-90a1-d6d0887c0bd5";
      const evaluationConsoId = "5f042799-7a57-46e4-a041-30f4dabe75ea";
      const evaluationInstructionId = "c9c6047d-7766-4453-b00d-8a1517d5d270";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "instruction-critere-user@example.com",
          nom: "Instruction",
          prenom: "Critere User",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.utilisateur.create({
        data: {
          id: utilisateurAutoId,
          email: "auto-critere-user@example.com",
          nom: "Auto",
          prenom: "Critere User",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.utilisateur.create({
        data: {
          id: utilisateurConsoId,
          email: "conso-critere-user@example.com",
          nom: "Conso",
          prenom: "Critere User",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          libelle: "Critère avec 3 évaluations",
          descriptif: "Description critère",
          type: "SIMPLIFICATION",
          sous_criteres: {
            create: {
              id: sousCritereId,
              libelle: "Sous-critère",
              descriptif: "Description sous-critère",
            },
          },
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement critère 3 étapes",
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "INSTRUCTION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: [
              {
                id: etapeAutoEvaluationId,
                type: "AUTO_EVALUATION",
              },
              {
                id: etapeConsolidationId,
                type: "CONSOLIDATION",
              },
              {
                id: etapeInstructionId,
                type: "INSTRUCTION",
              },
            ],
          },
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: rattachementUtilisateurId,
          rattachement_code: rattachementCode,
          utilisateur_id: utilisateurId,
          etape: "INSTRUCTION",
          jalon: 2025,
        },
      });

      await prisma.instruction_critere.create({
        data: {
          id: instructionCritereId,
          critere_id: critereId,
          rattachement_utilisateur_etape_jalon_id: rattachementUtilisateurId,
        },
      });

      await prisma.evaluation_critere.create({
        data: {
          id: evaluationAutoId,
          etape_evaluation_id: etapeAutoEvaluationId,
          critere_id: critereId,
          auteur_id: utilisateurAutoId,
          note: 8,
          commentaire: "Évaluation auto critère",
        },
      });

      await prisma.evaluation_critere.create({
        data: {
          id: evaluationConsoId,
          etape_evaluation_id: etapeConsolidationId,
          critere_id: critereId,
          auteur_id: utilisateurConsoId,
          note: 11,
          commentaire: "Évaluation consolidation critère",
        },
      });

      await prisma.evaluation_critere.create({
        data: {
          id: evaluationInstructionId,
          etape_evaluation_id: etapeInstructionId,
          critere_id: critereId,
          auteur_id: utilisateurId,
          note: 14,
          commentaire: "Évaluation instruction critère",
        },
      });

      // When
      const result = await query.execute({ utilisateurId });

      // Then
      expect(result.rattachements).toHaveLength(1);
      expect(result.rattachements[0].criteres).toHaveLength(1);
      expect(result.rattachements[0].criteres[0]).toEqual({
        id: critereId,
        libelle: "Critère avec 3 évaluations",
        evaluations: [
          {
            etape: $Enums.etape_evaluation_enum.INSTRUCTION,
            evaluation: {
              id: evaluationInstructionId,
              note: 14,
              commentaire: "Évaluation instruction critère",
              annexe: "",
            },
            dateTraitement: null,
          },
          {
            etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
            evaluation: {
              id: evaluationConsoId,
              note: 11,
              commentaire: "Évaluation consolidation critère",
              annexe: "",
            },
            dateTraitement: null,
          },
        ],
      });
    });

    it("doit récupérer la tutelle associée à un objectif si elle existe", async () => {
      // Given
      const rattachementCode = "REG-TEST-06";
      const utilisateurId = "46979941-4e02-4f11-b1ee-8bed09897c97";
      const ficheEvaluationId = "a4d5772e-00bb-468d-a784-c79e4a6ea037";
      const etapeInstructionId = "2140cddb-adc7-4f26-9c75-94a90446f115";
      const tutelleId = "b49d81dc-add6-4df3-a320-7c8f5e869038";
      const objectifAvecTutelleId = "9202211f-ba69-4982-9a30-12d8fd5fee3c";
      const objectifSansTutelleId = "b44a8fe4-b987-443a-868c-59fc73b752f2";
      const rattachementUtilisateurId = "33a2ac85-1880-4f96-ade3-6bada98822ee";
      const instructionObjectif1Id = "ebbf0f80-2bb4-41ba-98ef-ecfd1d48357a";
      const instructionObjectif2Id = "21b0345d-08cf-4662-a36b-f283b4c2f36e";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "tutelle-user@example.com",
          nom: "Tutelle",
          prenom: "User",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_tutelle.create({
        data: {
          id: tutelleId,
          nom: "Direction Test",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Rattachement avec tutelles",
          objectifs: {
            create: [
              {
                id: objectifAvecTutelleId,
                libelle: "Objectif avec tutelle",
                descriptif: "Description",
                jalon: 2025,
                tutelle_id: tutelleId,
                indicateur_cible: "30 projets validés",
              },
              {
                id: objectifSansTutelleId,
                libelle: "Objectif sans tutelle",
                descriptif: "Description",
                jalon: 2025,
                indicateur_cible: "Budget exécuté à 100%",
              },
            ],
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "INSTRUCTION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeInstructionId,
              type: "INSTRUCTION",
            },
          },
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: rattachementUtilisateurId,
          rattachement_code: rattachementCode,
          utilisateur_id: utilisateurId,
          etape: "INSTRUCTION",
          jalon: 2025,
        },
      });

      await prisma.instruction_objectif.createMany({
        data: [
          {
            id: instructionObjectif1Id,
            objectif_id: objectifAvecTutelleId,
            rattachement_utilisateur_etape_jalon_id: rattachementUtilisateurId,
          },
          {
            id: instructionObjectif2Id,
            objectif_id: objectifSansTutelleId,
            rattachement_utilisateur_etape_jalon_id: rattachementUtilisateurId,
          },
        ],
      });

      // When
      const result = await query.execute({ utilisateurId });

      // Then
      expect(result.rattachements).toHaveLength(1);
      expect(result.rattachements[0].objectifs).toHaveLength(2);
      expect(result.rattachements[0].objectifs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: objectifAvecTutelleId,
            libelle: "Objectif avec tutelle",
            tutelle: {
              id: tutelleId,
              nom: "Direction Test",
            },
          }),
          expect.objectContaining({
            id: objectifSansTutelleId,
            libelle: "Objectif sans tutelle",
            tutelle: null,
          }),
        ]),
      );
    });

    it("doit retourner plusieurs rattachements pour un utilisateur avec accès multi-territoire", async () => {
      // Given
      const rattachement1Code = "REG-TEST-07";
      const rattachement2Code = "REG-TEST-08";
      const utilisateurId = "0d51bc68-2c57-4018-a53d-9c473d3ce484";
      const ficheEvaluation1Id = "22543937-6b51-4364-80ba-bd97d2560c6f";
      const ficheEvaluation2Id = "3a83a292-8bc5-4b6c-9292-94f65de1ce21";
      const etapeInstruction1Id = "90dd5380-cabf-41ea-944b-522ceee1b9d9";
      const etapeInstruction2Id = "039021ae-5934-48ba-b37d-b403cd3cba84";
      const objectif1Id = "4ee2bfbb-6acd-46bf-a457-3c867896cbce";
      const objectif2Id = "29ff0526-b9d1-4868-a32d-332ae55367dd";
      const rattachementUtilisateur1Id = "462945f6-61da-46fc-82f9-5f06b4ae3ca3";
      const rattachementUtilisateur2Id = "612f83cf-3c7d-4c11-b96b-7341404b67c4";
      const instructionObjectif1Id = "66facc12-2c76-4761-a38c-197dd87a71d5";
      const instructionObjectif2Id = "9c743407-11af-419b-ac87-97a76addbd7d";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "multi-territoire-instruction@example.com",
          nom: "Multi",
          prenom: "Territoire",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachement1Code,
          groupe: rattachement1Code,
          ordre: 1,
          libelle: "Rattachement 1",
          objectifs: {
            create: {
              id: objectif1Id,
              libelle: "Objectif rattachement 1",
              descriptif: "Description",
              jalon: 2025,
              indicateur_cible: "200 bénéficiaires",
            },
          },
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachement2Code,
          groupe: rattachement2Code,
          ordre: 1,
          libelle: "Rattachement 2",
          objectifs: {
            create: {
              id: objectif2Id,
              libelle: "Objectif rattachement 2",
              descriptif: "Description",
              jalon: 2025,
              indicateur_cible: "Temps de réponse < 48h",
            },
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluation1Id,
          jalon: 2025,
          etape_courante: "INSTRUCTION",
          rattachement_code: rattachement1Code,
          etape_evaluations: {
            create: {
              id: etapeInstruction1Id,
              type: "INSTRUCTION",
            },
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluation2Id,
          jalon: 2025,
          etape_courante: "INSTRUCTION",
          rattachement_code: rattachement2Code,
          etape_evaluations: {
            create: {
              id: etapeInstruction2Id,
              type: "INSTRUCTION",
            },
          },
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: rattachementUtilisateur1Id,
          rattachement_code: rattachement1Code,
          utilisateur_id: utilisateurId,
          etape: "INSTRUCTION",
          jalon: 2025,
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: rattachementUtilisateur2Id,
          rattachement_code: rattachement2Code,
          utilisateur_id: utilisateurId,
          etape: "INSTRUCTION",
          jalon: 2025,
        },
      });

      await prisma.instruction_objectif.createMany({
        data: [
          {
            id: instructionObjectif1Id,
            objectif_id: objectif1Id,
            rattachement_utilisateur_etape_jalon_id: rattachementUtilisateur1Id,
          },
          {
            id: instructionObjectif2Id,
            objectif_id: objectif2Id,
            rattachement_utilisateur_etape_jalon_id: rattachementUtilisateur2Id,
          },
        ],
      });

      // When
      const result = await query.execute({ utilisateurId });

      // Then
      expect(result.rattachements).toHaveLength(2);
      expect(result.rattachements[0].code).toBe(rattachement1Code);
      expect(result.rattachements[1].code).toBe(rattachement2Code);
    });

    it("doit retourner la liste unique de tous les critères accessibles pour filtrage", async () => {
      // Given
      const rattachement1Code = "REG-TEST-09";
      const rattachement2Code = "REG-TEST-10";
      const utilisateurId = "8f3e9d42-1a7c-4e5b-9c8d-3f2a1b4e6c7d";
      const ficheEvaluation1Id = "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d";
      const ficheEvaluation2Id = "2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e";
      const etapeInstruction1Id = "3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f";
      const etapeInstruction2Id = "4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a";
      const critere1Id = "5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b";
      const critere2Id = "6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c";
      const critere3Id = "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d";
      const critere4Id = "bf5b719f-c274-4129-992f-9b3919128b64";
      const rattachementUtilisateur1Id = "1e2f3a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b";
      const rattachementUtilisateur2Id = "2f3a4b5c-6d7e-8f9a-0b1c-2d3e4f5a6b7c";
      const instructionCritere1Id = "3a4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d";
      const instructionCritere2Id = "4b5c6d7e-8f9a-0b1c-2d3e-4f5a6b7c8d9e";
      const instructionCritere3aId = "5c6d7e8f-9a0b-1c2d-3e4f-5a6b7c8d9e0f";
      const instructionCritere3bId = "6d7e8f9a-0b1c-2d3e-4f5a-6b7c8d9e0f1a";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "filtrage-criteres@example.com",
          nom: "Filtrage",
          prenom: "Criteres",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_critere.createMany({
        data: [
          {
            id: critere1Id,
            libelle: "Critère unique rattachement 1",
            descriptif: "Description",
            type: "COMMUNICATION",
          },
          {
            id: critere2Id,
            libelle: "Critère unique rattachement 2",
            descriptif: "Description",
            type: "SERVICES_PUBLICS",
          },
          {
            id: critere3Id,
            libelle: "Critère commun aux 2",
            descriptif: "Description",
            type: "SIMPLIFICATION",
          },
          {
            id: critere4Id,
            libelle: "Critère dans aucun des 2",
            descriptif: "Description",
            type: "FEUILLE_DE_ROUTE",
          },
        ],
      });

      await prisma.referentiel_rattachement.createMany({
        data: [
          {
            code: rattachement1Code,
            libelle: "Rattachement 1 filtrage",
            groupe: rattachement1Code,
            ordre: 1,
          },
          {
            code: rattachement2Code,
            libelle: "Rattachement 2 filtrage",
            groupe: rattachement2Code,
            ordre: 1,
          },
        ],
      });

      await prisma.fiche_evaluation.createMany({
        data: [
          {
            id: ficheEvaluation1Id,
            jalon: 2025,
            etape_courante: "INSTRUCTION",
            rattachement_code: rattachement1Code,
          },
          {
            id: ficheEvaluation2Id,
            jalon: 2025,
            etape_courante: "INSTRUCTION",
            rattachement_code: rattachement2Code,
          },
        ],
      });

      await prisma.etape_evaluation.createMany({
        data: [
          {
            id: etapeInstruction1Id,
            fiche_evaluation_id: ficheEvaluation1Id,
            type: "INSTRUCTION",
          },
          {
            id: etapeInstruction2Id,
            fiche_evaluation_id: ficheEvaluation2Id,
            type: "INSTRUCTION",
          },
        ],
      });

      await prisma.rattachement_utilisateur_etape_jalon.createMany({
        data: [
          {
            id: rattachementUtilisateur1Id,
            rattachement_code: rattachement1Code,
            utilisateur_id: utilisateurId,
            etape: "INSTRUCTION",
            jalon: 2025,
          },
          {
            id: rattachementUtilisateur2Id,
            rattachement_code: rattachement2Code,
            utilisateur_id: utilisateurId,
            etape: "INSTRUCTION",
            jalon: 2025,
          },
        ],
      });

      await prisma.instruction_critere.createMany({
        data: [
          {
            id: instructionCritere1Id,
            critere_id: critere1Id,
            rattachement_utilisateur_etape_jalon_id: rattachementUtilisateur1Id,
          },
          {
            id: instructionCritere3aId,
            critere_id: critere3Id,
            rattachement_utilisateur_etape_jalon_id: rattachementUtilisateur1Id,
          },
          {
            id: instructionCritere2Id,
            critere_id: critere2Id,
            rattachement_utilisateur_etape_jalon_id: rattachementUtilisateur2Id,
          },
          {
            id: instructionCritere3bId,
            critere_id: critere3Id,
            rattachement_utilisateur_etape_jalon_id: rattachementUtilisateur2Id,
          },
        ],
      });

      // When
      const result = await query.execute({ utilisateurId });

      // Then
      expect(result.rattachements).toHaveLength(2);

      // Le tableau criteres à la racine doit contenir les 3 critères uniques
      expect(result.criteres).toHaveLength(3);
      expect(result.criteres).toEqual(
        expect.arrayContaining([
          {
            id: critere1Id,
            libelle: "Critère unique rattachement 1",
            descriptif: "Description",
            type: "COMMUNICATION",
            sousCriteres: [],
          },
          {
            id: critere2Id,
            libelle: "Critère unique rattachement 2",
            descriptif: "Description",
            type: "SERVICES_PUBLICS",
            sousCriteres: [],
          },
          {
            id: critere3Id,
            libelle: "Critère commun aux 2",
            descriptif: "Description",
            type: "SIMPLIFICATION",
            sousCriteres: [],
          },
        ]),
      );
    });
  });
});

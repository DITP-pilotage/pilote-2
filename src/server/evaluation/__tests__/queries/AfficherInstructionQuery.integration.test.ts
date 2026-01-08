import { $Enums } from "@prisma/client";
import { AfficherInstructionQuery } from "@/server/evaluation/queries/AfficherInstructionQuery";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures as f } from "@/server/infrastructure/test/fixtures";

describe("AfficherInstructionQuery", () => {
  let query: AfficherInstructionQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new AfficherInstructionQuery({ prisma: prismaPilote });
  });

  describe("#execute", () => {
    it(
      "doit retourner un tableau vide quand l'utilisateur n'a pas d'accès INSTRUCTION",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur({
          email: "no-instruction-access@example.com",
          nom: "No Instruction",
          prenom: "User",
        });
        await f.rattachement();

        // When
        const result = await query.execute({ utilisateurId: utilisateur.id });

        // Then
        expect(result.rattachements).toEqual([]);
      }),
    );

    it(
      "doit filtrer les objectifs selon les instruction_objectif de l'utilisateur",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur({
          email: "instruction-objectifs@example.com",
          nom: "Instruction",
          prenom: "Objectifs",
        });

        const rattachement = await f.rattachement({
          libelle: "Rattachement avec objectifs filtrés",
        });
        const objectif1 = await f.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif à instruire",
          descriptif: "Description objectif 1",
          indicateur_cible: "Atteindre 90% de conformité",
        });
        const objectif2 = await f.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif non à instruire",
          descriptif: "Description objectif 2",
          indicateur_cible: "5 nouveaux partenariats",
        });

        const fiche = await f.fiche({
          rattachement_code: rattachement.code,
          etape_courante: "INSTRUCTION",
        });
        await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });
        await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
        });
        await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "INSTRUCTION",
        });

        const rattachementUtilisateur =
          await f.rattachementUtilisateurEtapeJalon({
            rattachement_code: rattachement.code,
            utilisateur_id: utilisateur.id,
            etape: "INSTRUCTION",
          });

        await f.instructionObjectif({
          objectif_id: objectif1.id,
          rattachement_utilisateur_etape_jalon_id: rattachementUtilisateur.id,
        });

        // When
        const result = await query.execute({ utilisateurId: utilisateur.id });

        // Then
        expect(result.rattachements).toHaveLength(1);
        expect(result.rattachements[0].objectifs).toHaveLength(1);
        expect(result.rattachements[0].objectifs[0].id).toBe(objectif1.id);
      }),
    );

    it(
      "doit filtrer les critères selon les instruction_critere de l'utilisateur",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur({
          email: "instruction-criteres@example.com",
          nom: "Instruction",
          prenom: "Critères",
        });

        const critere1 = await f.critere({
          libelle: "Critère à instruire",
          descriptif: "Description critère 1",
          type: "COMMUNICATION",
        });
        const sousCritere1 = await f.sousCritere({
          parent_id: critere1.id,
          libelle: "Sous-critère 1",
          descriptif: "Description sous-critère 1",
        });

        const critere2 = await f.critere({
          libelle: "Critère non à instruire",
          descriptif: "Description critère 2",
          type: "SERVICES_PUBLICS",
        });
        await f.sousCritere({
          parent_id: critere2.id,
          libelle: "Sous-critère 2",
          descriptif: "Description sous-critère 2",
        });

        const rattachement = await f.rattachement({
          libelle: "Rattachement avec critères filtrés",
        });

        const fiche = await f.fiche({
          rattachement_code: rattachement.code,
          etape_courante: "INSTRUCTION",
        });
        await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });
        await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
        });
        await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "INSTRUCTION",
        });

        const rattachementUtilisateur =
          await f.rattachementUtilisateurEtapeJalon({
            rattachement_code: rattachement.code,
            utilisateur_id: utilisateur.id,
            etape: "INSTRUCTION",
          });

        await f.instructionCritere({
          critere_id: critere1.id,
          rattachement_utilisateur_etape_jalon_id: rattachementUtilisateur.id,
        });

        // When
        const result = await query.execute({ utilisateurId: utilisateur.id });

        // Then
        expect(result.rattachements).toHaveLength(1);
        expect(result.rattachements[0].criteres).toHaveLength(1);
        expect(result.rattachements[0].criteres[0].id).toBe(critere1.id);
        expect(result.criteres).toHaveLength(1);
        expect(result.criteres[0]).toEqual({
          id: critere1.id,
          libelle: "Critère à instruire",
          descriptif: "Description critère 1",
          type: "COMMUNICATION",
          sousCriteres: [
            {
              id: sousCritere1.id,
              libelle: "Sous-critère 1",
              descriptif: "Description sous-critère 1",
            },
          ],
        });
      }),
    );

    it(
      "doit récupérer les évaluations CONSOLIDATION et INSTRUCTION pour les objectifs",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur({
          email: "instruction-user@example.com",
          nom: "Instruction",
          prenom: "User",
        });
        const utilisateurAuto = await f.utilisateur({
          email: "auto-user@example.com",
          nom: "Auto",
          prenom: "User",
        });
        const utilisateurConso = await f.utilisateur({
          email: "conso-user@example.com",
          nom: "Conso",
          prenom: "User",
        });

        const rattachement = await f.rattachement({
          libelle: "Rattachement avec 3 étapes",
        });
        const objectif = await f.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif avec 3 évaluations",
          descriptif: "Description objectif",
          indicateur_cible: "1000 utilisateurs actifs par mois",
        });

        const fiche = await f.fiche({
          rattachement_code: rattachement.code,
          etape_courante: "INSTRUCTION",
        });
        const etapeAutoEvaluation = await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });
        const etapeConsolidation = await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
        });
        const etapeInstruction = await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "INSTRUCTION",
        });

        const rattachementUtilisateur =
          await f.rattachementUtilisateurEtapeJalon({
            rattachement_code: rattachement.code,
            utilisateur_id: utilisateur.id,
            etape: "INSTRUCTION",
          });

        await f.instructionObjectif({
          objectif_id: objectif.id,
          rattachement_utilisateur_etape_jalon_id: rattachementUtilisateur.id,
        });

        await f.evaluationObjectif({
          etape_evaluation_id: etapeAutoEvaluation.id,
          objectif_id: objectif.id,
          auteur_id: utilisateurAuto.id,
          note: 10,
          commentaire: "Évaluation auto",
        });

        const evaluationConso = await f.evaluationObjectif({
          etape_evaluation_id: etapeConsolidation.id,
          objectif_id: objectif.id,
          auteur_id: utilisateurConso.id,
          note: 12,
          commentaire: "Évaluation consolidation",
        });

        const evaluationInstruction = await f.evaluationObjectif({
          etape_evaluation_id: etapeInstruction.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 15,
          commentaire: "Évaluation instruction",
          annexe: "Super annexe",
        });

        // When
        const result = await query.execute({ utilisateurId: utilisateur.id });

        // Then
        expect(result.rattachements).toHaveLength(1);
        expect(result.rattachements[0].objectifs).toHaveLength(1);
        expect(result.rattachements[0].objectifs[0]).toEqual({
          id: objectif.id,
          libelle: "Objectif avec 3 évaluations",
          descriptif: "Description objectif",
          indicateurCible: "1000 utilisateurs actifs par mois",
          tutelle: null,
          evaluations: [
            {
              etape: $Enums.etape_evaluation_enum.INSTRUCTION,
              evaluation: {
                id: evaluationInstruction.id,
                note: 15,
                commentaire: "Évaluation instruction",
                annexe: "Super annexe",
              },
              dateTraitement: null,
            },
            {
              etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
              evaluation: {
                id: evaluationConso.id,
                note: 12,
                commentaire: "Évaluation consolidation",
                annexe: "",
              },
              dateTraitement: null,
            },
          ],
        });
      }),
    );

    it(
      "doit récupérer les évaluations CONSOLIDATION et INSTRUCTION pour les critères",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur({
          email: "instruction-critere-user@example.com",
          nom: "Instruction",
          prenom: "Critere User",
        });
        const utilisateurAuto = await f.utilisateur({
          email: "auto-critere-user@example.com",
          nom: "Auto",
          prenom: "Critere User",
        });
        const utilisateurConso = await f.utilisateur({
          email: "conso-critere-user@example.com",
          nom: "Conso",
          prenom: "Critere User",
        });

        const critere = await f.critere({
          libelle: "Critère avec 3 évaluations",
          descriptif: "Description critère",
          type: "SIMPLIFICATION",
        });
        await f.sousCritere({
          parent_id: critere.id,
          libelle: "Sous-critère",
          descriptif: "Description sous-critère",
        });

        const rattachement = await f.rattachement({
          libelle: "Rattachement critère 3 étapes",
        });

        const fiche = await f.fiche({
          rattachement_code: rattachement.code,
          etape_courante: "INSTRUCTION",
        });
        const etapeAutoEvaluation = await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });
        const etapeConsolidation = await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
        });
        const etapeInstruction = await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "INSTRUCTION",
        });

        const rattachementUtilisateur =
          await f.rattachementUtilisateurEtapeJalon({
            rattachement_code: rattachement.code,
            utilisateur_id: utilisateur.id,
            etape: "INSTRUCTION",
          });

        await f.instructionCritere({
          critere_id: critere.id,
          rattachement_utilisateur_etape_jalon_id: rattachementUtilisateur.id,
        });

        await f.evaluationCritere({
          etape_evaluation_id: etapeAutoEvaluation.id,
          critere_id: critere.id,
          auteur_id: utilisateurAuto.id,
          note: 8,
          commentaire: "Évaluation auto critère",
        });

        const evaluationConso = await f.evaluationCritere({
          etape_evaluation_id: etapeConsolidation.id,
          critere_id: critere.id,
          auteur_id: utilisateurConso.id,
          note: 11,
          commentaire: "Évaluation consolidation critère",
        });

        const evaluationInstruction = await f.evaluationCritere({
          etape_evaluation_id: etapeInstruction.id,
          critere_id: critere.id,
          auteur_id: utilisateur.id,
          note: 14,
          commentaire: "Évaluation instruction critère",
        });

        // When
        const result = await query.execute({ utilisateurId: utilisateur.id });

        // Then
        expect(result.rattachements).toHaveLength(1);
        expect(result.rattachements[0].criteres).toHaveLength(1);
        expect(result.rattachements[0].criteres[0]).toEqual({
          id: critere.id,
          libelle: "Critère avec 3 évaluations",
          evaluations: [
            {
              etape: $Enums.etape_evaluation_enum.INSTRUCTION,
              evaluation: {
                id: evaluationInstruction.id,
                note: 14,
                commentaire: "Évaluation instruction critère",
                annexe: "",
              },
              dateTraitement: null,
            },
            {
              etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
              evaluation: {
                id: evaluationConso.id,
                note: 11,
                commentaire: "Évaluation consolidation critère",
                annexe: "",
              },
              dateTraitement: null,
            },
          ],
        });
      }),
    );

    it(
      "doit récupérer la tutelle associée à un objectif si elle existe",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur({
          email: "tutelle-user@example.com",
          nom: "Tutelle",
          prenom: "User",
        });

        const tutelle = await f.tutelle({
          nom: "Direction Test",
        });

        const rattachement = await f.rattachement({
          libelle: "Rattachement avec tutelles",
        });
        const objectifAvecTutelle = await f.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif avec tutelle",
          descriptif: "Description",
          tutelle_id: tutelle.id,
          indicateur_cible: "30 projets validés",
        });
        const objectifSansTutelle = await f.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif sans tutelle",
          descriptif: "Description",
          indicateur_cible: "Budget exécuté à 100%",
        });

        const fiche = await f.fiche({
          rattachement_code: rattachement.code,
          etape_courante: "INSTRUCTION",
        });
        await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "INSTRUCTION",
        });

        const rattachementUtilisateur =
          await f.rattachementUtilisateurEtapeJalon({
            rattachement_code: rattachement.code,
            utilisateur_id: utilisateur.id,
            etape: "INSTRUCTION",
          });

        await f.instructionObjectif({
          objectif_id: objectifAvecTutelle.id,
          rattachement_utilisateur_etape_jalon_id: rattachementUtilisateur.id,
        });
        await f.instructionObjectif({
          objectif_id: objectifSansTutelle.id,
          rattachement_utilisateur_etape_jalon_id: rattachementUtilisateur.id,
        });

        // When
        const result = await query.execute({ utilisateurId: utilisateur.id });

        // Then
        expect(result.rattachements).toHaveLength(1);
        expect(result.rattachements[0].objectifs).toHaveLength(2);
        expect(result.rattachements[0].objectifs).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: objectifAvecTutelle.id,
              libelle: "Objectif avec tutelle",
              tutelle: {
                id: tutelle.id,
                nom: "Direction Test",
              },
            }),
            expect.objectContaining({
              id: objectifSansTutelle.id,
              libelle: "Objectif sans tutelle",
              tutelle: null,
            }),
          ]),
        );
      }),
    );

    it(
      "doit retourner plusieurs rattachements pour un utilisateur avec accès multi-territoire",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur({
          email: "multi-territoire-instruction@example.com",
          nom: "Multi",
          prenom: "Territoire",
        });

        const rattachement1 = await f.rattachement({
          libelle: "Rattachement 1",
        });
        const objectif1 = await f.objectif({
          rattachement_code: rattachement1.code,
          libelle: "Objectif rattachement 1",
          descriptif: "Description",
          indicateur_cible: "200 bénéficiaires",
        });

        const rattachement2 = await f.rattachement({
          libelle: "Rattachement 2",
        });
        const objectif2 = await f.objectif({
          rattachement_code: rattachement2.code,
          libelle: "Objectif rattachement 2",
          descriptif: "Description",
          indicateur_cible: "Temps de réponse < 48h",
        });

        const fiche1 = await f.fiche({
          rattachement_code: rattachement1.code,
          etape_courante: "INSTRUCTION",
        });
        await f.etapeEvaluation({
          fiche_evaluation_id: fiche1.id,
          type: "INSTRUCTION",
        });

        const fiche2 = await f.fiche({
          rattachement_code: rattachement2.code,
          etape_courante: "INSTRUCTION",
        });
        await f.etapeEvaluation({
          fiche_evaluation_id: fiche2.id,
          type: "INSTRUCTION",
        });

        const rattachementUtilisateur1 =
          await f.rattachementUtilisateurEtapeJalon({
            rattachement_code: rattachement1.code,
            utilisateur_id: utilisateur.id,
            etape: "INSTRUCTION",
          });

        const rattachementUtilisateur2 =
          await f.rattachementUtilisateurEtapeJalon({
            rattachement_code: rattachement2.code,
            utilisateur_id: utilisateur.id,
            etape: "INSTRUCTION",
          });

        await f.instructionObjectif({
          objectif_id: objectif1.id,
          rattachement_utilisateur_etape_jalon_id: rattachementUtilisateur1.id,
        });
        await f.instructionObjectif({
          objectif_id: objectif2.id,
          rattachement_utilisateur_etape_jalon_id: rattachementUtilisateur2.id,
        });

        // When
        const result = await query.execute({ utilisateurId: utilisateur.id });

        // Then
        expect(result.rattachements).toHaveLength(2);
        expect(result.rattachements[0].code).toBe(rattachement1.code);
        expect(result.rattachements[1].code).toBe(rattachement2.code);
      }),
    );

    it(
      "doit retourner la liste unique de tous les critères accessibles pour filtrage",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur({
          email: "filtrage-criteres@example.com",
          nom: "Filtrage",
          prenom: "Criteres",
        });

        const critere1 = await f.critere({
          libelle: "Critère unique rattachement 1",
          descriptif: "Description",
          type: "COMMUNICATION",
        });
        const critere2 = await f.critere({
          libelle: "Critère unique rattachement 2",
          descriptif: "Description",
          type: "SERVICES_PUBLICS",
        });
        const critere3 = await f.critere({
          libelle: "Critère commun aux 2",
          descriptif: "Description",
          type: "SIMPLIFICATION",
        });
        await f.critere({
          libelle: "Critère dans aucun des 2",
          descriptif: "Description",
          type: "FEUILLE_DE_ROUTE",
        });

        const rattachement1 = await f.rattachement({
          libelle: "Rattachement 1 filtrage",
        });
        const rattachement2 = await f.rattachement({
          libelle: "Rattachement 2 filtrage",
        });

        const fiche1 = await f.fiche({
          rattachement_code: rattachement1.code,
          etape_courante: "INSTRUCTION",
        });
        const etapeInstruction1 = await f.etapeEvaluation({
          fiche_evaluation_id: fiche1.id,
          type: "INSTRUCTION",
        });

        const fiche2 = await f.fiche({
          rattachement_code: rattachement2.code,
          etape_courante: "INSTRUCTION",
        });
        const etapeInstruction2 = await f.etapeEvaluation({
          fiche_evaluation_id: fiche2.id,
          type: "INSTRUCTION",
        });

        const rattachementUtilisateur1 =
          await f.rattachementUtilisateurEtapeJalon({
            rattachement_code: rattachement1.code,
            utilisateur_id: utilisateur.id,
            etape: "INSTRUCTION",
          });
        const rattachementUtilisateur2 =
          await f.rattachementUtilisateurEtapeJalon({
            rattachement_code: rattachement2.code,
            utilisateur_id: utilisateur.id,
            etape: "INSTRUCTION",
          });

        await f.instructionCritere({
          critere_id: critere1.id,
          rattachement_utilisateur_etape_jalon_id: rattachementUtilisateur1.id,
        });
        await f.instructionCritere({
          critere_id: critere3.id,
          rattachement_utilisateur_etape_jalon_id: rattachementUtilisateur1.id,
        });
        await f.instructionCritere({
          critere_id: critere2.id,
          rattachement_utilisateur_etape_jalon_id: rattachementUtilisateur2.id,
        });
        await f.instructionCritere({
          critere_id: critere3.id,
          rattachement_utilisateur_etape_jalon_id: rattachementUtilisateur2.id,
        });

        // When
        const result = await query.execute({ utilisateurId: utilisateur.id });

        // Then
        expect(result.rattachements).toHaveLength(2);

        // Le tableau criteres à la racine doit contenir les 3 critères uniques
        expect(result.criteres).toHaveLength(3);
        expect(result.criteres).toEqual(
          expect.arrayContaining([
            {
              id: critere1.id,
              libelle: "Critère unique rattachement 1",
              descriptif: "Description",
              type: "COMMUNICATION",
              sousCriteres: [],
            },
            {
              id: critere2.id,
              libelle: "Critère unique rattachement 2",
              descriptif: "Description",
              type: "SERVICES_PUBLICS",
              sousCriteres: [],
            },
            {
              id: critere3.id,
              libelle: "Critère commun aux 2",
              descriptif: "Description",
              type: "SIMPLIFICATION",
              sousCriteres: [],
            },
          ]),
        );
      }),
    );
  });
});

import { AfficherPilotageQuery } from "@/server/evaluation/queries/AfficherPilotageQuery";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { getPrisma } from "@/server/db/PrismaTransaction";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures as f } from "@/server/infrastructure/test/fixtures";

describe("#AfficherPilotageQuery", () => {
  let query: AfficherPilotageQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new AfficherPilotageQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "doit retourner les fiches sans les évaluations quand elles n'existent pas",
      createIntegrationTest(async () => {
        // Given
        const critere1 = await f.critere({
          libelle: "Critère 1",
          descriptif: "Description critère 1",
          type: "COMMUNICATION",
        });
        const critere2 = await f.critere({
          libelle: "Critère 2",
          descriptif: "Description critère 2",
          type: "SERVICES_PUBLICS",
        });

        const groupe = await f.rattachementGroupe({
          code: "Groupe A",
          libelle: "Libellé Groupe A",
          ordre: 1,
        });

        const rattachement = await f.rattachement({
          groupe: groupe.code,
          ordre: 1,
          libelle: "Rattachement 1",
        });

        const objectif1 = await f.objectif({
          libelle: "Objectif 1",
          descriptif: "Description objectif 1",
          jalon: 2025,
          indicateur_cible: "75% de taux de réussite",
          rattachement_code: rattachement.code,
        });

        const objectif2 = await f.objectif({
          libelle: "Objectif 2",
          descriptif: "Description objectif 2",
          jalon: 2025,
          indicateur_cible: "Réduction de 30% des coûts",
          rattachement_code: rattachement.code,
        });

        const fiche = await f.fiche({
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachement.code,
        });

        await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });

        // When
        const result = await query.run();

        // Then
        expect(result.criteres).toEqual([
          {
            id: critere1.id,
            libelle: "Critère 1",
            descriptif: "Description critère 1",
            type: "COMMUNICATION",
            sousCriteres: [],
          },
          {
            id: critere2.id,
            libelle: "Critère 2",
            descriptif: "Description critère 2",
            type: "SERVICES_PUBLICS",
            sousCriteres: [],
          },
        ]);
        expect(result.fichesEvaluation).toEqual([
          {
            id: fiche.id,
            jalon: 2025,
            etapeCourante: "AUTO_EVALUATION",
            readOnly: false,
            rattachement: {
              code: rattachement.code,
              libelle: "Rattachement 1",
              groupe: "Groupe A",
              ordre: 1,
              referentielRattachementGroupe: {
                code: "Groupe A",
                libelle: "Libellé Groupe A",
                ordre: 1,
              },
            },
            noteObjectifsCollectifs: null,

            evaluationsParCritereEtEtape: {
              [critere1.id]: {
                AUTO_EVALUATION: null,
                CONSOLIDATION: null,
                INSTRUCTION: null,
              },
              [critere2.id]: {
                AUTO_EVALUATION: null,
                CONSOLIDATION: null,
                INSTRUCTION: null,
              },
            },
            objectifs: [
              {
                id: objectif1.id,
                libelle: "Objectif 1",
                evaluations: {
                  AUTO_EVALUATION: null,
                  CONSOLIDATION: null,
                  INSTRUCTION: null,
                },
              },
              {
                id: objectif2.id,
                libelle: "Objectif 2",
                evaluations: {
                  AUTO_EVALUATION: null,
                  CONSOLIDATION: null,
                  INSTRUCTION: null,
                },
              },
            ],
            moyennesCriteres: {
              AUTO_EVALUATION: null,
              CONSOLIDATION: null,
              INSTRUCTION: null,
            },
            moyennesObjectifs: {
              AUTO_EVALUATION: null,
              CONSOLIDATION: null,
              INSTRUCTION: null,
            },
            synthese: {
              AUTO_EVALUATION: null,
              CONSOLIDATION: null,
              INSTRUCTION: null,
            },
          },
        ]);
      }),
    );

    it(
      "doit retourner les évaluations des critères et des objectifs quand elles existent",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur({
          email: "test@example.com",
          nom: "Test",
          prenom: "User",
        });

        const critere = await f.critere({
          libelle: "Critère test",
          descriptif: "Description critère test",
          type: "SIMPLIFICATION",
        });

        const groupe = await f.rattachementGroupe({
          code: "Groupe B",
          libelle: "Libellé Groupe B",
          ordre: 2,
        });

        const rattachement = await f.rattachement({
          groupe: groupe.code,
          ordre: 1,
          libelle: "Rattachement test",
        });

        const objectif = await f.objectif({
          libelle: "Objectif test",
          descriptif: "Description objectif test",
          jalon: 1,
          indicateur_cible: "500 agents formés",
          rattachement_code: rattachement.code,
        });

        const fiche = await f.fiche({
          jalon: 1,
          etape_courante: "CONSOLIDATION",
          rattachement_code: rattachement.code,
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

        await f.evaluationObjectif({
          etape_evaluation_id: etapeAutoEvaluation.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 4,
          commentaire: "Bon objectif",
        });

        await f.evaluationObjectif({
          etape_evaluation_id: etapeConsolidation.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 5,
          commentaire: "Excellent objectif",
        });

        await f.evaluationObjectif({
          etape_evaluation_id: etapeInstruction.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 3,
          commentaire: "Objectif instruction",
        });

        await f.evaluationCritere({
          etape_evaluation_id: etapeAutoEvaluation.id,
          critere_id: critere.id,
          auteur_id: utilisateur.id,
          note: 3,
          commentaire: "Critère acceptable",
        });

        await f.evaluationCritere({
          etape_evaluation_id: etapeConsolidation.id,
          critere_id: critere.id,
          auteur_id: utilisateur.id,
          note: 4,
          commentaire: "Critère bon",
        });

        await f.evaluationCritere({
          etape_evaluation_id: etapeInstruction.id,
          critere_id: critere.id,
          auteur_id: utilisateur.id,
          note: 5,
          commentaire: "Critère excellent",
        });

        // When
        const result = await query.run();

        // Then
        expect(result.criteres).toEqual([
          {
            id: critere.id,
            libelle: "Critère test",
            descriptif: "Description critère test",
            type: "SIMPLIFICATION",
            sousCriteres: [],
          },
        ]);
        expect(result.fichesEvaluation).toMatchObject([
          {
            id: fiche.id,
            jalon: 1,
            etapeCourante: "CONSOLIDATION",
            readOnly: false,
            rattachement: {
              code: rattachement.code,
              libelle: "Rattachement test",
              groupe: "Groupe B",
              ordre: 1,
              referentielRattachementGroupe: {
                code: "Groupe B",
                libelle: "Libellé Groupe B",
                ordre: 2,
              },
            },
            noteObjectifsCollectifs: null,
            evaluationsParCritereEtEtape: {
              [critere.id]: {
                AUTO_EVALUATION: 3,
                CONSOLIDATION: 4,
                INSTRUCTION: 5,
              },
            },
            objectifs: [
              {
                id: objectif.id,
                libelle: "Objectif test",
                evaluations: {
                  AUTO_EVALUATION: 4,
                  CONSOLIDATION: 5,
                  INSTRUCTION: 3,
                },
              },
            ],
          },
        ]);
      }),
    );

    it(
      "doit remonter tous les critères",
      createIntegrationTest(async () => {
        // Given
        const critere1 = await f.critere({
          libelle: "Critère A",
          descriptif: "Description critère A",
          type: "COMMUNICATION",
        });

        const critere2 = await f.critere({
          libelle: "Critère B",
          descriptif: "Description critère B",
          type: "SERVICES_PUBLICS",
        });

        const critere3 = await f.critere({
          libelle: "Critère C",
          descriptif: "Description critère C",
          type: "SIMPLIFICATION",
        });

        const groupe = await f.rattachementGroupe({
          code: "Groupe C",
          libelle: "Libellé Groupe C",
          ordre: 3,
        });

        const rattachement = await f.rattachement({
          groupe: groupe.code,
          ordre: 1,
          libelle: "Rattachement critères",
        });

        const fiche = await f.fiche({
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachement.code,
        });

        await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });

        // When
        const result = await query.run();

        // Then
        expect(result.criteres).toEqual([
          {
            id: critere1.id,
            libelle: "Critère A",
            descriptif: "Description critère A",
            type: "COMMUNICATION",
            sousCriteres: [],
          },
          {
            id: critere2.id,
            libelle: "Critère B",
            descriptif: "Description critère B",
            type: "SERVICES_PUBLICS",
            sousCriteres: [],
          },
          {
            id: critere3.id,
            libelle: "Critère C",
            descriptif: "Description critère C",
            type: "SIMPLIFICATION",
            sousCriteres: [],
          },
        ]);
        expect(result.fichesEvaluation[0].evaluationsParCritereEtEtape).toEqual(
          {
            [critere1.id]: {
              AUTO_EVALUATION: null,
              CONSOLIDATION: null,
              INSTRUCTION: null,
            },
            [critere2.id]: {
              AUTO_EVALUATION: null,
              CONSOLIDATION: null,
              INSTRUCTION: null,
            },
            [critere3.id]: {
              AUTO_EVALUATION: null,
              CONSOLIDATION: null,
              INSTRUCTION: null,
            },
          },
        );
      }),
    );

    it(
      "doit remonter uniquement les objectifs liés au rattachement",
      createIntegrationTest(async () => {
        // Given
        await f.critere({
          libelle: "Critère objectifs",
          descriptif: "Description critère objectifs",
          type: "FEUILLE_DE_ROUTE",
        });

        const groupe1 = await f.rattachementGroupe({
          code: "Groupe D",
          libelle: "Libellé Groupe D",
          ordre: 4,
        });

        const groupe2 = await f.rattachementGroupe({
          code: "Groupe E",
          libelle: "Libellé Groupe E",
          ordre: 5,
        });

        const rattachement1 = await f.rattachement({
          groupe: groupe1.code,
          ordre: 1,
          libelle: "Rattachement 1",
        });

        const objectif1 = await f.objectif({
          libelle: "Objectif rattachement 1 - A",
          descriptif: "Description objectif 1A",
          jalon: 2025,
          indicateur_cible: "Cible 1A",
          rattachement_code: rattachement1.code,
        });

        const objectif2 = await f.objectif({
          libelle: "Objectif rattachement 1 - B",
          descriptif: "Description objectif 1B",
          jalon: 2025,
          indicateur_cible: "Cible 1B",
          rattachement_code: rattachement1.code,
        });

        const rattachement2 = await f.rattachement({
          groupe: groupe2.code,
          ordre: 1,
          libelle: "Rattachement 2",
        });

        const objectif3 = await f.objectif({
          libelle: "Objectif rattachement 2",
          descriptif: "Description objectif 2",
          jalon: 2025,
          indicateur_cible: "Cible 2",
          rattachement_code: rattachement2.code,
        });

        const fiche1 = await f.fiche({
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachement1.code,
        });

        const fiche2 = await f.fiche({
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachement2.code,
        });

        await f.etapeEvaluation({
          fiche_evaluation_id: fiche1.id,
          type: "AUTO_EVALUATION",
        });

        await f.etapeEvaluation({
          fiche_evaluation_id: fiche2.id,
          type: "AUTO_EVALUATION",
        });

        // When
        const result = await query.run();

        // Then
        const ficheResult1 = result.fichesEvaluation.find(
          (fiche) => fiche.id === fiche1.id,
        );
        const ficheResult2 = result.fichesEvaluation.find(
          (fiche) => fiche.id === fiche2.id,
        );

        expect(ficheResult1?.objectifs).toEqual([
          {
            id: objectif1.id,
            libelle: "Objectif rattachement 1 - A",
            evaluations: {
              AUTO_EVALUATION: null,
              CONSOLIDATION: null,
              INSTRUCTION: null,
            },
          },
          {
            id: objectif2.id,
            libelle: "Objectif rattachement 1 - B",
            evaluations: {
              AUTO_EVALUATION: null,
              CONSOLIDATION: null,
              INSTRUCTION: null,
            },
          },
        ]);

        expect(ficheResult2?.objectifs).toEqual([
          {
            id: objectif3.id,
            libelle: "Objectif rattachement 2",
            evaluations: {
              AUTO_EVALUATION: null,
              CONSOLIDATION: null,
              INSTRUCTION: null,
            },
          },
        ]);
      }),
    );

    it(
      "doit retourner des listes vides quand aucune fiche ni critère n'existe",
      createIntegrationTest(async () => {
        // When
        const result = await query.run();

        // Then
        expect(result.criteres).toEqual([]);
        expect(result.fichesEvaluation).toEqual([]);
      }),
    );

    it(
      "doit ordonner les fiches par groupe puis par ordre du rattachement",
      createIntegrationTest(async () => {
        // Given
        await f.critere({
          libelle: "Critère ordre",
          descriptif: "Description critère ordre",
          type: "COMMUNICATION",
        });

        const groupeA = await f.rattachementGroupe({
          code: "Groupe A",
          libelle: "Libellé Groupe A",
          ordre: 1,
        });

        const groupeB = await f.rattachementGroupe({
          code: "Groupe B",
          libelle: "Libellé Groupe B",
          ordre: 2,
        });

        const rattachement1 = await f.rattachement({
          code: "REG-01",
          groupe: groupeB.code,
          ordre: 2,
          libelle: "Rattachement B2",
        });

        const rattachement2 = await f.rattachement({
          code: "REG-02",
          groupe: groupeA.code,
          ordre: 2,
          libelle: "Rattachement A2",
        });

        const rattachement3 = await f.rattachement({
          code: "REG-03",
          groupe: groupeB.code,
          ordre: 1,
          libelle: "Rattachement B1",
        });

        const rattachement4 = await f.rattachement({
          code: "REG-04",
          groupe: groupeA.code,
          ordre: 1,
          libelle: "Rattachement A1",
        });

        const fiche1 = await f.fiche({
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachement1.code,
        });

        const fiche2 = await f.fiche({
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachement2.code,
        });

        const fiche3 = await f.fiche({
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachement3.code,
        });

        const fiche4 = await f.fiche({
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachement4.code,
        });

        // When
        const result = await query.run();

        // Then
        expect(result.fichesEvaluation.map((fiche) => fiche.id)).toEqual([
          fiche4.id,
          fiche2.id,
          fiche3.id,
          fiche1.id,
        ]);
        expect(
          result.fichesEvaluation.map((fiche) => fiche.rattachement),
        ).toEqual([
          {
            code: rattachement4.code,
            libelle: "Rattachement A1",
            groupe: "Groupe A",
            ordre: 1,
            referentielRattachementGroupe: {
              code: "Groupe A",
              libelle: "Libellé Groupe A",
              ordre: 1,
            },
          },
          {
            code: rattachement2.code,
            libelle: "Rattachement A2",
            groupe: "Groupe A",
            ordre: 2,
            referentielRattachementGroupe: {
              code: "Groupe A",
              libelle: "Libellé Groupe A",
              ordre: 1,
            },
          },
          {
            code: rattachement3.code,
            libelle: "Rattachement B1",
            groupe: "Groupe B",
            ordre: 1,
            referentielRattachementGroupe: {
              code: "Groupe B",
              libelle: "Libellé Groupe B",
              ordre: 2,
            },
          },
          {
            code: rattachement1.code,
            libelle: "Rattachement B2",
            groupe: "Groupe B",
            ordre: 2,
            referentielRattachementGroupe: {
              code: "Groupe B",
              libelle: "Libellé Groupe B",
              ordre: 2,
            },
          },
        ]);
      }),
    );

    it(
      "doit retourner null pour les moyennes des objectifs et des critères si les évaluations n'existent pas",
      createIntegrationTest(async () => {
        // Given
        await f.critere({
          libelle: "Critère sans évaluation",
          descriptif: "Description critère",
        });

        const groupe = await f.rattachementGroupe({
          code: "Groupe Z",
          libelle: "Groupe rattachement",
          ordre: 1,
        });

        const rattachement = await f.rattachement({
          groupe: groupe.code,
          ordre: 1,
          libelle: "Rattachement sans évaluation",
        });

        await f.objectif({
          libelle: "Objectif sans évaluation",
          descriptif: "Description objectif",
          jalon: 2025,
          indicateur_cible: "Cible test",
          rattachement_code: rattachement.code,
        });

        const fiche = await f.fiche({
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachement.code,
        });

        await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });

        // When
        const result = await query.run();

        // Then
        const ficheResult = result.fichesEvaluation.find(
          (ficheItem) => ficheItem.id === fiche.id,
        );
        expect(ficheResult?.moyennesCriteres).toEqual({
          AUTO_EVALUATION: null,
          CONSOLIDATION: null,
          INSTRUCTION: null,
        });
        expect(ficheResult?.moyennesObjectifs).toEqual({
          AUTO_EVALUATION: null,
          CONSOLIDATION: null,
          INSTRUCTION: null,
        });
      }),
    );

    it(
      "doit remonter les moyennes des évaluations des critères et des objectifs",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur({
          email: "moyennes@example.com",
          nom: "Test",
          prenom: "Moyennes",
        });

        const critere1 = await f.critere({
          libelle: "Critère 1",
          descriptif: "Description critère 1",
        });

        const critere2 = await f.critere({
          libelle: "Critère 2",
          descriptif: "Description critère 2",
        });

        const critere3 = await f.critere({
          libelle: "Critère 3",
          descriptif: "Description critère 3",
        });

        const groupe = await f.rattachementGroupe({
          code: "Groupe Y",
          libelle: "Groupe rattachement",
          ordre: 1,
        });

        const rattachement = await f.rattachement({
          groupe: groupe.code,
          ordre: 1,
          libelle: "Rattachement moyennes",
        });

        const objectif1 = await f.objectif({
          libelle: "Objectif 1",
          descriptif: "Description objectif 1",
          jalon: 2025,
          indicateur_cible: "Cible 1",
          rattachement_code: rattachement.code,
        });

        const objectif2 = await f.objectif({
          libelle: "Objectif 2",
          descriptif: "Description objectif 2",
          jalon: 2025,
          indicateur_cible: "Cible 2",
          rattachement_code: rattachement.code,
        });

        const fiche = await f.fiche({
          jalon: 2025,
          etape_courante: "CONSOLIDATION",
          rattachement_code: rattachement.code,
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

        await f.evaluationCritere({
          etape_evaluation_id: etapeAutoEvaluation.id,
          critere_id: critere1.id,
          auteur_id: utilisateur.id,
          note: 3,
          commentaire: "Auto critère 1",
        });

        await f.evaluationCritere({
          etape_evaluation_id: etapeAutoEvaluation.id,
          critere_id: critere2.id,
          auteur_id: utilisateur.id,
          note: 5,
          commentaire: "Auto critère 2",
        });

        await f.evaluationCritere({
          etape_evaluation_id: etapeConsolidation.id,
          critere_id: critere1.id,
          auteur_id: utilisateur.id,
          note: 2,
          commentaire: "Conso critère 1",
        });

        await f.evaluationCritere({
          etape_evaluation_id: etapeConsolidation.id,
          critere_id: critere3.id,
          auteur_id: utilisateur.id,
          note: 4,
          commentaire: "Conso critère 3",
        });

        await f.evaluationCritere({
          etape_evaluation_id: etapeInstruction.id,
          critere_id: critere2.id,
          auteur_id: utilisateur.id,
          note: 10,
          commentaire: "Instruction critère 2",
        });

        await f.evaluationObjectif({
          etape_evaluation_id: etapeAutoEvaluation.id,
          objectif_id: objectif1.id,
          auteur_id: utilisateur.id,
          note: 4,
          commentaire: "Auto objectif 1",
        });

        await f.evaluationObjectif({
          etape_evaluation_id: etapeAutoEvaluation.id,
          objectif_id: objectif2.id,
          auteur_id: utilisateur.id,
          note: 2,
          commentaire: "Auto objectif 2",
        });

        await f.evaluationObjectif({
          etape_evaluation_id: etapeConsolidation.id,
          objectif_id: objectif1.id,
          auteur_id: utilisateur.id,
          note: 5,
          commentaire: "Conso objectif 1",
        });

        await f.evaluationObjectif({
          etape_evaluation_id: etapeInstruction.id,
          objectif_id: objectif1.id,
          auteur_id: utilisateur.id,
          note: null,
          commentaire: "Instruction objectif 1",
        });

        await f.evaluationObjectif({
          etape_evaluation_id: etapeInstruction.id,
          objectif_id: objectif2.id,
          auteur_id: utilisateur.id,
          note: 5,
          commentaire: "Instruction objectif 2",
        });

        // When
        const result = await query.run();

        // Then
        const ficheResult = result.fichesEvaluation.find(
          (ficheItem) => ficheItem.id === fiche.id,
        );
        expect(ficheResult?.moyennesCriteres).toEqual({
          AUTO_EVALUATION: 4,
          CONSOLIDATION: 3,
          INSTRUCTION: 10,
        });
        expect(ficheResult?.moyennesObjectifs).toEqual({
          AUTO_EVALUATION: 3,
          CONSOLIDATION: 5,
          INSTRUCTION: 5,
        });
      }),
    );

    it(
      "doit retourner null pour la synthèse si une des valeurs est null",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur({
          email: "synthese-null@example.com",
          nom: "Test",
          prenom: "SyntheseNull",
        });

        const critere1 = await f.critere({
          libelle: "Critère synthèse 1",
          descriptif: "Description critère synthèse 1",
        });

        const critere2 = await f.critere({
          libelle: "Critère synthèse 2",
          descriptif: "Description critère synthèse 2",
        });

        const groupe = await f.rattachementGroupe({
          code: "Groupe Synthèse",
          libelle: "Groupe rattachement",
          ordre: 1,
        });

        const rattachement = await f.rattachement({
          groupe: groupe.code,
          ordre: 1,
          libelle: "Rattachement synthèse",
        });

        const objectif1 = await f.objectif({
          libelle: "Objectif synthèse 1",
          descriptif: "Description objectif synthèse 1",
          jalon: 2025,
          indicateur_cible: "Cible synthèse 1",
          rattachement_code: rattachement.code,
        });

        const objectif2 = await f.objectif({
          libelle: "Objectif synthèse 2",
          descriptif: "Description objectif synthèse 2",
          jalon: 2025,
          indicateur_cible: "Cible synthèse 2",
          rattachement_code: rattachement.code,
        });

        const fiche = await f.fiche({
          jalon: 2025,
          etape_courante: "CONSOLIDATION",
          rattachement_code: rattachement.code,
        });

        const etapeAutoEvaluation = await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });

        const etapeConsolidation = await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
        });

        await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "INSTRUCTION",
        });

        await f.evaluationCritere({
          etape_evaluation_id: etapeAutoEvaluation.id,
          critere_id: critere1.id,
          auteur_id: utilisateur.id,
          note: 4,
          commentaire: "Critère auto 1",
        });

        await f.evaluationCritere({
          etape_evaluation_id: etapeConsolidation.id,
          critere_id: critere2.id,
          auteur_id: utilisateur.id,
          note: 3,
          commentaire: "Critère conso 2",
        });

        await f.evaluationObjectif({
          etape_evaluation_id: etapeAutoEvaluation.id,
          objectif_id: objectif1.id,
          auteur_id: utilisateur.id,
          note: 5,
          commentaire: "Objectif auto 1",
        });

        // When
        const result = await query.run();

        // Then
        const ficheResult = result.fichesEvaluation.find(
          (ficheItem) => ficheItem.id === fiche.id,
        );
        expect(ficheResult?.synthese).toEqual({
          AUTO_EVALUATION: null,
          CONSOLIDATION: null,
          INSTRUCTION: null,
        });
      }),
    );

    it(
      "doit retourner la synthèse comme la moyenne pondérée de 0.3*moyennesCriteres + 0.4*moyennesObjectifs + 0.3*noteObjectifsCollectifs",
      createIntegrationTest(async () => {
        // Given
        const prisma = getPrisma();
        const jalon = 2025;

        await prisma.ministere.create({
          data: {
            id: "MIN-SYNTH",
            acronyme: "SYNTH",
            nom: "Ministère Synthèse",
            icone: "icone-synth.svg",
          },
        });

        const utilisateur = await f.utilisateur({
          email: "synthese@example.com",
          nom: "Test",
          prenom: "Synthese",
        });

        const critere1 = await f.critere({
          libelle: "Critère calcul 1",
          descriptif: "Description critère calcul 1",
        });

        const critere2 = await f.critere({
          libelle: "Critère calcul 2",
          descriptif: "Description critère calcul 2",
        });

        const groupe = await f.rattachementGroupe({
          code: "Groupe Calcul",
          libelle: "Groupe rattachement",
          ordre: 1,
        });

        const rattachement = await f.rattachement({
          code: "DEPT-92",
          groupe: groupe.code,
          ordre: 1,
          libelle: "Rattachement calcul",
        });

        const objectif1 = await f.objectif({
          libelle: "Objectif calcul 1",
          descriptif: "Description objectif calcul 1",
          jalon: jalon,
          indicateur_cible: "Cible calcul 1",
          rattachement_code: rattachement.code,
        });

        const objectif2 = await f.objectif({
          libelle: "Objectif calcul 2",
          descriptif: "Description objectif calcul 2",
          jalon: jalon,
          indicateur_cible: "Cible calcul 2",
          rattachement_code: rattachement.code,
        });

        await prisma.chantier_identite.createMany({
          data: [
            {
              id: "CH-301",
              nom: "Chantier Synthèse 1",
              ministeres: ["MIN-SYNTH"],
            },
            {
              id: "CH-302",
              nom: "Chantier Synthèse 2",
              ministeres: ["MIN-SYNTH"],
            },
          ],
        });

        const fiche = await f.fiche({
          jalon: jalon,
          etape_courante: "CONSOLIDATION",
          rattachement_code: rattachement.code,
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

        await prisma.chantier_territoire.createMany({
          data: [
            {
              id: "CH-301",
              territoire_code: rattachement.code,
              code_insee: "92",
              maille: "DEPT",
              zone_id: "zone-synth",
            },
            {
              id: "CH-302",
              territoire_code: rattachement.code,
              code_insee: "92",
              maille: "DEPT",
              zone_id: "zone-synth",
            },
          ],
        });

        await prisma.chantier_territoire_jalon.createMany({
          data: [
            {
              id: "CH-301",
              territoire_code: rattachement.code,
              code_insee: "92",
              maille: "DEPT",
              zone_id: "zone-synth",
              jalon: jalon,
            },
            {
              id: "CH-302",
              territoire_code: rattachement.code,
              code_insee: "92",
              maille: "DEPT",
              zone_id: "zone-synth",
              jalon: jalon,
            },
          ],
        });

        await prisma.chantier_evaluation.createMany({
          data: [
            {
              id: "CH-301",
              territoire_code: rattachement.code,
              code_insee: "92",
              maille: "DEPT",
              zone_id: "zone-synth",
              taux_avancement: 60.0,
              date_calcul: new Date("2025-02-15"),
              jalon: jalon,
            },
            {
              id: "CH-302",
              territoire_code: rattachement.code,
              code_insee: "92",
              maille: "DEPT",
              zone_id: "zone-synth",
              taux_avancement: 80.0,
              date_calcul: new Date("2025-02-15"),
              jalon: jalon,
            },
          ],
        });

        await f.evaluationCritere({
          etape_evaluation_id: etapeAutoEvaluation.id,
          critere_id: critere1.id,
          auteur_id: utilisateur.id,
          note: 2,
          commentaire: "Auto critère 1",
        });

        await f.evaluationCritere({
          etape_evaluation_id: etapeAutoEvaluation.id,
          critere_id: critere2.id,
          auteur_id: utilisateur.id,
          note: 4,
          commentaire: "Auto critère 2",
        });

        await f.evaluationCritere({
          etape_evaluation_id: etapeConsolidation.id,
          critere_id: critere1.id,
          auteur_id: utilisateur.id,
          note: 3,
          commentaire: "Conso critère 1",
        });

        await f.evaluationCritere({
          etape_evaluation_id: etapeConsolidation.id,
          critere_id: critere2.id,
          auteur_id: utilisateur.id,
          note: 5,
          commentaire: "Conso critère 2",
        });

        await f.evaluationCritere({
          etape_evaluation_id: etapeInstruction.id,
          critere_id: critere1.id,
          auteur_id: utilisateur.id,
          note: 4,
          commentaire: "Instruction critère 1",
        });

        await f.evaluationCritere({
          etape_evaluation_id: etapeInstruction.id,
          critere_id: critere2.id,
          auteur_id: utilisateur.id,
          note: 2,
          commentaire: "Instruction critère 2",
        });

        await f.evaluationObjectif({
          etape_evaluation_id: etapeAutoEvaluation.id,
          objectif_id: objectif1.id,
          auteur_id: utilisateur.id,
          note: 5,
          commentaire: "Auto objectif 1",
        });

        await f.evaluationObjectif({
          etape_evaluation_id: etapeAutoEvaluation.id,
          objectif_id: objectif2.id,
          auteur_id: utilisateur.id,
          note: 3,
          commentaire: "Auto objectif 2",
        });

        await f.evaluationObjectif({
          etape_evaluation_id: etapeConsolidation.id,
          objectif_id: objectif1.id,
          auteur_id: utilisateur.id,
          note: 2,
          commentaire: "Conso objectif 1",
        });

        await f.evaluationObjectif({
          etape_evaluation_id: etapeConsolidation.id,
          objectif_id: objectif2.id,
          auteur_id: utilisateur.id,
          note: 4,
          commentaire: "Conso objectif 2",
        });

        await f.evaluationObjectif({
          etape_evaluation_id: etapeInstruction.id,
          objectif_id: objectif1.id,
          auteur_id: utilisateur.id,
          note: 1,
          commentaire: "Instruction objectif 1",
        });

        await f.evaluationObjectif({
          etape_evaluation_id: etapeInstruction.id,
          objectif_id: objectif2.id,
          auteur_id: utilisateur.id,
          note: 5,
          commentaire: "Instruction objectif 2",
        });

        // When
        const result = await query.run();

        // Then
        const ficheResult = result.fichesEvaluation.find(
          (ficheItem) => ficheItem.id === fiche.id,
        );
        expect(ficheResult?.synthese).toEqual({
          AUTO_EVALUATION: 24,
          CONSOLIDATION: 23,
          INSTRUCTION: 23,
        });
      }),
    );

    it(
      "doit calculer la noteObjectifsCollectifs comme moyenne des taux d'avancement des chantiers",
      createIntegrationTest(async () => {
        // Given
        const prisma = getPrisma();
        const jalon = 2025;

        await prisma.ministere.create({
          data: {
            id: "MIN-TEST",
            acronyme: "TEST",
            nom: "Ministère Test",
            icone: "icone-test.svg",
          },
        });

        await f.critere({
          libelle: "Critère test objectifs collectifs",
          descriptif: "Description critère test",
          type: "SERVICES_PUBLICS",
        });

        const groupe = await f.rattachementGroupe({
          code: "Groupe Test",
          libelle: "Libellé Groupe Test",
          ordre: 1,
        });

        const rattachement = await f.rattachement({
          code: "DEPT-91",
          groupe: groupe.code,
          ordre: 1,
          libelle: "Rattachement Test",
        });

        await prisma.chantier_identite.createMany({
          data: [
            {
              id: "CH-201",
              nom: "Chantier Test 1",
              ministeres: ["MIN-TEST"],
            },
            {
              id: "CH-202",
              nom: "Chantier Test 2",
              ministeres: ["MIN-TEST"],
            },
            {
              id: "CH-203",
              nom: "Chantier Test 3",
              ministeres: ["MIN-TEST"],
            },
          ],
        });

        const fiche = await f.fiche({
          jalon: jalon,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachement.code,
        });

        await prisma.chantier_territoire.createMany({
          data: [
            {
              id: "CH-201",
              territoire_code: rattachement.code,
              code_insee: "91",
              maille: "DEPT",
              zone_id: "zone-test",
            },
            {
              id: "CH-202",
              territoire_code: rattachement.code,
              code_insee: "91",
              maille: "DEPT",
              zone_id: "zone-test",
            },
            {
              id: "CH-203",
              territoire_code: rattachement.code,
              code_insee: "91",
              maille: "DEPT",
              zone_id: "zone-test",
            },
          ],
        });

        await prisma.chantier_territoire_jalon.createMany({
          data: [
            {
              id: "CH-201",
              territoire_code: rattachement.code,
              code_insee: "91",
              maille: "DEPT",
              zone_id: "zone-test",
              jalon: jalon,
            },
            {
              id: "CH-202",
              territoire_code: rattachement.code,
              code_insee: "91",
              maille: "DEPT",
              zone_id: "zone-test",
              jalon: jalon,
            },
            {
              id: "CH-203",
              territoire_code: rattachement.code,
              code_insee: "91",
              maille: "DEPT",
              zone_id: "zone-test",
              jalon: jalon,
            },
          ],
        });

        await prisma.chantier_evaluation.createMany({
          data: [
            {
              id: "CH-201",
              territoire_code: rattachement.code,
              code_insee: "91",
              maille: "DEPT",
              zone_id: "zone-test",
              taux_avancement: 70.0,
              date_calcul: new Date("2025-02-15"),
              jalon: jalon,
            },
            {
              id: "CH-202",
              territoire_code: rattachement.code,
              code_insee: "91",
              maille: "DEPT",
              zone_id: "zone-test",
              taux_avancement: 80.0,
              date_calcul: new Date("2025-02-15"),
              jalon: jalon,
            },
            {
              id: "CH-203",
              territoire_code: rattachement.code,
              code_insee: "91",
              maille: "DEPT",
              zone_id: "zone-test",
              taux_avancement: null,
              date_calcul: new Date("2025-02-15"),
              jalon: jalon,
            },
          ],
        });

        // When
        const result = await query.run();

        // Then
        const ficheResult = result.fichesEvaluation.find(
          (ficheItem) => ficheItem.id === fiche.id,
        );
        expect(ficheResult?.noteObjectifsCollectifs).toEqual(75);
      }),
    );
  });
});

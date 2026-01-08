import { $Enums } from "@prisma/client";
import { AfficherAutoEvaluationQuery } from "@/server/evaluation/queries/AfficherAutoEvaluationQuery";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("AfficherAutoEvaluationQuery", () => {
  let query: AfficherAutoEvaluationQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new AfficherAutoEvaluationQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "doit retourner les critères et objectifs avec des évaluations vides par défaut",
      createIntegrationTest(async () => {
        // Given
        const critere1 = await fixtures.critere({
          libelle: "Critère 1",
          descriptif: "Description critère 1",
        });
        const sousCritere1 = await fixtures.sousCritere({
          parent_id: critere1.id,
          libelle: "Sous-critère 1",
          descriptif: "Description sous-critère 1",
        });

        const critere2 = await fixtures.critere({
          libelle: "Critère 2",
          descriptif: "Description critère 2",
        });
        const sousCritere2 = await fixtures.sousCritere({
          parent_id: critere2.id,
          libelle: "Sous-critère 2",
          descriptif: "Description sous-critère 2",
        });

        const rattachement = await fixtures.rattachement();

        const objectif1 = await fixtures.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif 1",
          descriptif: "Description objectif 1",
          jalon: 2025,
          indicateur_cible: "75% de taux de réussite",
        });
        const objectif2 = await fixtures.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif 2",
          descriptif: "Description objectif 2",
          jalon: 2025,
          indicateur_cible: "Réduction de 30% des coûts",
        });

        const fiche = await fixtures.fiche({
          rattachement_code: rattachement.code,
          jalon: 2025,
          etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        });

        await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        });

        // When
        const result = await query.run({ ficheEvaluationId: fiche.id });

        // Then
        expect(result.criteres).toEqual([
          {
            id: critere1.id,
            libelle: "Critère 1",
            descriptif: "Description critère 1",
            evaluation: {
              id: expect.any(String),
              note: null,
              commentaire: "",
              annexe: "",
            },
            sousCriteres: [
              {
                id: sousCritere1.id,
                libelle: "Sous-critère 1",
                descriptif: "Description sous-critère 1",
              },
            ],
          },
          {
            id: critere2.id,
            libelle: "Critère 2",
            descriptif: "Description critère 2",
            evaluation: {
              id: expect.any(String),
              note: null,
              commentaire: "",
              annexe: "",
            },
            sousCriteres: [
              {
                id: sousCritere2.id,
                libelle: "Sous-critère 2",
                descriptif: "Description sous-critère 2",
              },
            ],
          },
        ]);
        expect(result.objectifs).toEqual([
          {
            id: objectif1.id,
            libelle: "Objectif 1",
            descriptif: "Description objectif 1",
            indicateurCible: "75% de taux de réussite",
            evaluation: {
              id: expect.any(String),
              note: null,
              commentaire: "",
              annexe: "",
            },
          },
          {
            id: objectif2.id,
            libelle: "Objectif 2",
            descriptif: "Description objectif 2",
            indicateurCible: "Réduction de 30% des coûts",
            evaluation: {
              id: expect.any(String),
              note: null,
              commentaire: "",
              annexe: "",
            },
          },
        ]);
        expect(result.readOnly).toBe(false);
        expect(result.dateDerniereModification).toBeDefined();
      }),
    );

    it(
      "doit retourner les critères et objectifs avec évaluations quand elles existent",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();

        const critere = await fixtures.critere({
          libelle: "Critère test",
          descriptif: "Description critère test",
        });
        const sousCritere = await fixtures.sousCritere({
          parent_id: critere.id,
          libelle: "Sous-critère test",
          descriptif: "Description sous-critère test",
        });

        const rattachement = await fixtures.rattachement();
        const objectif = await fixtures.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif test",
          descriptif: "Description objectif test",
          jalon: 1,
          indicateur_cible: "500 agents formés",
        });

        const fiche = await fixtures.fiche({
          rattachement_code: rattachement.code,
          jalon: 1,
          etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        });

        const etape = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          objectifs_valides: true,
        });

        const evaluationObjectif = await fixtures.evaluationObjectif({
          etape_evaluation_id: etape.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 4,
          commentaire: "Bon objectif",
          annexe: "Une annexe",
        });

        const evaluationCritere = await fixtures.evaluationCritere({
          etape_evaluation_id: etape.id,
          critere_id: critere.id,
          auteur_id: utilisateur.id,
          note: 3,
          commentaire: "Critère acceptable",
          annexe: "Annexe critere",
        });

        // When
        const result = await query.run({ ficheEvaluationId: fiche.id });

        // Then
        expect(result.criteres).toEqual([
          {
            id: critere.id,
            libelle: "Critère test",
            descriptif: "Description critère test",
            evaluation: {
              id: evaluationCritere.id,
              note: 3,
              commentaire: "Critère acceptable",
              annexe: "Annexe critere",
            },
            sousCriteres: [
              {
                id: sousCritere.id,
                libelle: "Sous-critère test",
                descriptif: "Description sous-critère test",
              },
            ],
          },
        ]);
        expect(result.objectifs).toEqual([
          {
            id: objectif.id,
            libelle: "Objectif test",
            descriptif: "Description objectif test",
            indicateurCible: "500 agents formés",
            evaluation: {
              id: evaluationObjectif.id,
              note: 4,
              commentaire: "Bon objectif",
              annexe: "Une annexe",
            },
          },
        ]);
        expect(result.readOnly).toBe(false);
        expect(result.isObjectifsValides).toBe(true);
        expect(result.isCriteresValides).toBe(false);
      }),
    );

    it(
      "doit retourner readOnly=true quand l'étape courante n'est pas AUTO_EVALUATION",
      createIntegrationTest(async () => {
        // Given
        const rattachement = await fixtures.rattachement();

        const fiche = await fixtures.fiche({
          rattachement_code: rattachement.code,
          jalon: 1,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });

        await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        });

        // When
        const result = await query.run({ ficheEvaluationId: fiche.id });

        // Then
        expect(result.readOnly).toBe(true);
      }),
    );

    it(
      "doit gérer plusieurs sous-critères par critère",
      createIntegrationTest(async () => {
        // Given
        const critere = await fixtures.critere({
          libelle: "Critère multiple",
          descriptif: "Description critère multiple",
        });

        const sousCritere1 = await fixtures.sousCritere({
          parent_id: critere.id,
          libelle: "Sous-critère 1",
          descriptif: "Description 1",
        });
        const sousCritere2 = await fixtures.sousCritere({
          parent_id: critere.id,
          libelle: "Sous-critère 2",
          descriptif: "Description 2",
        });
        const sousCritere3 = await fixtures.sousCritere({
          parent_id: critere.id,
          libelle: "Sous-critère 3",
          descriptif: "Description 3",
        });

        const rattachement = await fixtures.rattachement();

        const fiche = await fixtures.fiche({
          rattachement_code: rattachement.code,
          jalon: 1,
          etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        });

        await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        });

        // When
        const result = await query.run({ ficheEvaluationId: fiche.id });

        // Then
        expect(result.criteres).toEqual([
          {
            id: critere.id,
            libelle: "Critère multiple",
            descriptif: "Description critère multiple",
            evaluation: {
              id: expect.any(String),
              note: null,
              commentaire: "",
              annexe: "",
            },
            sousCriteres: [
              {
                id: sousCritere1.id,
                libelle: "Sous-critère 1",
                descriptif: "Description 1",
              },
              {
                id: sousCritere2.id,
                libelle: "Sous-critère 2",
                descriptif: "Description 2",
              },
              {
                id: sousCritere3.id,
                libelle: "Sous-critère 3",
                descriptif: "Description 3",
              },
            ],
          },
        ]);
      }),
    );

    it(
      "ne doit pas récupérer les évaluations d'autres étapes",
      createIntegrationTest(async () => {
        // Given
        const utilisateur2 = await fixtures.utilisateur();

        const critere = await fixtures.critere({
          libelle: "Critère isolation",
          descriptif: "Description critère isolation",
        });
        const sousCritere = await fixtures.sousCritere({
          parent_id: critere.id,
          libelle: "Sous-critère isolation",
          descriptif: "Description sous-critère isolation",
        });

        const rattachement = await fixtures.rattachement();
        await fixtures.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif isolation",
          descriptif: "Description objectif isolation",
          jalon: 2025,
          indicateur_cible: "100% de couverture territoriale",
        });

        const fiche = await fixtures.fiche({
          rattachement_code: rattachement.code,
          jalon: 2025,
          etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        });

        await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        });
        const etapeConsolidation = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });

        await fixtures.evaluationCritere({
          etape_evaluation_id: etapeConsolidation.id,
          critere_id: critere.id,
          auteur_id: utilisateur2.id,
          note: 5,
          commentaire: "Évaluation de consolidation",
          annexe: "",
        });

        // When
        const result = await query.run({ ficheEvaluationId: fiche.id });

        expect(result.criteres).toEqual([
          {
            id: critere.id,
            libelle: "Critère isolation",
            descriptif: "Description critère isolation",
            evaluation: {
              id: expect.any(String),
              note: null,
              commentaire: "",
              annexe: "",
            },
            sousCriteres: [
              {
                id: sousCritere.id,
                libelle: "Sous-critère isolation",
                descriptif: "Description sous-critère isolation",
              },
            ],
          },
        ]);
      }),
    );

    it(
      "ne doit pas récupérer les objectifs d'autres rattachements",
      createIntegrationTest(async () => {
        // Given
        const rattachement1 = await fixtures.rattachement();
        const rattachement2 = await fixtures.rattachement();

        await fixtures.objectif({
          rattachement_code: rattachement2.code,
          libelle: "Objectif rattachement 2",
          descriptif: "Description objectif rattachement 2",
          jalon: 2025,
          indicateur_cible: "25 démarches dématérialisées",
        });

        const fiche1 = await fixtures.fiche({
          rattachement_code: rattachement1.code,
          jalon: 2025,
          etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        });

        await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche1.id,
          type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        });

        await fixtures.fiche({
          rattachement_code: rattachement2.code,
          jalon: 2025,
          etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        });

        // When
        const result = await query.run({ ficheEvaluationId: fiche1.id });

        // Then
        expect(result.objectifs).toEqual([]);
      }),
    );
  });
});

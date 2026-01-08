import { $Enums } from "@prisma/client";
import { ListerFichesAutoEvaluationQuery } from "@/server/evaluation/queries/ListerFichesAutoEvaluationQuery";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures as f } from "@/server/infrastructure/test/fixtures";

describe("ListerFichesAutoEvaluationQuery", () => {
  let query: ListerFichesAutoEvaluationQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerFichesAutoEvaluationQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "doit retourner plusieurs fiches quand l'utilisateur a des permissions sur l'étape AUTO_EVALUATION pour plusieurs rattachements",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur();
        const rattachement1 = await f.rattachement({
          libelle: "Rattachement 1",
        });
        const rattachement2 = await f.rattachement({
          ordre: 1,
          libelle: "Rattachement 2",
        });

        await f.rattachementUtilisateurEtapeJalon({
          rattachement_code: rattachement1.code,
          utilisateur_id: utilisateur.id,
          etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          jalon: 2025,
        });
        await f.rattachementUtilisateurEtapeJalon({
          rattachement_code: rattachement2.code,
          utilisateur_id: utilisateur.id,
          etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          jalon: 2025,
        });

        const fiche1 = await f.fiche({
          jalon: 2025,
          etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          rattachement_code: rattachement1.code,
        });

        await f.etapeEvaluation({
          fiche_evaluation_id: fiche1.id,
          type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        });

        const fiche2 = await f.fiche({
          jalon: 2025,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
          rattachement_code: rattachement2.code,
        });

        await f.etapeEvaluation({
          fiche_evaluation_id: fiche2.id,
          type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        });

        // When
        const result = await query.run({ utilisateurId: utilisateur.id });

        // Then
        expect(result).toEqual([
          {
            id: fiche1.id,
            etapeCourante: "AUTO_EVALUATION",
            isObjectifsValides: false,
            isCriteresValides: false,
            rattachement: {
              code: rattachement1.code,
              libelle: "Rattachement 1",
            },
            objectifs: {
              moyenne: null,
              nombreNotes: 0,
              nombreTotal: 0,
            },
            criteres: {
              moyenne: null,
              nombreNotes: 0,
              nombreTotal: 0,
            },
            noteCollective: null,
          },
          {
            id: fiche2.id,
            etapeCourante: "CONSOLIDATION",
            isObjectifsValides: false,
            isCriteresValides: false,
            rattachement: {
              code: rattachement2.code,
              libelle: "Rattachement 2",
            },
            objectifs: {
              moyenne: null,
              nombreNotes: 0,
              nombreTotal: 0,
            },
            criteres: {
              moyenne: null,
              nombreNotes: 0,
              nombreTotal: 0,
            },
            noteCollective: null,
          },
        ]);
      }),
    );

    it(
      "ne doit pas retourner de fiche quand l'utilisateur n'a aucune permission",
      createIntegrationTest(async () => {
        // Given
        const utilisateurSansPermission = await f.utilisateur();
        const utilisateurAvecPermission = await f.utilisateur();
        const rattachement = await f.rattachement({
          libelle: "Rattachement réservé",
        });

        await f.rattachementUtilisateurEtapeJalon({
          rattachement_code: rattachement.code,
          utilisateur_id: utilisateurAvecPermission.id,
          etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          jalon: 2025,
        });

        const fiche = await f.fiche({
          jalon: 2025,
          etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          rattachement_code: rattachement.code,
        });

        await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        });

        // When
        const result = await query.run({
          utilisateurId: utilisateurSansPermission.id,
        });

        // Then
        expect(result).toEqual([]);
      }),
    );

    it(
      "ne doit pas retourner de fiche quand l'utilisateur a une permission pour une étape différente",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur();
        const rattachement = await f.rattachement({
          libelle: "Rattachement consolidation",
        });

        // User has permission for CONSOLIDATION, not AUTO_EVALUATION
        await f.rattachementUtilisateurEtapeJalon({
          rattachement_code: rattachement.code,
          utilisateur_id: utilisateur.id,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
          jalon: 2025,
        });

        const fiche = await f.fiche({
          jalon: 2025,
          etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          rattachement_code: rattachement.code,
        });

        await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        });

        // When
        const result = await query.run({ utilisateurId: utilisateur.id });

        // Then
        expect(result).toEqual([]);
      }),
    );

    it(
      "doit calculer la note collective à partir des chantiers_evaluation de la dernière date_calcul",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur({
          email: "user-note-collective@example.com",
          nom: "UserNoteCollective",
          prenom: "Test",
        });

        const rattachementGroupe = await f.rattachementGroupe();
        const rattachement = await f.rattachement({
          groupe: rattachementGroupe.code,
          libelle: "Rattachement avec note collective",
        });

        const chantier1 = await f.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 1",
        });
        const chantier2 = await f.chantierIdentite({
          id: "CH-002",
          nom: "Chantier 2",
        });
        const chantier3 = await f.chantierIdentite({
          id: "CH-003",
          nom: "Chantier 3",
        });

        const territoire = await f.territoire({
          code: rattachement.code,
        });

        await f.chantierTerritoire({
          id: chantier1.id,
          territoire_code: territoire.code,
          code_insee: "84",
          maille: "REG",
          zone_id: "zone-2",
        });
        await f.chantierTerritoire({
          id: chantier2.id,
          territoire_code: territoire.code,
          code_insee: "84",
          maille: "REG",
          zone_id: "zone-2",
        });
        await f.chantierTerritoire({
          id: chantier3.id,
          territoire_code: territoire.code,
          code_insee: "84",
          maille: "REG",
          zone_id: "zone-2",
        });

        await f.chantierTerritoireJalon({
          id: chantier1.id,
          territoire_code: territoire.code,
          code_insee: "84",
          maille: "REG",
          zone_id: "zone-2",
          jalon: 2025,
          taux_avancement: 68.0,
        });
        await f.chantierTerritoireJalon({
          id: chantier2.id,
          territoire_code: territoire.code,
          code_insee: "84",
          maille: "REG",
          zone_id: "zone-2",
          jalon: 2025,
          taux_avancement: 73.0,
        });
        await f.chantierTerritoireJalon({
          id: chantier3.id,
          territoire_code: territoire.code,
          code_insee: "84",
          maille: "REG",
          zone_id: "zone-2",
          jalon: 2025,
          taux_avancement: 73.0,
        });

        await f.rattachementUtilisateurEtapeJalon({
          rattachement_code: rattachement.code,
          utilisateur_id: utilisateur.id,
          etape: "AUTO_EVALUATION",
          jalon: 2025,
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

        // Older chantier_evaluation data (should be ignored)
        await f.chantierEvaluation({
          id: chantier1.id,
          territoire_code: territoire.code,
          code_insee: "75",
          maille: "DEPT",
          zone_id: "zone-1",
          taux_avancement: 50,
          date_calcul: new Date("2025-01-10"),
          jalon: 2025,
        });
        await f.chantierEvaluation({
          id: chantier2.id,
          territoire_code: territoire.code,
          code_insee: "75",
          maille: "DEPT",
          zone_id: "zone-1",
          taux_avancement: 60,
          date_calcul: new Date("2025-01-10"),
          jalon: 2025,
        });

        // Latest chantier_evaluation data (should be used for calculation)
        await f.chantierEvaluation({
          id: chantier1.id,
          territoire_code: territoire.code,
          code_insee: "75",
          maille: "DEPT",
          zone_id: "zone-1",
          taux_avancement: 75.5,
          date_calcul: new Date("2025-01-15"),
          jalon: 2025,
        });
        await f.chantierEvaluation({
          id: chantier2.id,
          territoire_code: territoire.code,
          code_insee: "75",
          maille: "DEPT",
          zone_id: "zone-1",
          taux_avancement: 84.5,
          date_calcul: new Date("2025-01-15"),
          jalon: 2025,
        });
        await f.chantierEvaluation({
          id: chantier3.id,
          territoire_code: territoire.code,
          code_insee: "75",
          maille: "DEPT",
          zone_id: "zone-1",
          taux_avancement: null,
          date_calcul: new Date("2025-01-15"),
          jalon: 2025,
        });

        // When
        const result = await query.run({ utilisateurId: utilisateur.id });

        // Then
        expect(result).toEqual([
          {
            id: fiche.id,
            etapeCourante: "AUTO_EVALUATION",
            isObjectifsValides: false,
            isCriteresValides: false,
            rattachement: {
              code: rattachement.code,
              libelle: "Rattachement avec note collective",
            },
            objectifs: {
              moyenne: null,
              nombreNotes: 0,
              nombreTotal: 0,
            },
            criteres: {
              moyenne: null,
              nombreNotes: 0,
              nombreTotal: 0,
            },
            noteCollective: 80,
          },
        ]);
      }),
    );
  });
});

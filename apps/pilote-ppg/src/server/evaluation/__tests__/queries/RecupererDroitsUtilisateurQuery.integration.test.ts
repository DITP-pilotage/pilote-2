import { $Enums } from "@prisma/client";
import { RecupererDroitsUtilisateurQuery } from "@/server/evaluation/queries/RecupererDroitsUtilisateurQuery";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("RecupererDroitsUtilisateurQuery", () => {
  let query: RecupererDroitsUtilisateurQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererDroitsUtilisateurQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne les rattachements pour AUTO_EVALUATION",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur({
          email: "test-droits@example.com",
        });

        const rattachement1 = await fixtures.rattachement();
        const rattachement2 = await fixtures.rattachement();
        const rattachement3 = await fixtures.rattachement();

        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur.id,
          rattachement_code: rattachement1.code,
          etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          jalon: 2025,
        });
        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur.id,
          rattachement_code: rattachement2.code,
          etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          jalon: 2025,
        });
        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur.id,
          rattachement_code: rattachement3.code,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
          jalon: 2025,
        });

        // When
        const resultat = await query.run({
          utilisateurId: utilisateur.id,
          jalon: 2025,
        });

        // Then
        expect(resultat.email).toEqual("test-droits@example.com");
        expect(
          resultat.droitsUtilisateur.autoEvaluation.rattachementCodes,
        ).toEqual(
          expect.arrayContaining([rattachement1.code, rattachement2.code]),
        );
        expect(
          resultat.droitsUtilisateur.autoEvaluation.rattachementCodes,
        ).toHaveLength(2);
      }),
    );

    it(
      "retourne les rattachements pour CONSOLIDATION",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();

        const rattachement1 = await fixtures.rattachement();
        const rattachement2 = await fixtures.rattachement();
        const rattachement3 = await fixtures.rattachement();

        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur.id,
          rattachement_code: rattachement1.code,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
          jalon: 2025,
        });
        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur.id,
          rattachement_code: rattachement2.code,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
          jalon: 2025,
        });
        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur.id,
          rattachement_code: rattachement3.code,
          etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          jalon: 2025,
        });

        // When
        const resultat = await query.run({
          utilisateurId: utilisateur.id,
          jalon: 2025,
        });

        // Then
        expect(
          resultat.droitsUtilisateur.consolidation.rattachementCodes,
        ).toEqual(
          expect.arrayContaining([rattachement1.code, rattachement2.code]),
        );
        expect(
          resultat.droitsUtilisateur.consolidation.rattachementCodes,
        ).toHaveLength(2);
      }),
    );

    it(
      "retourne les rattachements des objectifs sur lesquels l'utilisateur a des droits en INSTRUCTION",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();

        const rattachement1 = await fixtures.rattachement();
        const rattachement2 = await fixtures.rattachement();
        const rattachement3 = await fixtures.rattachement();

        const objectif1 = await fixtures.objectif({
          rattachement_code: rattachement1.code,
          jalon: 2025,
        });
        const objectif2 = await fixtures.objectif({
          rattachement_code: rattachement2.code,
          jalon: 2025,
        });

        const rattachementEtape1 =
          await fixtures.rattachementUtilisateurEtapeJalon({
            utilisateur_id: utilisateur.id,
            rattachement_code: rattachement1.code,
            etape: $Enums.etape_evaluation_enum.INSTRUCTION,
            jalon: 2025,
          });

        const rattachementEtape2 =
          await fixtures.rattachementUtilisateurEtapeJalon({
            utilisateur_id: utilisateur.id,
            rattachement_code: rattachement2.code,
            etape: $Enums.etape_evaluation_enum.INSTRUCTION,
            jalon: 2025,
          });

        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur.id,
          rattachement_code: rattachement3.code,
          etape: $Enums.etape_evaluation_enum.INSTRUCTION,
          jalon: 2025,
        });

        await fixtures.instructionObjectif({
          rattachement_utilisateur_etape_jalon_id: rattachementEtape1.id,
          objectif_id: objectif1.id,
        });
        await fixtures.instructionObjectif({
          rattachement_utilisateur_etape_jalon_id: rattachementEtape2.id,
          objectif_id: objectif2.id,
        });

        // When
        const resultat = await query.run({
          utilisateurId: utilisateur.id,
          jalon: 2025,
        });

        // Then
        expect(
          resultat.droitsUtilisateur.instructionObjectifs.rattachementCodes,
        ).toEqual(
          expect.arrayContaining([rattachement1.code, rattachement2.code]),
        );
        expect(
          resultat.droitsUtilisateur.instructionObjectifs.rattachementCodes,
        ).toHaveLength(2);
      }),
    );

    it(
      "retourne les critères pour INSTRUCTION",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const rattachement = await fixtures.rattachement();

        const rattachementEtape =
          await fixtures.rattachementUtilisateurEtapeJalon({
            utilisateur_id: utilisateur.id,
            rattachement_code: rattachement.code,
            etape: $Enums.etape_evaluation_enum.INSTRUCTION,
            jalon: 2025,
          });

        const critere1 = await fixtures.critere();
        const critere2 = await fixtures.critere();
        await fixtures.critere();

        await fixtures.instructionCritere({
          rattachement_utilisateur_etape_jalon_id: rattachementEtape.id,
          critere_id: critere1.id,
        });
        await fixtures.instructionCritere({
          rattachement_utilisateur_etape_jalon_id: rattachementEtape.id,
          critere_id: critere2.id,
        });

        // When
        const resultat = await query.run({
          utilisateurId: utilisateur.id,
          jalon: 2025,
        });

        // Then
        expect(
          resultat.droitsUtilisateur.instructionManiereDeServir.critereCodes,
        ).toEqual(expect.arrayContaining([critere1.id, critere2.id]));
        expect(
          resultat.droitsUtilisateur.instructionManiereDeServir.critereCodes,
        ).toHaveLength(2);
      }),
    );

    it(
      "ne retourne que les droits pour le jalon spécifié",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const rattachement2025 = await fixtures.rattachement();
        const rattachement2024 = await fixtures.rattachement();

        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur.id,
          rattachement_code: rattachement2025.code,
          etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          jalon: 2025,
        });
        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur.id,
          rattachement_code: rattachement2024.code,
          etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          jalon: 2024,
        });

        // When
        const resultat = await query.run({
          utilisateurId: utilisateur.id,
          jalon: 2025,
        });

        // Then
        expect(
          resultat.droitsUtilisateur.autoEvaluation.rattachementCodes,
        ).toEqual([rattachement2025.code]);
        expect(
          resultat.droitsUtilisateur.autoEvaluation.rattachementCodes,
        ).not.toContain(rattachement2024.code);
      }),
    );

    it(
      "retourne des tableaux vides si l'utilisateur n'a aucun droit",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur({
          email: "test-droits@example.com",
        });

        // When
        const resultat = await query.run({
          utilisateurId: utilisateur.id,
          jalon: 2025,
        });

        // Then
        expect(resultat).toEqual({
          email: "test-droits@example.com",
          droitsUtilisateur: {
            autoEvaluation: {
              rattachementCodes: [],
            },
            consolidation: {
              rattachementCodes: [],
            },
            instructionObjectifs: {
              rattachementCodes: [],
            },
            instructionManiereDeServir: {
              critereCodes: [],
            },
          },
        });
      }),
    );
  });
});

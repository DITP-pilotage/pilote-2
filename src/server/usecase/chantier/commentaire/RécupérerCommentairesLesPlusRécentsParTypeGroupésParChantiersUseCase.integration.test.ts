import CommentaireSQLRepository, {
  CODES_TYPES_COMMENTAIRES,
} from "@/server/infrastructure/accès_données/chantier/commentaire/CommentaireSQLRepository";
import Utilisateur from "@/server/domain/utilisateur/Utilisateur.interface";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase from "./RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase";

describe("RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase", () => {
  const commentaireRepository = new CommentaireSQLRepository();
  const récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase =
    new RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase(
      commentaireRepository,
    );

  it(
    "Retourne les bons libellé des auteurs",
    createIntegrationTest(async () => {
      // Given
      const auteur = await fixtures.utilisateur({
        nom: "Lasne",
        prenom: "Paul",
      });
      const chantier003 = await fixtures.chantierIdentite();
      const chantier004 = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier003.id,
        territoire_code: "DEPT-75",
        maille: "DEPT",
        code_insee: "75",
      });
      await fixtures.chantierTerritoire({
        id: chantier004.id,
        territoire_code: "DEPT-75",
        maille: "DEPT",
        code_insee: "75",
      });

      await fixtures.commentaire({
        chantier_id: chantier003.id,
        territoire_code: "DEPT-75",
        maille: "DEPT",
        code_insee: "75",
        type: CODES_TYPES_COMMENTAIRES["commentairesSurLesDonnées"],
        auteur_modification_id: null,
      });
      await fixtures.commentaire({
        chantier_id: chantier004.id,
        territoire_code: "DEPT-75",
        maille: "DEPT",
        code_insee: "75",
        type: CODES_TYPES_COMMENTAIRES["commentairesSurLesDonnées"],
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
      });

      const habilitation = {
        lecture: {
          chantiers: [chantier003.id, chantier004.id],
          territoires: ["DEPT-75"],
        },
      } as unknown as Utilisateur["habilitations"];

      // When
      const résultat =
        await récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase.run(
          [chantier003.id, chantier004.id],
          "DEPT-75",
          habilitation,
        );

      // Then
      expect(résultat[chantier003.id][0]?.auteur).toStrictEqual(
        "Auteur Inconnu",
      );
      expect(résultat[chantier004.id][0]?.auteur).toStrictEqual("Paul Lasne");
    }),
  );

  describe("Pour la maille nationale", () => {
    it(
      "Retourne un objet contenant les commentaires les plus récents de chaque type groupés par chantier id",
      createIntegrationTest(async () => {
        // Given
        const chantier = await fixtures.chantierIdentite();
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
        });
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
        });
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-93",
          maille: "DEPT",
          code_insee: "93",
        });

        // "solutionsEtActionsÀVenir" maille nationale - ne doit pas être éclipsé par le plus récent en maille départementale
        const commentaireSolutionsNational = await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          type: CODES_TYPES_COMMENTAIRES["solutionsEtActionsÀVenir"],
          date_modification: new Date("2023-04-19"),
        });
        // "solutionsEtActionsÀVenir" maille départementale plus récent - ne doit pas être retourné pour NAT-FR
        await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          type: CODES_TYPES_COMMENTAIRES["solutionsEtActionsÀVenir"],
          date_modification: new Date("2023-04-20"),
        });
        // "risquesEtFreinsÀLever" le plus récent
        const commentaireRisquesPlusRécent = await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          type: CODES_TYPES_COMMENTAIRES["risquesEtFreinsÀLever"],
          date_modification: new Date("2023-04-19"),
        });
        // "risquesEtFreinsÀLever" moins récent - ne doit pas être retourné
        await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          type: CODES_TYPES_COMMENTAIRES["risquesEtFreinsÀLever"],
          date_modification: new Date("2023-04-18"),
        });
        const commentaireExemples = await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          type: CODES_TYPES_COMMENTAIRES["exemplesConcretsDeRéussite"],
          date_modification: new Date("2023-04-19"),
        });
        // "autresRésultatsObtenus" maille départementale - ne doit pas être retourné pour NAT-FR
        await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          type: CODES_TYPES_COMMENTAIRES["autresRésultatsObtenus"],
          date_modification: new Date("2023-04-19"),
        });
        const commentaireAutresNonCorrélés = await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          type: CODES_TYPES_COMMENTAIRES[
            "autresRésultatsObtenusNonCorrélésAuxIndicateurs"
          ],
          date_modification: new Date("2023-04-19"),
        });
        // "commentairesSurLesDonnées" maille départementale - ne doit pas être retourné pour NAT-FR
        await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "DEPT-93",
          maille: "DEPT",
          code_insee: "93",
          type: CODES_TYPES_COMMENTAIRES["commentairesSurLesDonnées"],
          date_modification: new Date("2023-04-19"),
        });
        await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          type: CODES_TYPES_COMMENTAIRES["commentairesSurLesDonnées"],
          date_modification: new Date("2023-04-19"),
        });

        const habilitation = {
          lecture: { chantiers: [chantier.id], territoires: ["NAT-FR"] },
        } as unknown as Utilisateur["habilitations"];

        // When
        const résultat =
          await récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase.run(
            [chantier.id],
            "NAT-FR",
            habilitation,
          );

        // Then
        expect(résultat).toStrictEqual({
          [chantier.id]: [
            {
              id: commentaireSolutionsNational.id,
              contenu: commentaireSolutionsNational.contenu,
              date: commentaireSolutionsNational.date_modification.toISOString(),
              auteur: "User Test",
              type: "solutionsEtActionsÀVenir",
            },
            {
              id: commentaireRisquesPlusRécent.id,
              contenu: commentaireRisquesPlusRécent.contenu,
              date: commentaireRisquesPlusRécent.date_modification.toISOString(),
              auteur: "User Test",
              type: "risquesEtFreinsÀLever",
            },
            {
              id: commentaireExemples.id,
              contenu: commentaireExemples.contenu,
              date: commentaireExemples.date_modification.toISOString(),
              auteur: "User Test",
              type: "exemplesConcretsDeRéussite",
            },
            {
              id: commentaireAutresNonCorrélés.id,
              contenu: commentaireAutresNonCorrélés.contenu,
              date: commentaireAutresNonCorrélés.date_modification.toISOString(),
              auteur: "User Test",
              type: "autresRésultatsObtenusNonCorrélésAuxIndicateurs",
            },
          ],
        });
      }),
    );
  });

  describe("Pour les mailles départementale et régionale ", () => {
    it(
      "Retourne un objet vide",
      createIntegrationTest(async () => {
        // Given
        const chantier = await fixtures.chantierIdentite();
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
        });
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
        });

        await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          type: CODES_TYPES_COMMENTAIRES["solutionsEtActionsÀVenir"],
        });
        await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          type: CODES_TYPES_COMMENTAIRES["solutionsEtActionsÀVenir"],
        });

        const habilitation = {
          lecture: { chantiers: [chantier.id], territoires: ["REG-01"] },
        } as unknown as Utilisateur["habilitations"];

        // When
        const résultat =
          await récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase.run(
            [chantier.id],
            "REG-01",
            habilitation,
          );

        // Then
        expect(résultat).toStrictEqual({});
      }),
    );

    it(
      "Retourne un objet contenant les commentaires les plus récents de chaque type groupés par chantier id",
      createIntegrationTest(async () => {
        // Given
        const chantier = await fixtures.chantierIdentite();
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
        });
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
        });
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "DEPT-93",
          maille: "DEPT",
          code_insee: "93",
        });

        // "solutionsEtActionsÀVenir" : le plus récent est en maille DEPT-75
        await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          type: CODES_TYPES_COMMENTAIRES["solutionsEtActionsÀVenir"],
          date_modification: new Date("2023-04-19"),
        });
        const commentaireSolutionsDept75 = await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          type: CODES_TYPES_COMMENTAIRES["solutionsEtActionsÀVenir"],
          date_modification: new Date("2023-04-20"),
        });
        // "risquesEtFreinsÀLever" uniquement en NAT - ne doit pas être retourné pour DEPT-75
        await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          type: CODES_TYPES_COMMENTAIRES["risquesEtFreinsÀLever"],
          date_modification: new Date("2023-04-19"),
        });
        await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          type: CODES_TYPES_COMMENTAIRES["risquesEtFreinsÀLever"],
          date_modification: new Date("2023-04-18"),
        });
        // "exemplesConcretsDeRéussite" uniquement en NAT - ne doit pas être retourné pour DEPT-75
        await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          type: CODES_TYPES_COMMENTAIRES["exemplesConcretsDeRéussite"],
          date_modification: new Date("2023-04-19"),
        });
        const commentaireAutresResultatsDept75 = await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          type: CODES_TYPES_COMMENTAIRES["autresRésultatsObtenus"],
          date_modification: new Date("2023-04-19"),
        });
        // "autresRésultatsObtenusNonCorrélésAuxIndicateurs" uniquement en NAT - ne doit pas être retourné pour DEPT-75
        await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          type: CODES_TYPES_COMMENTAIRES[
            "autresRésultatsObtenusNonCorrélésAuxIndicateurs"
          ],
          date_modification: new Date("2023-04-19"),
        });
        // "commentairesSurLesDonnées" : deux territoires DEPT, on attend seulement celui de DEPT-75
        await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "DEPT-93",
          maille: "DEPT",
          code_insee: "93",
          type: CODES_TYPES_COMMENTAIRES["commentairesSurLesDonnées"],
          date_modification: new Date("2023-04-19"),
        });
        const commentairesDonnéesDept75 = await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          type: CODES_TYPES_COMMENTAIRES["commentairesSurLesDonnées"],
          date_modification: new Date("2023-04-19"),
        });

        const habilitation = {
          lecture: { chantiers: [chantier.id], territoires: ["DEPT-75"] },
        } as unknown as Utilisateur["habilitations"];

        // When
        const résultat =
          await récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase.run(
            [chantier.id],
            "DEPT-75",
            habilitation,
          );

        // Then
        expect(résultat).toStrictEqual({
          [chantier.id]: [
            {
              id: commentaireSolutionsDept75.id,
              contenu: commentaireSolutionsDept75.contenu,
              date: commentaireSolutionsDept75.date_modification.toISOString(),
              auteur: "User Test",
              type: "solutionsEtActionsÀVenir",
            },
            {
              id: commentaireAutresResultatsDept75.id,
              contenu: commentaireAutresResultatsDept75.contenu,
              date: commentaireAutresResultatsDept75.date_modification.toISOString(),
              auteur: "User Test",
              type: "autresRésultatsObtenus",
            },
            {
              id: commentairesDonnéesDept75.id,
              contenu: commentairesDonnéesDept75.contenu,
              date: commentairesDonnéesDept75.date_modification.toISOString(),
              auteur: "User Test",
              type: "commentairesSurLesDonnées",
            },
          ],
        });
      }),
    );
  });
});

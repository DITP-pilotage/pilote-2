import { createIntegrationTest } from "@/test/createIntegrationTest";
import type { GetChantierCommentairesOutput } from "@/server/albert/tools/getChantierCommentaires";
import { seedEvalWorld } from "../../world";
import { createDataTools, executeTool } from "../dataTools";
import { seedMondeTerritorial } from "../mondeTerritorial";
import { JALON_COURANT } from "../territoires";
import { seedCommentairesDepartementsBretons } from "./seedCommentairesDepartementsBretons";

const DEPARTEMENTS_BRETONS = ["DEPT-22", "DEPT-29", "DEPT-35", "DEPT-56"];

describe("seedCommentairesDepartementsBretons", () => {
  it(
    "laisse le CH-005 en difficulté dans trois départements, dont deux sans synthèse",
    createIntegrationTest(async () => {
      // Given
      const world = await seedEvalWorld();
      await seedMondeTerritorial({ authorId: world.userId });
      await seedCommentairesDepartementsBretons();
      const tools = createDataTools({ user: world.users.ditp });

      // When
      const enDifficulte = await tools.collecterChantiers({
        perimetre: {
          type: "SELECTION",
          territoire_codes: DEPARTEMENTS_BRETONS,
        },
        jalon: JALON_COURANT,
        view: "en_difficulte",
        chantier_ids: ["CH-005"],
      });
      const commentaires = await executeTool<GetChantierCommentairesOutput>({
        tool: tools.getChantierCommentaires,
        input: {
          chantier_id: "CH-005",
          perimetre: {
            type: "SELECTION",
            territoire_codes: DEPARTEMENTS_BRETONS,
          },
        },
      });

      // Then
      const typesParDepartement = Object.fromEntries(
        commentaires.resultats
          .filter(
            (resultat) =>
              resultat.territoire_code.startsWith("DEPT-") &&
              resultat.commentaires.length > 0,
          )
          .map((resultat) => [
            resultat.territoire_code,
            resultat.commentaires.map((commentaire) => commentaire.type).sort(),
          ]),
      );
      expect(
        enDifficulte.resultats
          .filter((resultat) => resultat.chantiers.length > 0)
          .map((resultat) => resultat.territoire_code)
          .sort(),
      ).toEqual(["DEPT-29", "DEPT-35", "DEPT-56"]);
      expect(typesParDepartement).toEqual({
        "DEPT-22": ["commentaires_sur_les_donnees", "synthese_des_resultats"],
        "DEPT-29": [
          "autres_resultats_obtenus",
          "commentaires_sur_les_donnees",
          "synthese_des_resultats",
        ],
        "DEPT-35": ["autres_resultats_obtenus", "commentaires_sur_les_donnees"],
      });
    }),
  );
});

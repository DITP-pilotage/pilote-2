import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import type { GetChantiersOutput } from "@/server/albert/tools/getChantiers";
import type { GetTauxAvancementTerritoireOutput } from "@/server/albert/tools/getTauxAvancementTerritoire";
import type { GetChantierIndicateursOutput } from "@/server/albert/tools/getChantierIndicateurs";
import type { GetChantierCommentairesOutput } from "@/server/albert/tools/getChantierCommentaires";
import { seedEvalWorld } from "../world";
import { createDataTools, executeTool } from "./dataTools";
import { seedMondeTerritorial } from "./mondeTerritorial";

const idsDesChantiers = (output: GetChantiersOutput) =>
  output.resultats.flatMap((resultat) =>
    resultat.chantiers.map((chantier) => chantier.chantier.id),
  );

describe("seedMondeTerritorial", () => {
  it(
    "peuple les vues en retard et en difficulté de la Bretagne",
    createIntegrationTest(async () => {
      // Given
      const world = await seedEvalWorld();
      await seedMondeTerritorial({ authorId: world.userId });
      const tools = createDataTools({ user: world.users.ditp });

      // When
      const enRetard = await executeTool<GetChantiersOutput>({
        tool: tools.getChantiers,
        input: { territoire_code: "REG-53", jalon: 2025, view: "en_retard" },
      });
      const enDifficulte = await executeTool<GetChantiersOutput>({
        tool: tools.getChantiers,
        input: {
          territoire_code: "REG-53",
          jalon: 2025,
          view: "en_difficulte",
        },
      });

      // Then
      expect(idsDesChantiers(enRetard)).toEqual(["CH-005"]);
      expect(idsDesChantiers(enDifficulte)).toEqual(["CH-006"]);
    }),
  );

  it(
    "place la Bretagne en retard face à la médiane des régions",
    createIntegrationTest(async () => {
      // Given
      const world = await seedEvalWorld();
      await seedMondeTerritorial({ authorId: world.userId });
      const tools = createDataTools({ user: world.users.ditp });

      // When
      const taux = await executeTool<GetTauxAvancementTerritoireOutput>({
        tool: tools.getTauxAvancementTerritoire,
        input: { territoire_code: "REG-53", jalon: 2025 },
      });

      // Then
      expect(
        taux.resultats.map((resultat) => resultat.position_mediane),
      ).toEqual(["EN_RETARD"]);
    }),
  );

  it(
    "rend les valeurs de l'indicateur de CH-005 au jalon courant",
    createIntegrationTest(async () => {
      // Given
      const world = await seedEvalWorld();
      await seedMondeTerritorial({ authorId: world.userId });
      const tools = createDataTools({ user: world.users.ditp });

      // When
      const indicateurs = await executeTool<GetChantierIndicateursOutput>({
        tool: tools.getIndicateurs,
        input: {
          chantier_id: "CH-005",
          territoire_code: "REG-53",
          jalon: 2025,
        },
      });

      // Then
      expect(
        indicateurs.resultats.indicateurs.map((indicateur) => ({
          id: indicateur.indicateur_id,
          va: indicateur.valeur_actuelle,
          vc: indicateur.valeur_cible,
        })),
      ).toEqual([{ id: "IND-005", va: 250, vc: 180 }]);
    }),
  );

  it(
    "rend les commentaires territoriaux de CH-005 en Bretagne",
    createIntegrationTest(async () => {
      // Given
      const world = await seedEvalWorld();
      await seedMondeTerritorial({ authorId: world.userId });
      const tools = createDataTools({ user: world.users.ditp });

      // When
      const commentaires = await executeTool<GetChantierCommentairesOutput>({
        tool: tools.getChantierCommentaires,
        input: { chantier_id: "CH-005", territoire_code: "REG-53" },
      });

      // Then
      expect(
        commentaires.resultats.flatMap((resultat) =>
          resultat.commentaires.map((commentaire) => commentaire.type),
        ),
      ).toEqual(
        expect.arrayContaining([
          "commentaires_sur_les_donnees",
          "autres_resultats_obtenus",
        ]),
      );
    }),
  );

  it(
    "rend deux commentaires redondants pour CH-006 en Bretagne",
    createIntegrationTest(async () => {
      // Given
      const world = await seedEvalWorld();
      await seedMondeTerritorial({ authorId: world.userId });
      const tools = createDataTools({ user: world.users.ditp });

      // When
      const commentaires = await executeTool<GetChantierCommentairesOutput>({
        tool: tools.getChantierCommentaires,
        input: { chantier_id: "CH-006", territoire_code: "REG-53" },
      });

      // Then
      expect(
        commentaires.resultats
          .flatMap((resultat) => resultat.commentaires)
          .filter((commentaire) =>
            commentaire.contenu.includes("antigrippale"),
          )
          .map((commentaire) => commentaire.type)
          .sort(),
      ).toEqual(["autres_resultats_obtenus", "commentaires_sur_les_donnees"]);
    }),
  );
});

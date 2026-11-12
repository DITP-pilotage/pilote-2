import { createIntegrationTest } from "@/test/createIntegrationTest";
import type { GetChantiersOutput } from "@/server/albert/tools/getChantiers";
import type { GetTauxAvancementTerritoireOutput } from "@/server/albert/tools/getTauxAvancementTerritoire";
import type { GetChantierIndicateursOutput } from "@/server/albert/tools/getChantierIndicateurs";
import type { GetChantierCommentairesOutput } from "@/server/albert/tools/getChantierCommentaires";
import { PERSONNES, referenceDe } from "../personnes";
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
        input: {
          perimetre: { type: "SELECTION", territoire_codes: ["REG-53"] },
          jalon: 2025,
          view: "en_retard",
        },
      });
      const enDifficulte = await executeTool<GetChantiersOutput>({
        tool: tools.getChantiers,
        input: {
          perimetre: { type: "SELECTION", territoire_codes: ["REG-53"] },
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
        input: {
          perimetre: { type: "SELECTION", territoire_codes: ["REG-53"] },
          jalon: 2025,
        },
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
        input: {
          chantier_id: "CH-005",
          perimetre: { type: "SELECTION", territoire_codes: ["REG-53"] },
        },
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
        input: {
          chantier_id: "CH-006",
          perimetre: { type: "SELECTION", territoire_codes: ["REG-53"] },
        },
      });

      // Then
      expect(
        commentaires.resultats
          .flatMap((resultat) => resultat.commentaires)
          .filter((commentaire) =>
            commentaire.versions.some((version) =>
              version.contenu.includes("antigrippale"),
            ),
          )
          .map((commentaire) => commentaire.type)
          .sort(),
      ).toEqual(["autres_resultats_obtenus", "commentaires_sur_les_donnees"]);
    }),
  );

  it(
    "rend les personnes de CH-005 en Bretagne, sans le responsable local des Pays de la Loire pour le coordinateur",
    createIntegrationTest(async () => {
      // Given
      const world = await seedEvalWorld();
      await seedMondeTerritorial({ authorId: world.userId });
      const tools = createDataTools({ user: world.users.coordinateur });

      // When
      const chantiers = await executeTool<GetChantiersOutput>({
        tool: tools.getChantiers,
        input: {
          perimetre: {
            type: "SELECTION",
            territoire_codes: ["REG-53", "REG-52"],
          },
          jalon: 2025,
          chantier_ids: ["CH-005"],
        },
      });

      // Then
      expect(
        chantiers.resultats.map((resultat) => ({
          territoire: resultat.territoire_code,
          directeurs: resultat.chantiers[0]?.chantier.directeurs_projet,
          responsables: resultat.chantiers[0]?.responsables_locaux,
          coordinateurs: resultat.chantiers[0]?.coordinateurs_territoriaux,
          auteur: resultat.chantiers[0]?.synthese?.auteur,
          modifiePar: resultat.chantiers[0]?.synthese?.modifie_par,
        })),
      ).toEqual([
        {
          territoire: "REG-53",
          directeurs: [
            referenceDe(PERSONNES.directriceUrgences),
            referenceDe(PERSONNES.directeurUrgences),
          ],
          responsables: [referenceDe(PERSONNES.responsableLocalBretagne)],
          coordinateurs: [
            referenceDe(PERSONNES.coordinatriceTerritorialeBretagne),
          ],
          auteur: referenceDe(PERSONNES.auteurSynthese),
          modifiePar: referenceDe(PERSONNES.modificatriceSynthese),
        },
        {
          territoire: "REG-52",
          directeurs: [
            referenceDe(PERSONNES.directriceUrgences),
            referenceDe(PERSONNES.directeurUrgences),
          ],
          responsables: [],
          coordinateurs: [],
          auteur: undefined,
          modifiePar: undefined,
        },
      ]);
    }),
  );

  it(
    "rend le seul responsable des données d'IND-005 qui a un compte",
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
        indicateurs.resultats.indicateurs.map(
          (indicateur) => indicateur.responsables_donnees,
        ),
      ).toEqual([[referenceDe(PERSONNES.responsableDonnees)]]);
    }),
  );

  it(
    "rend l'auteur de chaque commentaire de CH-005 en Bretagne, synthèse comprise",
    createIntegrationTest(async () => {
      // Given
      const world = await seedEvalWorld();
      await seedMondeTerritorial({ authorId: world.userId });
      const tools = createDataTools({ user: world.users.ditp });

      // When
      const commentaires = await executeTool<GetChantierCommentairesOutput>({
        tool: tools.getChantierCommentaires,
        input: {
          chantier_id: "CH-005",
          perimetre: { type: "SELECTION", territoire_codes: ["REG-53"] },
        },
      });

      // Then
      expect(
        commentaires.resultats
          .flatMap((resultat) => resultat.commentaires)
          .map((commentaire) => ({
            type: commentaire.type,
            auteurs: commentaire.versions.map((version) => version.auteur),
          }))
          .sort((left, right) => left.type.localeCompare(right.type)),
      ).toEqual([
        {
          type: "autres_resultats_obtenus",
          auteurs: [referenceDe(PERSONNES.auteurCommentaire)],
        },
        {
          type: "commentaires_sur_les_donnees",
          auteurs: [referenceDe(PERSONNES.agentDitp)],
        },
        {
          type: "synthese_des_resultats",
          auteurs: [referenceDe(PERSONNES.auteurSynthese)],
        },
      ]);
    }),
  );
});

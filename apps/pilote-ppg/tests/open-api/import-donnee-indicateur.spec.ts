import { expect } from "@playwright/test";
import { prisma } from "@/server/framework/persistence/prisma";
import { test } from "../fixtures";
import {
  CHANTIER_E2E,
  CHANTIER_HORS_PERIMETRE_EQUIPE_DIR_PROJET,
  INDICATEUR_OPEN_API,
} from "../seed/entites-dediees";
import { DonneeIndicateurInput } from "./api-client/open-api.client";

// Seul ce spec importe des données avec ce compte : ses rapports, valides ou non, sont tous à nettoyer.
const RAPPORTS_DE_L_INDICATEUR = {
  utilisateurEmail: "equipe.dir.projet@example.com",
};

function donnee(
  valeur: Partial<DonneeIndicateurInput> = {},
): DonneeIndicateurInput {
  return {
    identifiant_indic: INDICATEUR_OPEN_API,
    zone_id: "D56",
    zone_nom: "Morbihan",
    date_valeur: "2023-03-31",
    type_valeur: "va",
    valeur: "42",
    ...valeur,
  };
}

test.describe("Import des données d'un indicateur par l'open-api", () => {
  test("un directeur de projet importe des valeurs sur un indicateur de son chantier", async ({
    openApi,
    e2eContext,
  }) => {
    e2eContext.track("RAPPORT_IMPORT_CREE", RAPPORTS_DE_L_INDICATEUR);
    const client = (await openApi("EQUIPE_DIR_PROJET")).getClient();

    const reponse = await client.importDonneesIndicateur(
      CHANTIER_E2E,
      INDICATEUR_OPEN_API,
      [
        donnee({ valeur: "42" }),
        donnee({ zone_id: "D29", zone_nom: "Finistère", valeur: "17" }),
      ],
    );

    expect(reponse.status()).toBe(200);
    expect(await reponse.json()).toEqual({
      message: "Les données ont correctement été importés",
    });
    const mesures = await prisma.mesure_indicateur.findMany({
      where: { indic_id: INDICATEUR_OPEN_API },
      select: {
        zone_id: true,
        metric_type: true,
        metric_value: true,
        metric_date: true,
      },
      orderBy: { zone_id: "asc" },
    });
    expect(mesures).toEqual([
      {
        zone_id: "D29",
        metric_type: "va",
        metric_value: "17",
        metric_date: "2023-03-01",
      },
      {
        zone_id: "D56",
        metric_type: "va",
        metric_value: "42",
        metric_date: "2023-03-01",
      },
    ]);
  });

  test("des valeurs invalides sont refusées avec le détail des erreurs", async ({
    openApi,
    e2eContext,
  }) => {
    e2eContext.track("RAPPORT_IMPORT_CREE", RAPPORTS_DE_L_INDICATEUR);
    const client = (await openApi("EQUIPE_DIR_PROJET")).getClient();

    const reponse = await client.importDonneesIndicateur(
      CHANTIER_E2E,
      INDICATEUR_OPEN_API,
      [donnee({ zone_id: "ZONE-INCONNUE" })],
    );

    expect(reponse.status()).toBe(400);
    const corps = (await reponse.json()) as {
      message: string;
      erreurs: { nomDuChamp: string }[];
    };
    expect(corps.message).toBe(
      "Une erreur est survenue lors de l'import des données",
    );
    expect(corps.erreurs.map((erreur) => erreur.nomDuChamp)).toContain(
      "zone_id",
    );
    expect(
      await prisma.mesure_indicateur.count({
        where: { indic_id: INDICATEUR_OPEN_API },
      }),
    ).toBe(0);
  });

  test("un profil en lecture seule n'importe pas de valeurs", async ({
    openApi,
  }) => {
    const client = (await openApi("PM_ET_CABINET")).getClient();

    const reponse = await client.importDonneesIndicateur(
      CHANTIER_E2E,
      INDICATEUR_OPEN_API,
      [donnee()],
    );

    expect(reponse.status()).toBe(403);
    expect(
      await prisma.mesure_indicateur.count({
        where: { indic_id: INDICATEUR_OPEN_API },
      }),
    ).toBe(0);
  });

  test("un directeur de projet n'importe pas de valeurs sur un chantier qui ne lui est pas attribué", async ({
    openApi,
  }) => {
    const client = (await openApi("EQUIPE_DIR_PROJET")).getClient();
    const mesuresAvant = await prisma.mesure_indicateur.count({
      where: { indic_id: "IND-105" },
    });

    const reponse = await client.importDonneesIndicateur(
      CHANTIER_HORS_PERIMETRE_EQUIPE_DIR_PROJET,
      "IND-105",
      [donnee({ identifiant_indic: "IND-105" })],
    );

    expect(reponse.status()).toBe(403);
    expect(
      await prisma.mesure_indicateur.count({ where: { indic_id: "IND-105" } }),
    ).toBe(mesuresAvant);
  });
});

import { expect } from "@playwright/test";
import { prisma } from "@/server/framework/persistence/prisma";
import { test } from "../fixtures";
import {
  CHANTIER_FOR_WRITES,
  CHANTIER_NOT_ASSIGNED_TO_EQUIPE_DIR_PROJET,
  INDICATEUR_FOR_OPEN_API,
} from "../seed/dedicated-entities";
import { DonneeIndicateurInput } from "./api-client/open-api.client";

// Seul ce spec importe des données avec ce compte : ses rapports, valides ou non, sont tous à nettoyer.
const RAPPORTS_TO_CLEAN = {
  utilisateurEmail: "equipe.dir.projet@example.com",
};

function buildDonneeIndicateur(
  overrides: Partial<DonneeIndicateurInput> = {},
): DonneeIndicateurInput {
  return {
    identifiant_indic: INDICATEUR_FOR_OPEN_API,
    zone_id: "D56",
    zone_nom: "Morbihan",
    date_valeur: "2023-03-31",
    type_valeur: "va",
    valeur: "42",
    ...overrides,
  };
}

test.describe("Import des données d'un indicateur par l'open-api", () => {
  test("un directeur de projet importe des valeurs sur un indicateur de son chantier", async ({
    openApi,
    e2eContext,
  }) => {
    e2eContext.track("RAPPORT_IMPORT_CREATED", RAPPORTS_TO_CLEAN);
    const client = (await openApi("EQUIPE_DIR_PROJET")).getClient();

    const response = await client.importDonneesIndicateur(
      CHANTIER_FOR_WRITES,
      INDICATEUR_FOR_OPEN_API,
      [
        buildDonneeIndicateur({ valeur: "42" }),
        buildDonneeIndicateur({
          zone_id: "D29",
          zone_nom: "Finistère",
          valeur: "17",
        }),
      ],
    );

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({
      message: "Les données ont correctement été importés",
    });
    const mesures = await prisma.mesure_indicateur.findMany({
      where: { indic_id: INDICATEUR_FOR_OPEN_API },
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
    e2eContext.track("RAPPORT_IMPORT_CREATED", RAPPORTS_TO_CLEAN);
    const client = (await openApi("EQUIPE_DIR_PROJET")).getClient();

    const response = await client.importDonneesIndicateur(
      CHANTIER_FOR_WRITES,
      INDICATEUR_FOR_OPEN_API,
      [buildDonneeIndicateur({ zone_id: "ZONE-INCONNUE" })],
    );

    expect(response.status()).toBe(400);
    const body = (await response.json()) as {
      message: string;
      erreurs: { nomDuChamp: string }[];
    };
    expect(body.message).toBe(
      "Une erreur est survenue lors de l'import des données",
    );
    expect(body.erreurs.map((erreur) => erreur.nomDuChamp)).toContain(
      "zone_id",
    );
    expect(
      await prisma.mesure_indicateur.count({
        where: { indic_id: INDICATEUR_FOR_OPEN_API },
      }),
    ).toBe(0);
  });

  test("un profil en lecture seule n'importe pas de valeurs", async ({
    openApi,
  }) => {
    const client = (await openApi("PM_ET_CABINET")).getClient();

    const response = await client.importDonneesIndicateur(
      CHANTIER_FOR_WRITES,
      INDICATEUR_FOR_OPEN_API,
      [buildDonneeIndicateur()],
    );

    expect(response.status()).toBe(403);
    expect(
      await prisma.mesure_indicateur.count({
        where: { indic_id: INDICATEUR_FOR_OPEN_API },
      }),
    ).toBe(0);
  });

  test("un directeur de projet n'importe pas de valeurs sur un chantier qui ne lui est pas attribué", async ({
    openApi,
  }) => {
    const client = (await openApi("EQUIPE_DIR_PROJET")).getClient();
    const mesuresCountBefore = await prisma.mesure_indicateur.count({
      where: { indic_id: "IND-105" },
    });

    const response = await client.importDonneesIndicateur(
      CHANTIER_NOT_ASSIGNED_TO_EQUIPE_DIR_PROJET,
      "IND-105",
      [buildDonneeIndicateur({ identifiant_indic: "IND-105" })],
    );

    expect(response.status()).toBe(403);
    expect(
      await prisma.mesure_indicateur.count({ where: { indic_id: "IND-105" } }),
    ).toBe(mesuresCountBefore);
  });
});

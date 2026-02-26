import { expect, test } from "@playwright/test";
import {
  ImportSyntheseDesResultatsErrorResponse,
  ImportSyntheseDesResultatsSuccessResponse,
} from "@/server/syntheses-des-resultats/app/contrats/ImportSyntheseDesResultatsAPIContrat";
import { ApiTestContext } from "./api-client/api-test-context";
import { SyntheseDesResultatsInput } from "./api-client/open-api.client";

test("Import de synthèses des résultats via l'API open-api", async ({
  playwright,
}) => {
  const apiContext = await ApiTestContext.create(
    playwright,
    "EQUIPE_DIR_PROJET",
  );
  const client = apiContext.getClient();
  const chantierId = apiContext.chantierId!;

  await test.step("Import d'une synthèse valide sans date - doit retourner 200 OK", async () => {
    const syntheses: SyntheseDesResultatsInput[] = [
      {
        territoire: "NAT-FR",
        contenu: "Contenu de la synthèse de test e2e",
        meteo: "SOLEIL",
      },
    ];

    const result = await client.importSynthesesDesResultats(
      chantierId,
      syntheses,
    );

    expect(result.status()).toEqual(200);

    const responseBody =
      (await result.json()) as ImportSyntheseDesResultatsSuccessResponse;
    expect(responseBody.message).toEqual(
      "Les synthèses des résultats ont correctement été importées",
    );
  });

  await test.step("Import d'une synthèse avec une date antérieure - doit retourner 200 OK", async () => {
    const syntheses: SyntheseDesResultatsInput[] = [
      {
        territoire: "NAT-FR",
        contenu: "Synthèse avec date antérieure",
        meteo: "NUAGE",
        date_synthese: "2024-01-15",
      },
    ];

    const result = await client.importSynthesesDesResultats(
      chantierId,
      syntheses,
    );

    expect(result.status()).toEqual(200);

    const responseBody =
      (await result.json()) as ImportSyntheseDesResultatsSuccessResponse;
    expect(responseBody.message).toBeDefined();
  });

  await test.step("Import de plusieurs synthèses valides - doit toutes les créer", async () => {
    const syntheses: SyntheseDesResultatsInput[] = [
      {
        territoire: "NAT-FR",
        contenu: "Première synthèse",
        meteo: "SOLEIL",
      },
      {
        territoire: "NAT-FR",
        contenu: "Deuxième synthèse",
        meteo: "ORAGE",
        date_synthese: "2024-06-01",
      },
    ];

    const result = await client.importSynthesesDesResultats(
      chantierId,
      syntheses,
    );

    expect(result.status()).toEqual(200);

    const responseBody =
      (await result.json()) as ImportSyntheseDesResultatsSuccessResponse;
    expect(responseBody.message).toBeDefined();
  });

  await test.step("Import avec une date dans le futur - doit retourner 400", async () => {
    const futurDate = new Date();
    futurDate.setFullYear(futurDate.getFullYear() + 1);
    const futurDateStr = futurDate.toISOString().split("T")[0];

    const syntheses: SyntheseDesResultatsInput[] = [
      {
        territoire: "NAT-FR",
        contenu: "Synthèse avec date future",
        meteo: "SOLEIL",
        date_synthese: futurDateStr,
      },
    ];

    const result = await client.importSynthesesDesResultats(
      chantierId,
      syntheses,
    );

    expect(result.status()).toEqual(400);

    const responseBody =
      (await result.json()) as ImportSyntheseDesResultatsErrorResponse;
    expect(responseBody.erreurs).toBeDefined();
    expect(responseBody.erreurs.length).toBeGreaterThan(0);
  });

  await test.step("Import avec une météo invalide - doit retourner 400", async () => {
    const syntheses: SyntheseDesResultatsInput[] = [
      {
        territoire: "NAT-FR",
        contenu: "Synthèse avec météo invalide",
        // @ts-ignore on test justement une météo inexistante
        meteo: "METEO_INVALIDE",
      },
    ];

    const result = await client.importSynthesesDesResultats(
      chantierId,
      syntheses,
    );

    expect(result.status()).toEqual(400);

    const responseBody =
      (await result.json()) as ImportSyntheseDesResultatsErrorResponse;
    expect(responseBody.erreurs).toBeDefined();
  });

  await test.step("Import sur un chantier non autorisé - doit retourner 403", async () => {
    const chantierNonAutorise = "CH-999";
    const syntheses: SyntheseDesResultatsInput[] = [
      {
        territoire: "NAT-FR",
        contenu: "Tentative sur chantier non autorisé",
        meteo: "SOLEIL",
      },
    ];

    const result = await client.importSynthesesDesResultats(
      chantierNonAutorise,
      syntheses,
    );

    expect(result.status()).toEqual(403);
  });

  await apiContext.dispose();
});

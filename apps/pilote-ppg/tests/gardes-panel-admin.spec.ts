import { randomUUID } from "node:crypto";
import { expect } from "@playwright/test";
import { test } from "./fixtures";
import { AppActions } from "./actions/app.actions";
import { TrpcClient } from "./api-client/trpc.client";
import { CHANTIER_E2E, INDICATEUR_FORMULAIRE } from "./seed/entites-dediees";

const PAGES_RESERVEES_ADMIN = [
  "/panel-administrateur/albert",
  "/panel-administrateur/chantiers",
  `/panel-administrateur/chantiers/${CHANTIER_E2E}`,
  "/panel-administrateur/gestion-token-api",
  "/panel-administrateur/habilitations-coordinateur",
  "/panel-administrateur/indicateurs",
  `/panel-administrateur/indicateurs/${INDICATEUR_FORMULAIRE}`,
  "/panel-administrateur/message-information",
  "/panel-administrateur/parametrage-metadata-indicateur",
  "/panel-administrateur/referentiels/perimetres",
  "/panel-administrateur/referentiels/perimetres/PER-001",
  "/panel-administrateur/referentiels/porteurs",
  "/panel-administrateur/referentiels/porteurs/1",
  "/panel-administrateur/referentiels/zonegroups",
  "/panel-administrateur/referentiels/zonegroups/ZG-REF",
  "/panel-administrateur/referentiels-deprecies/axes",
  "/panel-administrateur/referentiels-deprecies/axes/EMPLOI",
  "/panel-administrateur/referentiels-deprecies/engagements",
  "/panel-administrateur/referentiels-deprecies/engagements/1",
  "/panel-administrateur/referentiels-deprecies/ppgs",
  "/panel-administrateur/referentiels-deprecies/ppgs/PPG-1",
];

const PROFILS_NON_ADMIN = [
  "ditp.pilotage@example.com",
  "coordinateur.region@example.com",
  "equipe.dir.projet@example.com",
];

for (const email of PROFILS_NON_ADMIN) {
  test.describe(`Panel administrateur pour ${email}`, () => {
    test("chaque page réservée à l'administrateur redirige vers l'accueil", async ({
      page,
      e2eContext,
    }) => {
      await new AppActions(page, e2eContext).loginAs(email);

      for (const chemin of PAGES_RESERVEES_ADMIN) {
        const reponse = await page.request.get(chemin, { maxRedirects: 0 });

        expect(reponse.status(), chemin).toBe(307);
        expect(reponse.headers().location, chemin).toBe("/");
      }
    });
  });
}

test.describe("Pages du panel gardées par la seule session", () => {
  test("les données sensibles restent refusées à un profil non administrateur", async ({
    page,
    e2eContext,
  }) => {
    await new AppActions(page, e2eContext).loginAs(
      "coordinateur.region@example.com",
    );
    const trpc = new TrpcClient(page);

    const logs = await trpc.query("applicationLog.lister", {});
    const featureFlips = await trpc.query(
      "gestionContenu.recupererFeatureFlips",
    );

    expect(logs.status).toBe(401);
    expect(logs.errorCode).toBe("UnauthorizedError");
    expect(featureFlips.status).toBe(401);
    expect(featureFlips.errorCode).toBe("UnauthorizedError");
  });

  test("les modifications de contenu restent refusées à un profil non administrateur", async ({
    page,
    e2eContext,
  }) => {
    await new AppActions(page, e2eContext).loginAs(
      "coordinateur.region@example.com",
    );
    const trpc = new TrpcClient(page);

    const purgeLogs = await trpc.mutation("applicationLog.purger", {
      anterieurA: new Date().toISOString(),
    });
    const featureFlips = await trpc.mutation(
      "gestionContenu.modifierFeatureFlips",
      { featureFlips: {} },
    );
    const nouveaute = await trpc.mutation("parametrageNouveautes.creer", {
      id: randomUUID(),
      contenu: "Nouveauté créée par un coordinateur",
      version: "0.0.0",
      date: new Date().toISOString(),
    });
    const article = await trpc.mutation("parametrageCentreAide.creer", {
      id: randomUUID(),
      titre: "Article créé par un coordinateur",
      contenu: null,
      type: "PAGE",
      ordre: 0,
      parentId: null,
    });

    expect(purgeLogs.status).toBe(401);
    expect(featureFlips.status).toBe(401);
    expect(nouveaute.status).toBe(401);
    expect(article.status).toBe(401);
  });
});

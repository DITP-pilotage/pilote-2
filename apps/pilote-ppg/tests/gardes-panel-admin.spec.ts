import { randomUUID } from "node:crypto";
import { expect } from "@playwright/test";
import { prisma } from "@/server/framework/persistence/prisma";
import { test } from "./fixtures";
import { AppActions } from "./actions/app.actions";
import { TrpcClient } from "./api-client/trpc.client";
import {
  CHANTIER_FOR_WRITES,
  INDICATEUR_FOR_FORM,
} from "./seed/dedicated-entities";

const ADMIN_ONLY_PAGES = [
  "/panel-administrateur/albert",
  "/panel-administrateur/chantiers",
  `/panel-administrateur/chantiers/${CHANTIER_FOR_WRITES}`,
  "/panel-administrateur/gestion-token-api",
  "/panel-administrateur/habilitations-coordinateur",
  "/panel-administrateur/indicateurs",
  `/panel-administrateur/indicateurs/${INDICATEUR_FOR_FORM}`,
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

const NON_ADMIN_EMAILS = [
  "ditp.pilotage@example.com",
  "coordinateur.region@example.com",
  "equipe.dir.projet@example.com",
];

for (const email of NON_ADMIN_EMAILS) {
  test.describe(`Panel administrateur pour ${email}`, () => {
    test("chaque page réservée à l'administrateur redirige vers l'accueil", async ({
      page,
      e2eContext,
    }) => {
      await new AppActions(page, e2eContext).loginAs(email);

      for (const path of ADMIN_ONLY_PAGES) {
        const response = await page.request.get(path, { maxRedirects: 0 });

        expect(response.status(), path).toBe(307);
        expect(response.headers().location, path).toBe("/");
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
    const trpc = await TrpcClient.outsideApp(page);

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
    const trpc = await TrpcClient.outsideApp(page);
    const nouveauteId = randomUUID();
    const articleId = randomUUID();
    e2eContext.track("NOUVEAUTE_CREATED", { id: nouveauteId });
    e2eContext.track("ARTICLE_CENTRE_AIDE_CREATED", { id: articleId });

    // Aucun log n'est antérieur à cette date : la purge ne supprimerait rien si la garde régressait.
    const purgeLogsResult = await trpc.mutation("applicationLog.purger", {
      anterieurA: new Date("2000-01-01").toISOString(),
    });
    const featureFlips = await trpc.mutation(
      "gestionContenu.modifierFeatureFlips",
      { featureFlips: {} },
    );
    const nouveaute = await trpc.mutation("parametrageNouveautes.creer", {
      id: nouveauteId,
      contenu: "Nouveauté créée par un coordinateur",
      version: "0.0.0",
      date: new Date().toISOString(),
    });
    const article = await trpc.mutation("parametrageCentreAide.creer", {
      id: articleId,
      titre: "Article créé par un coordinateur",
      contenu: null,
      type: "PAGE",
      ordre: 0,
      parentId: null,
    });

    for (const refusal of [purgeLogsResult, featureFlips, nouveaute, article]) {
      expect(refusal.status).toBe(401);
      expect(refusal.errorCode).toBe("UnauthorizedError");
    }
    expect(await prisma.nouveaute.count({ where: { id: nouveauteId } })).toBe(
      0,
    );
    expect(
      await prisma.article_centre_aide.count({ where: { id: articleId } }),
    ).toBe(0);
  });
});

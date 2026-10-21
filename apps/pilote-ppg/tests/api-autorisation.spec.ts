import { expect } from "@playwright/test";
import { test } from "./fixtures";
import { AppActions } from "./actions/app.actions";
import { TrpcClient } from "./api-client/trpc.client";

test.describe("Appels directs sans session", () => {
  test("une mutation tRPC est redirigée vers la connexion", async ({
    page,
  }) => {
    const trpc = new TrpcClient(page);

    const resultat = await trpc.mutation(
      "utilisateur.desactiver",
      { email: "prefet.region@example.com" },
      { csrf: null },
    );

    expect(resultat.status).toBe(303);
    expect(resultat.location).toContain("/connexion?callbackUrl=");
  });
});

test.describe("Appels directs avec session", () => {
  test("un profil connecté lit les chantiers de son périmètre", async ({
    page,
    e2eContext,
  }) => {
    await new AppActions(page, e2eContext).loginAs("ditp.pilotage@example.com");
    const trpc = new TrpcClient(page);

    const resultat = await trpc.query<unknown[]>(
      "chantier.recupererTousSynthetisesAccessiblesEnLecture",
    );

    expect(resultat.status).toBe(200);
    expect(resultat.errorCode).toBeNull();
    expect(resultat.data?.length).toBeGreaterThan(0);
  });
});

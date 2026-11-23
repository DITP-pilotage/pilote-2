import { expect, Page, Response } from "@playwright/test";
import { prisma } from "@/server/framework/persistence/prisma";
import { test } from "./fixtures";
import { AppActions } from "./actions/app.actions";
import { UTILISATEUR_FOR_SLIDE_IN_FORMATIONS } from "./seed/dedicated-entities";

const estUnAppel = (response: Response, procedure: string) =>
  new URL(response.url()).pathname
    .split("/")
    .pop()
    ?.split(",")
    .includes(procedure) ?? false;

const attendreAppel = (page: Page, procedure: string, contenu?: string) =>
  page.waitForResponse(
    (response) =>
      estUnAppel(response, procedure) &&
      (contenu === undefined ||
        (response.request().postData() ?? "").includes(contenu)),
  );

// Les appels tRPC partent en lot : la réponse est un tableau dans l'ordre des procédures de l'URL.
async function resultatDuLot(response: Response, procedure: string) {
  const procedures =
    new URL(response.url()).pathname.split("/").pop()?.split(",") ?? [];
  const corps = (await response.json()) as {
    result: { data: { json: unknown } };
  }[];
  return corps[procedures.indexOf(procedure)].result.data.json;
}

// Une réponse de la page précédente peut arriver pendant le rechargement : son corps n'est
// alors plus lisible, on l'ignore et on attend celle de la nouvelle page.
async function slideInApresRechargement(page: Page): Promise<unknown> {
  let resultat: unknown;
  await Promise.all([
    page.waitForResponse(async (response) => {
      if (!estUnAppel(response, "formation.slideIn")) return false;
      try {
        resultat = await resultatDuLot(response, "formation.slideIn");
        return true;
      } catch {
        return false;
      }
    }),
    page.reload(),
  ]);
  return resultat;
}

const ligneEtat = () =>
  prisma.formation_periode_information_utilisateur.findFirst({
    where: { utilisateur: { email: UTILISATEUR_FOR_SLIDE_IN_FORMATIONS } },
    select: { date_presentation: true, date_fermeture: true },
  });

test.describe("Slide-in des formations", () => {
  test("revient après la croix, puis ne revient plus après « Ne plus me les proposer »", async ({
    page,
    e2eContext,
  }) => {
    e2eContext.track("FORMATION_SLIDE_IN_ETAT_CREATED", {
      email: UTILISATEUR_FOR_SLIDE_IN_FORMATIONS,
    });
    const presentation = attendreAppel(
      page,
      "formation.recordSlideInAction",
      "PRESENTATION",
    );
    await new AppActions(page, e2eContext).loginAs(
      UTILISATEUR_FOR_SLIDE_IN_FORMATIONS,
    );

    const slideIn = page.getByRole("region", {
      name: "1 formation pour votre profil",
    });
    await expect(slideIn).toBeVisible({ timeout: 15_000 });
    await expect(slideIn.getByText("Formation e2e")).toBeVisible();
    await expect(
      slideIn.getByRole("link", { name: "S'inscrire" }),
    ).toHaveAttribute(
      "href",
      "https://rdv.anct.gouv.fr/prendre_rdv?public_link_organisation_id=1453",
    );
    await expect(
      slideIn.getByRole("button", { name: "Plus tard" }),
    ).toHaveCount(0);
    await presentation;

    await slideIn.getByRole("button", { name: "Fermer" }).click();
    await expect(slideIn).toBeHidden();
    expect(await ligneEtat()).toEqual({
      date_presentation: expect.any(Date),
      date_fermeture: null,
    });

    const premierRechargement = attendreAppel(page, "formation.slideIn");
    await page.reload();
    await premierRechargement;
    await expect(slideIn).toBeVisible({ timeout: 15_000 });

    const fermeture = attendreAppel(
      page,
      "formation.recordSlideInAction",
      "FERMETURE",
    );
    await slideIn
      .getByRole("button", { name: "Ne plus me les proposer" })
      .click();
    await expect(slideIn).toBeHidden();
    await fermeture;
    // Fermeture écrite : toute réponse de formation.slideIn, d'avant ou d'après le rechargement, est vide.
    await expect
      .poll(async () => (await ligneEtat())?.date_fermeture instanceof Date)
      .toBe(true);

    expect(await slideInApresRechargement(page)).toBeNull();
    await expect(slideIn).toHaveCount(0);
  });
});

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

const ligneEtat = () =>
  prisma.formation_periode_information_utilisateur.findFirst({
    where: { utilisateur: { email: UTILISATEUR_FOR_SLIDE_IN_FORMATIONS } },
    select: { date_report: true, date_fermeture: true },
  });

test.describe("Slide-in des formations", () => {
  test("propose la formation du profil, puis la reporte avec Plus tard", async ({
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
    await presentation;

    const report = attendreAppel(
      page,
      "formation.recordSlideInAction",
      "REPORT",
    );
    const relanceApresReport = attendreAppel(page, "formation.slideIn");
    await slideIn.getByRole("button", { name: "Plus tard" }).last().click();
    await expect(slideIn).toBeHidden();
    await report;
    await relanceApresReport;
    await expect
      .poll(async () => (await ligneEtat())?.date_report instanceof Date)
      .toBe(true);

    const rechargement = attendreAppel(page, "formation.slideIn");
    await page.reload();
    expect(
      await resultatDuLot(await rechargement, "formation.slideIn"),
    ).toBeNull();
    await expect(slideIn).toHaveCount(0);
  });
});

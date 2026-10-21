import { expect, Page } from "@playwright/test";
import { test } from "./fixtures";
import { AppActions } from "./actions/app.actions";

async function chantiersAffiches(page: Page): Promise<string[]> {
  const liens = page.getByRole("rowheader").getByRole("link");
  await expect(liens.first()).toBeVisible();
  const urls = await liens.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("href") ?? ""),
  );
  return urls
    .map((url) => url.match(/\/chantier\/(CH-\d+)\//)?.[1] ?? url)
    .sort();
}

test.describe("Page d'accueil", () => {
  test("un directeur de projet ne voit que les chantiers qui lui sont attribués", async ({
    page,
    e2eContext,
  }) => {
    await new AppActions(page, e2eContext).loginAs(
      "equipe.dir.projet@example.com",
    );

    await expect
      .poll(() => chantiersAffiches(page))
      .toEqual([
        "CH-051",
        "CH-054",
        "CH-058",
        "CH-062",
        "CH-129",
        "CH-902",
        "CH-903",
      ]);
  });

  test("un profil national voit tous les chantiers publiés", async ({
    page,
    e2eContext,
  }) => {
    await new AppActions(page, e2eContext).loginAs(
      "premiere.ministre@example.com",
    );

    await expect
      .poll(() => chantiersAffiches(page))
      .toEqual([
        "CH-050",
        "CH-051",
        "CH-054",
        "CH-058",
        "CH-062",
        "CH-067",
        "CH-070",
        "CH-071",
        "CH-107",
        "CH-108",
        "CH-129",
        "CH-145",
        "CH-155",
        "CH-902",
        "CH-903",
      ]);
    await expect(
      page.getByRole("heading", { name: "15 chantiers" }),
    ).toBeVisible();
  });

  test("le filtre ministère restreint la liste aux chantiers du ministère", async ({
    page,
    e2eContext,
  }) => {
    const pageAccueil = await new AppActions(page, e2eContext).loginAs(
      "premiere.ministre@example.com",
    );

    await pageAccueil.filterByMinistere("Intérieur et Outre-mer");

    await pageAccueil.expectFilterTag("Intérieur et Outre-mer");
    await expect
      .poll(() => chantiersAffiches(page))
      .toEqual(["CH-129", "CH-903"]);
  });
});

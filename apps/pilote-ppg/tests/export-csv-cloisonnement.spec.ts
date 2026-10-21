import { parse } from "csv-parse/sync";
import { expect, Page } from "@playwright/test";
import { test } from "./fixtures";
import { AppActions } from "./actions/app.actions";
import {
  CHANTIER_BROUILLON,
  INDICATEUR_FORMULAIRE,
  INDICATEUR_IMPORT,
  INDICATEUR_OPEN_API,
} from "./seed/entites-dediees";

const CHANTIERS_SERVICES_DECONCENTRES_REGION = [
  "CH-051",
  "CH-054",
  "CH-058",
  "CH-062",
  "CH-070",
];

type LigneCsv = Record<string, string>;

function lireCsv(texte: string): LigneCsv[] {
  return parse(texte, { columns: true, delimiter: ";", bom: true });
}

async function exporter(page: Page, url: string): Promise<LigneCsv[]> {
  const reponse = await page.request.get(url);
  expect(reponse.status(), url).toBe(200);
  return lireCsv(await reponse.text());
}

function valeursDistinctes(lignes: LigneCsv[], colonne: string): string[] {
  return [...new Set(lignes.map((ligne) => ligne[colonne]))].sort();
}

test.describe("Export des chantiers", () => {
  test("un profil régional n'exporte que les chantiers et territoires de son périmètre", async ({
    page,
    e2eContext,
  }) => {
    await new AppActions(page, e2eContext).loginAs(
      "services.deconcentres.region@example.com",
    );

    const lignes = await exporter(page, "/api/export/chantiers-v2");

    expect(lignes.length).toBeGreaterThan(0);
    expect(valeursDistinctes(lignes, "Région")).toEqual(["Bretagne"]);
    for (const chantierId of valeursDistinctes(lignes, "Chantier Id")) {
      expect(CHANTIERS_SERVICES_DECONCENTRES_REGION).toContain(chantierId);
    }
  });

  test("un profil sans accès aux brouillons ne les exporte pas, même en les demandant", async ({
    page,
    e2eContext,
  }) => {
    await new AppActions(page, e2eContext).loginAs(
      "services.deconcentres.region@example.com",
    );

    const parDefaut = await exporter(page, "/api/export/chantiers-v2");
    const brouillonsDemandes = await exporter(
      page,
      "/api/export/chantiers-v2?statut=BROUILLON",
    );

    expect(valeursDistinctes(parDefaut, "Chantier Id")).not.toContain(
      CHANTIER_BROUILLON,
    );
    expect(brouillonsDemandes).toEqual([]);
  });

  test("un profil avec accès aux brouillons exporte ses chantiers en brouillon", async ({
    page,
    e2eContext,
  }) => {
    await new AppActions(page, e2eContext).loginAs(
      "equipe.dir.projet@example.com",
    );

    const lignes = await exporter(
      page,
      "/api/export/chantiers-v2?statut=BROUILLON",
    );

    expect(valeursDistinctes(lignes, "Chantier Id")).toEqual([
      CHANTIER_BROUILLON,
    ]);
  });
});

test.describe("Export des indicateurs", () => {
  test("un profil régional n'exporte que les indicateurs de ses chantiers et territoires", async ({
    page,
    e2eContext,
  }) => {
    await new AppActions(page, e2eContext).loginAs(
      "services.deconcentres.region@example.com",
    );

    const lignes = await exporter(page, "/api/export/indicateurs-v2");

    expect(lignes.length).toBeGreaterThan(0);
    expect(valeursDistinctes(lignes, "Région")).toEqual(["Bretagne"]);
    for (const chantierId of valeursDistinctes(lignes, "Chantier Id")) {
      expect(CHANTIERS_SERVICES_DECONCENTRES_REGION).toContain(chantierId);
    }
  });

  test("un directeur de projet exporte les indicateurs des chantiers qui lui sont attribués", async ({
    page,
    e2eContext,
  }) => {
    await new AppActions(page, e2eContext).loginAs(
      "equipe.dir.projet@example.com",
    );

    const lignes = await exporter(page, "/api/export/indicateurs-v2");

    const indicateurs = valeursDistinctes(lignes, "Indicateur Id");
    expect(indicateurs).toEqual(
      expect.arrayContaining([
        INDICATEUR_IMPORT,
        INDICATEUR_FORMULAIRE,
        INDICATEUR_OPEN_API,
      ]),
    );
    expect(valeursDistinctes(lignes, "Chantier Id")).not.toContain("CH-070");
  });
});

test.describe("Export de l'historique des indicateurs", () => {
  test("un coordinateur régional n'exporte que l'historique de ses territoires", async ({
    page,
    e2eContext,
  }) => {
    await new AppActions(page, e2eContext).loginAs(
      "coordinateur.region@example.com",
    );

    const lignes = await exporter(page, "/api/export/historique-indicateurs");

    expect(lignes.length).toBeGreaterThan(0);
    expect(valeursDistinctes(lignes, "Région")).toEqual(["Bretagne"]);
  });
});

test.describe("Export des utilisateurs", () => {
  test("un coordinateur départemental n'exporte que les comptes de ses départements", async ({
    page,
    e2eContext,
  }) => {
    await new AppActions(page, e2eContext).loginAs(
      "coordinateur.departement@example.com",
    );

    const lignes = await exporter(
      page,
      "/api/export/utilisateurs?typeCompte=actif",
    );

    const emails = lignes.map((ligne) => ligne["Email"]);
    expect(emails).toContain("prefet.departement@example.com");
    expect(emails).not.toContain("ditp.admin@example.com");
    expect(emails).not.toContain("premiere.ministre@example.com");
  });
});

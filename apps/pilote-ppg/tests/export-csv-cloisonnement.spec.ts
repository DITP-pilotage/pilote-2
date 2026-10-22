import { parse } from "csv-parse/sync";
import { expect, Page } from "@playwright/test";
import { test } from "./fixtures";
import { AppActions } from "./actions/app.actions";
import {
  CHANTIER_BROUILLON,
  INDICATEUR_FOR_FORM,
  INDICATEUR_FOR_IMPORT,
  INDICATEUR_FOR_OPEN_API,
} from "./seed/dedicated-entities";

const CHANTIERS_SERVICES_DECONCENTRES_REGION = [
  "CH-051",
  "CH-054",
  "CH-058",
  "CH-062",
  "CH-070",
];

type CsvRow = Record<string, string>;

function parseCsv(text: string): CsvRow[] {
  return parse(text, { columns: true, delimiter: ";", bom: true });
}

async function fetchExport(page: Page, url: string): Promise<CsvRow[]> {
  const response = await page.request.get(url);
  expect(response.status(), url).toBe(200);
  return parseCsv(await response.text());
}

function distinctValues(rows: CsvRow[], column: string): string[] {
  return [...new Set(rows.map((row) => row[column]))].sort();
}

test.describe("Export des chantiers", () => {
  test("un profil régional n'exporte que les chantiers et territoires de son périmètre", async ({
    page,
    e2eContext,
  }) => {
    await new AppActions(page, e2eContext).loginAs(
      "services.deconcentres.region@example.com",
    );

    const rows = await fetchExport(page, "/api/export/chantiers-v2");

    expect(rows.length).toBeGreaterThan(0);
    expect(distinctValues(rows, "Région")).toEqual(["Bretagne"]);
    for (const chantierId of distinctValues(rows, "Chantier Id")) {
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

    const defaultRows = await fetchExport(page, "/api/export/chantiers-v2");
    const draftRows = await fetchExport(
      page,
      "/api/export/chantiers-v2?statut=BROUILLON",
    );

    expect(distinctValues(defaultRows, "Chantier Id")).not.toContain(
      CHANTIER_BROUILLON,
    );
    expect(draftRows).toEqual([]);
  });

  test("un profil avec accès aux brouillons exporte ses chantiers en brouillon", async ({
    page,
    e2eContext,
  }) => {
    await new AppActions(page, e2eContext).loginAs(
      "equipe.dir.projet@example.com",
    );

    const rows = await fetchExport(
      page,
      "/api/export/chantiers-v2?statut=BROUILLON",
    );

    expect(distinctValues(rows, "Chantier Id")).toEqual([CHANTIER_BROUILLON]);
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

    const rows = await fetchExport(page, "/api/export/indicateurs-v2");

    expect(rows.length).toBeGreaterThan(0);
    expect(distinctValues(rows, "Région")).toEqual(["Bretagne"]);
    for (const chantierId of distinctValues(rows, "Chantier Id")) {
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

    const rows = await fetchExport(page, "/api/export/indicateurs-v2");

    const indicateurs = distinctValues(rows, "Indicateur Id");
    expect(indicateurs).toEqual(
      expect.arrayContaining([
        INDICATEUR_FOR_IMPORT,
        INDICATEUR_FOR_FORM,
        INDICATEUR_FOR_OPEN_API,
      ]),
    );
    expect(distinctValues(rows, "Chantier Id")).not.toContain("CH-070");
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

    const rows = await fetchExport(page, "/api/export/historique-indicateurs");

    expect(rows.length).toBeGreaterThan(0);
    expect(distinctValues(rows, "Région")).toEqual(["Bretagne"]);
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

    const rows = await fetchExport(
      page,
      "/api/export/utilisateurs?typeCompte=actif",
    );

    const emails = rows.map((row) => row["Email"]);
    expect(emails).toContain("prefet.departement@example.com");
    expect(emails).not.toContain("ditp.admin@example.com");
    expect(emails).not.toContain("premiere.ministre@example.com");
  });
});

import { pageDeGardePdf } from "@/server/rapport-detaille/pdf/pageDeGarde";
import {
  buildTestContext,
  renderPdf,
  textOf,
} from "@/server/rapport-detaille/pdf/testHelpers";
import { TERRITOIRE_NATIONAL } from "@/server/rapport-detaille/testData";

const now = new Date("2026-10-01T07:05:00Z");

describe("pageDeGardePdf", () => {
  it("affiche le titre, la date de génération et le territoire", async () => {
    const page = pageDeGardePdf({
      territoire: TERRITOIRE_NATIONAL,
      context: buildTestContext(),
      ministères: [],
      axes: [],
      estAutoriseAVoirLesBrouillons: false,
      now,
    });

    const text = textOf(page);
    expect(text).toContain("État des lieux de l'avancement");
    expect(text).toContain("du Gouvernement");
    expect(text).toContain("Rapport détaillé généré le 01/10/2026 à 9h05");
    expect(text).toContain("Territoire sélectionné");
    expect(text).toContain("France");
    expect(text).toContain("PILOTE");
    expect(text).not.toContain("Axe(s)");
    expect(text).not.toContain("Chantiers validés");
    expect(await renderPdf(page)).toBe("%PDF");
  });

  it("liste les axes, typologies, statuts et alertes filtrés", () => {
    const page = pageDeGardePdf({
      territoire: TERRITOIRE_NATIONAL,
      context: buildTestContext({
        axes: "AXE-1",
        estBarometre: "true",
        estTerritorialise: "true",
        statut: "BROUILLON_ET_PUBLIE",
        estEnAlerteBaisse: "true",
      }),
      ministères: [],
      axes: [{ id: "AXE-1", nom: "Axe santé" }],
      estAutoriseAVoirLesBrouillons: true,
      now,
    });

    const text = textOf(page);
    expect(text).toContain("Axe(s)");
    expect(text).toContain("Axe santé");
    expect(text).toContain("Chantiers du baromètre");
    expect(text).toContain("Chantiers territorialisés");
    expect(text).toContain("Chantiers validés et en cours de publication");
    expect(text).toContain("Chantier(s) avec tendance en baisse");
  });

  it("regroupe les périmètres filtrés par ministère", () => {
    const page = pageDeGardePdf({
      territoire: TERRITOIRE_NATIONAL,
      context: buildTestContext({ perimetres: "PER-2" }),
      ministères: [
        {
          id: "MIN-1",
          acronyme: "MS",
          nom: "Ministère de la santé",
          icône: null,
          périmètresMinistériels: [
            {
              id: "PER-1",
              nom: "Santé",
              ministèreId: "MIN-1",
              ministèreNom: "Ministère de la santé",
            },
            {
              id: "PER-2",
              nom: "Prévention",
              ministèreId: "MIN-1",
              ministèreNom: "Ministère de la santé",
            },
          ],
        },
      ],
      axes: [],
      estAutoriseAVoirLesBrouillons: false,
      now,
    });

    const text = textOf(page);
    expect(text).toContain(
      "Ministère(s) ou périmètre(s) ministériel(s) sélectionné(s)",
    );
    expect(text).toContain("Ministère de la santé");
    expect(text).toContain("Prévention");
    expect(text).not.toContain(" Santé ");
  });
});

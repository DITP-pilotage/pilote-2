import {
  buildRapportDetailleDocument,
  generateRapportDetaillePdf,
  renderRapportDetaillePdf,
} from "@/server/rapport-detaille/pdf/generateRapportDetaillePdf";
import {
  buildTestChantierDetail,
  buildTestContext,
  buildTestVueDEnsemble,
} from "@/server/rapport-detaille/pdf/testHelpers";
import { buildTestChantier } from "@/server/rapport-detaille/testData";
import { ChantierDetail } from "@/server/rapport-detaille/rapportDetaille.interface";

function countPages(buffer: Buffer): number {
  return buffer.toString("latin1").match(/\/Type \/Page\b/g)?.length ?? 0;
}

const now = new Date("2026-10-01T07:05:00Z");

const SENTENCE =
  "Le chantier progresse sur l'ensemble des territoires, avec des écarts marqués entre les régions les plus avancées et celles qui démarrent seulement leur déploiement. ";

function longHtml(paragraphs: number): string {
  return Array.from({ length: paragraphs }, () => `<p>${SENTENCE}</p>`).join(
    "",
  );
}

const publication = (contenu: string) => ({
  id: "P-1",
  contenu,
  date: "2026-09-15T00:00:00Z",
  auteur: "Jeanne Martin",
});

describe("generateRapportDetaillePdf", () => {
  it("génère la page de garde et la vue d'ensemble sans le détail des chantiers", async () => {
    const params = {
      vue: buildTestVueDEnsemble({ chantiers: [buildTestChantier()] }),
      details: [],
      context: buildTestContext(),
      hideNonApplicable: false,
      now,
    };

    const document = buildRapportDetailleDocument(params);
    const buffer = await generateRapportDetaillePdf(params).getBuffer();

    expect(Array.isArray(document.content) && document.content.length).toBe(2);
    expect(document.pageSize).toEqual({
      width: 793.7007874015749,
      height: 1122.5196850393702,
    });
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    expect(countPages(buffer)).toBeGreaterThanOrEqual(2);
  });

  it("ajoute une fiche par chantier détaillé", async () => {
    const chantiers = ["A", "B", "C"].map((id) => buildTestChantier({ id }));
    const buffer = await generateRapportDetaillePdf({
      vue: buildTestVueDEnsemble({ chantiers }),
      details: chantiers.map((chantier) =>
        buildTestChantierDetail({ chantierId: chantier.id }),
      ),
      context: buildTestContext({ detail: "true" }),
      hideNonApplicable: false,
      now,
    }).getBuffer();

    expect(countPages(buffer)).toBeGreaterThanOrEqual(5);
  });

  it.each([
    [
      "de la synthèse des résultats",
      (html: string): Partial<ChantierDetail> => ({
        synthèseDesRésultats: { ...publication(html), météo: "SOLEIL" },
      }),
    ],
    [
      "des objectifs",
      (html: string): Partial<ChantierDetail> => ({
        objectifs: [{ ...publication(html), type: "notreAmbition" }],
      }),
    ],
    [
      "de la décision stratégique",
      (html: string): Partial<ChantierDetail> => ({
        décisionStratégique: {
          ...publication(html),
          type: "suiviDesDecisionsStrategiques",
        },
      }),
    ],
  ])(
    "garde tout le texte %s quand il dépasse une page",
    async (_, withLongText) => {
      const render = (paragraphs: number) =>
        generateRapportDetaillePdf({
          vue: buildTestVueDEnsemble({
            chantiers: [buildTestChantier({ id: "A" })],
          }),
          details: [
            buildTestChantierDetail({
              chantierId: "A",
              ...withLongText(longHtml(paragraphs)),
            }),
          ],
          context: buildTestContext({ detail: "true" }),
          hideNonApplicable: false,
          now,
        }).getBuffer();

      const pagesWithLongText = countPages(await render(40));
      const pagesWithTripleText = countPages(await render(120));

      expect(pagesWithTripleText).toBeGreaterThanOrEqual(pagesWithLongText + 2);
    },
  );

  it("renderRapportDetaillePdf renvoie un PDF complet", async () => {
    const pdf = await renderRapportDetaillePdf({
      vue: buildTestVueDEnsemble({ chantiers: [buildTestChantier()] }),
      details: [],
      context: buildTestContext(),
      hideNonApplicable: false,
      now,
    });
    const text = Buffer.from(pdf).toString("latin1");

    expect(pdf).toBeInstanceOf(Uint8Array);
    expect(text.startsWith("%PDF")).toBe(true);
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
  });

  it("remplace l'espace fine insécable, absente de Marianne, par une espace insécable", () => {
    const document = buildRapportDetailleDocument({
      vue: buildTestVueDEnsemble({
        chantiers: [buildTestChantier({ id: "A", nom: "Cible 10\u202f000" })],
      }),
      details: [buildTestChantierDetail({ chantierId: "A" })],
      context: buildTestContext({ detail: "true" }),
      hideNonApplicable: false,
      now,
    });
    const serialized = JSON.stringify(document.content);

    expect(serialized).not.toContain("\u202f");
    expect(serialized).toContain("Cible 10\u00a0000");
  });
});

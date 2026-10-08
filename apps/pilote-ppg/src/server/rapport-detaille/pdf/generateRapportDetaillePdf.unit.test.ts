import {
  buildRapportDetailleDocument,
  generateRapportDetaillePdf,
} from "@/server/rapport-detaille/pdf/generateRapportDetaillePdf";
import {
  buildTestChantierDetail,
  buildTestContext,
  buildTestVueDEnsemble,
} from "@/server/rapport-detaille/pdf/testHelpers";
import { buildTestChantier } from "@/server/rapport-detaille/testData";

function countPages(buffer: Buffer): number {
  return buffer.toString("latin1").match(/\/Type \/Page\b/g)?.length ?? 0;
}

const now = new Date("2026-10-01T07:05:00Z");

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
});

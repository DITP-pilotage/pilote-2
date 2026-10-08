vi.mock("@/server/dependances", () => ({ getContainer: vi.fn() }));

import {
  fetchChantierDetailsBatch,
  ChantierDetailsBatchDependencies,
} from "@/server/rapport-detaille/fetchChantierDetailsBatch";
import { buildTestSession } from "@/server/rapport-detaille/testSession";
import {
  buildTestChantier,
  TERRITOIRE_NATIONAL,
} from "@/server/rapport-detaille/testData";
import { buildTestChantierDetail } from "@/server/rapport-detaille/pdf/testHelpers";
import { TerritoireNonAutoriséErreur } from "@/server/utils/errors";

const session = buildTestSession({
  habilitations: {
    ...buildTestSession().habilitations,
    lecture: {
      ...buildTestSession().habilitations.lecture,
      chantiers: ["A"],
      territoires: ["NAT-FR"],
    },
  },
});

function buildDependencies(): ChantierDetailsBatchDependencies {
  return {
    loadChantiersByIds: vi.fn(async () => ({
      chantiers: [buildTestChantier({ id: "A" })],
      selectedTerritoire: TERRITOIRE_NATIONAL,
    })),
    loadChantierDetails: vi.fn(async () => [
      buildTestChantierDetail({ chantierId: "A" }),
    ]),
  };
}

describe("fetchChantierDetailsBatch", () => {
  it("renvoie seulement les détails des chantiers du lot", async () => {
    const dependencies = buildDependencies();

    const result = await fetchChantierDetailsBatch(
      {
        territoireCode: "NAT-FR",
        query: { maille: "regionale" },
        chantierIds: ["A", "Z"],
      },
      session,
      dependencies,
    );

    expect(dependencies.loadChantiersByIds).toHaveBeenCalledWith(
      ["A", "Z"],
      expect.objectContaining({
        territoireCode: "NAT-FR",
        selectedMaille: "regionale",
      }),
    );
    expect(Object.keys(result)).toEqual(["details"]);
    expect(result.details.map((detail) => detail.chantierId)).toEqual(["A"]);
  });

  it("refuse un territoire non habilité", async () => {
    const dependencies = buildDependencies();

    await expect(
      fetchChantierDetailsBatch(
        { territoireCode: "DEPT-75", query: {}, chantierIds: ["A"] },
        session,
        dependencies,
      ),
    ).rejects.toBeInstanceOf(TerritoireNonAutoriséErreur);
    expect(dependencies.loadChantiersByIds).not.toHaveBeenCalled();
  });
});

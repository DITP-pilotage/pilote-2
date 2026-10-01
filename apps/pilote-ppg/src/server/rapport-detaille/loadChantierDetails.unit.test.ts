vi.mock("@/server/dependances", () => ({ getContainer: vi.fn() }));

import {
  loadChantierDetails,
  ChantierDetailsDependencies,
} from "@/server/rapport-detaille/loadChantierDetails";
import { buildRapportDetailleContext } from "@/server/rapport-detaille/rapportDetailleContext";
import { buildTestSession } from "@/server/rapport-detaille/testSession";
import {
  buildTestChantier,
  buildTestTerritoireData,
  TERRITOIRE_NATIONAL,
  TERRITOIRE_PARIS,
} from "@/server/rapport-detaille/testData";

function buildTestDependencies(
  surcharges: Partial<ChantierDetailsDependencies> = {},
): ChantierDetailsDependencies {
  return {
    getStatistiquesByChantier: vi.fn(async (ids: string[]) =>
      Object.fromEntries(
        ids.map((id) => [id, { médiane: 40, minimum: 10, maximum: 90 }]),
      ),
    ),
    getIndicateursByChantier: vi.fn(async () => ({})),
    getDétailsIndicateursByChantier: vi.fn(async () => ({})),
    getIndicateursPrisEnCompte: vi.fn(async () => ["IND-1"]),
    getSynthèsesByChantier: vi.fn(async () => ({})),
    getDécisionsByChantier: vi.fn(async () => ({})),
    getCommentairesByChantier: vi.fn(async () => ({})),
    getObjectifsByChantier: vi.fn(async () => ({})),
    ...surcharges,
  };
}

const nationalSession = buildTestSession({
  habilitations: {
    ...buildTestSession().habilitations,
    lecture: {
      ...buildTestSession().habilitations.lecture,
      chantiers: ["A", "B"],
      territoires: ["NAT-FR", "REG-11", "DEPT-75"],
    },
  },
});

describe("loadChantierDetails", () => {
  it("charge les statistiques de tout le lot en un seul appel", async () => {
    const dependencies = buildTestDependencies();
    const context = buildRapportDetailleContext({}, "NAT-FR", nationalSession);

    await loadChantierDetails(
      [buildTestChantier({ id: "A" }), buildTestChantier({ id: "B" })],
      context,
      TERRITOIRE_NATIONAL,
      dependencies,
    );

    expect(dependencies.getStatistiquesByChantier).toHaveBeenCalledTimes(1);
    expect(dependencies.getStatistiquesByChantier).toHaveBeenCalledWith(
      ["A", "B"],
      "departementale",
      nationalSession.habilitations,
      context.jalon,
    );
  });

  it("renvoie un détail par chantier dans l'ordre reçu", async () => {
    const context = buildRapportDetailleContext({}, "NAT-FR", nationalSession);

    const details = await loadChantierDetails(
      [buildTestChantier({ id: "B" }), buildTestChantier({ id: "A" })],
      context,
      TERRITOIRE_NATIONAL,
      buildTestDependencies(),
    );

    expect(details.map((detail) => detail.chantierId)).toEqual(["B", "A"]);
    expect(details[0].avancement.nationale.global).toMatchObject({
      médiane: 40,
      minimum: 10,
      maximum: 90,
    });
    expect(details[0].listeIndicateursPrisEnCompteAvancement).toEqual([
      "IND-1",
    ]);
  });

  it("ne charge pas les décisions stratégiques sans accès au national", async () => {
    const dependencies = buildTestDependencies();
    const departementalSession = buildTestSession({
      habilitations: {
        ...buildTestSession().habilitations,
        lecture: {
          ...buildTestSession().habilitations.lecture,
          chantiers: ["A"],
          territoires: ["DEPT-75"],
        },
      },
    });
    const context = buildRapportDetailleContext(
      {},
      "DEPT-75",
      departementalSession,
    );

    const [detail] = await loadChantierDetails(
      [buildTestChantier({ id: "A" })],
      context,
      TERRITOIRE_PARIS,
      dependencies,
    );

    expect(dependencies.getDécisionsByChantier).not.toHaveBeenCalled();
    expect(detail.décisionStratégique).toBeNull();
  });

  it("lit l'avancement régional d'un département sur sa région parente", async () => {
    const context = buildRapportDetailleContext({}, "DEPT-75", nationalSession);
    const chantier = buildTestChantier({
      id: "A",
      mailles: {
        nationale: { "NAT-FR": buildTestTerritoireData() },
        regionale: {
          "REG-11": buildTestTerritoireData({
            avancement: { global: 55, annuel: 60, jalonParDefaut: null },
            dateTauxAvancementAnnuel: "2026-06-30",
          }),
        },
        departementale: {
          "DEPT-75": buildTestTerritoireData({
            avancement: { global: 70, annuel: 75, jalonParDefaut: null },
          }),
        },
      },
    });

    const [detail] = await loadChantierDetails(
      [chantier],
      context,
      TERRITOIRE_PARIS,
      buildTestDependencies(),
    );

    expect(detail.avancement.regionale.annuel.moyenne).toBe(60);
    expect(detail.avancement.departementale.annuel.moyenne).toBe(75);
  });

  it("construit les données de cartographie depuis la maille sélectionnée", async () => {
    const context = buildRapportDetailleContext(
      { maille: "regionale" },
      "NAT-FR",
      nationalSession,
    );
    const chantier = buildTestChantier({
      id: "A",
      mailles: {
        nationale: { "NAT-FR": buildTestTerritoireData() },
        regionale: {
          "REG-11": buildTestTerritoireData({
            avancement: { global: 55, annuel: 60, jalonParDefaut: null },
            météo: "SOLEIL",
            estApplicable: false,
          }),
        },
        departementale: {},
      },
    });

    const [detail] = await loadChantierDetails(
      [chantier],
      context,
      TERRITOIRE_NATIONAL,
      buildTestDependencies(),
    );

    expect(detail.donnéesCartographieAvancement).toEqual([
      {
        valeur: 55,
        valeurAnnuelle: 60,
        territoireCode: "REG-11",
        estApplicable: false,
      },
    ]);
    expect(detail.donnéesCartographieMétéo).toEqual([
      { valeur: "SOLEIL", territoireCode: "REG-11", estApplicable: false },
    ]);
  });
});

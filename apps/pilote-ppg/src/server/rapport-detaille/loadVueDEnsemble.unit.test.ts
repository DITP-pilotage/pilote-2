vi.mock("@/server/dependances", () => ({ getContainer: vi.fn() }));

import {
  loadChantiersByIds,
  loadVueDEnsemble,
  VueDEnsembleDependencies,
  restrictHabilitationsToChantiers,
} from "@/server/rapport-detaille/loadVueDEnsemble";
import { buildRapportDetailleContext } from "@/server/rapport-detaille/rapportDetailleContext";
import { buildTestSession } from "@/server/rapport-detaille/testSession";
import {
  buildTestChantier,
  buildTestTerritoireData,
  TERRITOIRE_NATIONAL,
} from "@/server/rapport-detaille/testData";

const chantierEnBaisse = buildTestChantier({
  id: "A",
  mailles: {
    nationale: {
      "NAT-FR": buildTestTerritoireData({ tendance: "BAISSE" }),
    },
    regionale: {},
    departementale: {},
  },
});
const chantierStable = buildTestChantier({ id: "B" });

function buildTestDependencies(
  surcharges: Partial<VueDEnsembleDependencies> = {},
): VueDEnsembleDependencies {
  return {
    getMinistèresAndAxes: vi.fn(async () => ({ ministères: [], axes: [] })),
    territoire: vi.fn(async () => TERRITOIRE_NATIONAL),
    chantiers: vi.fn(async () => [chantierEnBaisse, chantierStable]),
    getRépartitionMétéos: vi.fn(async () => ({
      COUVERT: 0,
      NUAGE: 1,
      ORAGE: 0,
      SOLEIL: 0,
    })),
    getAvancementsStatistiques: vi.fn(async () => ({
      médiane: 50,
      minimum: 10,
      maximum: 90,
    })),
    getTerritoiresAvancements: vi.fn(async () => ({
      moyenneTauxAvancementTerritoire: 42,
      avancementsGlobauxTerritoriauxMoyens: [],
    })),
    ...surcharges,
  };
}

const session = buildTestSession({
  habilitations: {
    ...buildTestSession().habilitations,
    lecture: {
      ...buildTestSession().habilitations.lecture,
      chantiers: ["A", "B"],
      territoires: ["NAT-FR"],
    },
  },
});

describe("loadVueDEnsemble", () => {
  it("applique les filtres d'alertes et calcule les compteurs sur tous les chantiers", async () => {
    const dependencies = buildTestDependencies();
    const context = buildRapportDetailleContext(
      { estEnAlerteBaisse: "true" },
      "NAT-FR",
      session,
    );

    const vue = await loadVueDEnsemble(context, dependencies);

    expect(vue.chantiers.map((chantier) => chantier.id)).toEqual(["A"]);
    expect(vue.filtresComptesCalculés.estEnAlerteBaisse).toBe(1);
    expect(dependencies.getRépartitionMétéos).toHaveBeenCalledWith(
      "NAT-FR",
      context.filters,
      [],
      ["A"],
    );
    expect(vue.moyenneTauxAvancementTerritoire).toBe(42);
    expect(vue.avancementsAgrégés).toEqual({
      médiane: 50,
      minimum: 10,
      maximum: 90,
    });
  });

  it("garde tous les chantiers sans filtre d'alerte", async () => {
    const context = buildRapportDetailleContext({}, "NAT-FR", session);

    const vue = await loadVueDEnsemble(context, buildTestDependencies());

    expect(vue.chantiers.map((chantier) => chantier.id)).toEqual(["A", "B"]);
  });

  it("signale les chantiers archivés et le droit de voir les brouillons", async () => {
    const context = buildRapportDetailleContext(
      { statut: "ARCHIVE" },
      "NAT-FR",
      buildTestSession({ profil: "DITP_PILOTAGE" }),
    );

    const vue = await loadVueDEnsemble(context, buildTestDependencies());

    expect(vue.chantiersSontArchives).toBe(true);
    expect(vue.estAutoriseAVoirLesBrouillons).toBe(true);
  });

  it("refuse les brouillons aux profils non autorisés", async () => {
    const context = buildRapportDetailleContext(
      {},
      "NAT-FR",
      buildTestSession({ profil: "SECRETARIAT_GENERAL" }),
    );

    const vue = await loadVueDEnsemble(context, buildTestDependencies());

    expect(vue.estAutoriseAVoirLesBrouillons).toBe(false);
  });
});

describe("restrictHabilitationsToChantiers", () => {
  it("ne garde en lecture que les chantiers demandés et habilités", () => {
    const restricted = restrictHabilitationsToChantiers(session.habilitations, [
      "A",
      "Z",
    ]);

    expect(restricted.lecture.chantiers).toEqual(["A"]);
    expect(restricted.lecture.territoires).toEqual(["NAT-FR"]);
  });
});

describe("loadChantiersByIds", () => {
  it("garde les ministères et axes de toutes les habilitations pour ne restreindre que les chantiers", async () => {
    const dependencies = buildTestDependencies({
      getMinistèresAndAxes: vi.fn(async () => ({
        ministères: [],
        axes: [
          { id: "AXE-A", nom: "Axe A" },
          { id: "AXE-B", nom: "Axe B" },
        ],
      })),
    });
    const context = buildRapportDetailleContext(
      { axes: "AXE-A,AXE-B" },
      "NAT-FR",
      session,
    );

    await loadChantiersByIds(["A"], context, dependencies);

    expect(dependencies.getMinistèresAndAxes).toHaveBeenCalledWith(["A", "B"]);
    const [restrictedContext, , axes] = vi.mocked(dependencies.chantiers).mock
      .calls[0];
    expect(restrictedContext.session.habilitations.lecture.chantiers).toEqual([
      "A",
    ]);
    expect(axes.map((axe) => axe.id)).toEqual(["AXE-A", "AXE-B"]);
  });
});

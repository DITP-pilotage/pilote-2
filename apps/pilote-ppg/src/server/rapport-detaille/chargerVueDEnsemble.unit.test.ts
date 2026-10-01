vi.mock("@/server/dependances", () => ({ getContainer: vi.fn() }));

import {
  chargerVueDEnsemble,
  DependancesVueDEnsemble,
  restreindreHabilitationsAuxChantiers,
} from "@/server/rapport-detaille/chargerVueDEnsemble";
import { construireContexteRapportDetaille } from "@/server/rapport-detaille/contexteRapportDetaille";
import { sessionDeTest } from "@/server/rapport-detaille/sessionDeTest";
import {
  chantierDeTest,
  donnéeTerritoireDeTest,
  TERRITOIRE_NATIONAL,
} from "@/server/rapport-detaille/donneesDeTest";

const chantierEnBaisse = chantierDeTest({
  id: "A",
  mailles: {
    nationale: {
      "NAT-FR": donnéeTerritoireDeTest({ tendance: "BAISSE" }),
    },
    regionale: {},
    departementale: {},
  },
});
const chantierStable = chantierDeTest({ id: "B" });

function dependancesDeTest(
  surcharges: Partial<DependancesVueDEnsemble> = {},
): DependancesVueDEnsemble {
  return {
    ministèresEtAxes: vi.fn(async () => ({ ministères: [], axes: [] })),
    territoire: vi.fn(async () => TERRITOIRE_NATIONAL),
    chantiers: vi.fn(async () => [chantierEnBaisse, chantierStable]),
    répartitionMétéos: vi.fn(async () => ({
      COUVERT: 0,
      NUAGE: 1,
      ORAGE: 0,
      SOLEIL: 0,
    })),
    statistiquesAgrégées: vi.fn(async () => ({
      médiane: 50,
      minimum: 10,
      maximum: 90,
    })),
    avancementsTerritoires: vi.fn(async () => ({
      moyenneTauxAvancementTerritoire: 42,
      avancementsGlobauxTerritoriauxMoyens: [],
    })),
    ...surcharges,
  };
}

const session = sessionDeTest({
  habilitations: {
    ...sessionDeTest().habilitations,
    lecture: {
      ...sessionDeTest().habilitations.lecture,
      chantiers: ["A", "B"],
      territoires: ["NAT-FR"],
    },
  },
});

describe("chargerVueDEnsemble", () => {
  it("applique les filtres d'alertes et calcule les compteurs sur tous les chantiers", async () => {
    const dependances = dependancesDeTest();
    const contexte = construireContexteRapportDetaille(
      { estEnAlerteBaisse: "true" },
      "NAT-FR",
      session,
    );

    const vue = await chargerVueDEnsemble(contexte, dependances);

    expect(vue.chantiers.map((chantier) => chantier.id)).toEqual(["A"]);
    expect(vue.filtresComptesCalculés.estEnAlerteBaisse).toBe(1);
    expect(dependances.répartitionMétéos).toHaveBeenCalledWith(
      "NAT-FR",
      contexte.filtres,
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
    const contexte = construireContexteRapportDetaille({}, "NAT-FR", session);

    const vue = await chargerVueDEnsemble(contexte, dependancesDeTest());

    expect(vue.chantiers.map((chantier) => chantier.id)).toEqual(["A", "B"]);
  });

  it("signale les chantiers archivés et le droit de voir les brouillons", async () => {
    const contexte = construireContexteRapportDetaille(
      { statut: "ARCHIVE" },
      "NAT-FR",
      sessionDeTest({ profil: "DITP_PILOTAGE" }),
    );

    const vue = await chargerVueDEnsemble(contexte, dependancesDeTest());

    expect(vue.chantiersSontArchives).toBe(true);
    expect(vue.estAutoriseAVoirLesBrouillons).toBe(true);
  });

  it("refuse les brouillons aux profils non autorisés", async () => {
    const contexte = construireContexteRapportDetaille(
      {},
      "NAT-FR",
      sessionDeTest({ profil: "SECRETARIAT_GENERAL" }),
    );

    const vue = await chargerVueDEnsemble(contexte, dependancesDeTest());

    expect(vue.estAutoriseAVoirLesBrouillons).toBe(false);
  });
});

describe("restreindreHabilitationsAuxChantiers", () => {
  it("ne garde en lecture que les chantiers demandés et habilités", () => {
    const restreintes = restreindreHabilitationsAuxChantiers(
      session.habilitations,
      ["A", "Z"],
    );

    expect(restreintes.lecture.chantiers).toEqual(["A"]);
    expect(restreintes.lecture.territoires).toEqual(["NAT-FR"]);
  });
});

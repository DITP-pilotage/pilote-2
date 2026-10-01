vi.mock("@/server/dependances", () => ({ getContainer: vi.fn() }));

import {
  chargerDetailsChantiers,
  DependancesDetailsChantiers,
} from "@/server/rapport-detaille/chargerDetailsChantiers";
import { construireContexteRapportDetaille } from "@/server/rapport-detaille/contexteRapportDetaille";
import { sessionDeTest } from "@/server/rapport-detaille/sessionDeTest";
import {
  chantierDeTest,
  donnéeTerritoireDeTest,
  TERRITOIRE_NATIONAL,
  TERRITOIRE_PARIS,
} from "@/server/rapport-detaille/donneesDeTest";

function dependancesDeTest(
  surcharges: Partial<DependancesDetailsChantiers> = {},
): DependancesDetailsChantiers {
  return {
    statistiquesParChantier: vi.fn(async (ids: string[]) =>
      Object.fromEntries(
        ids.map((id) => [id, { médiane: 40, minimum: 10, maximum: 90 }]),
      ),
    ),
    indicateursGroupés: vi.fn(async () => ({})),
    détailsIndicateursGroupés: vi.fn(async () => ({})),
    indicateursPrisEnCompte: vi.fn(async () => ["IND-1"]),
    synthèsesGroupées: vi.fn(async () => ({})),
    décisionsGroupées: vi.fn(async () => ({})),
    commentairesGroupés: vi.fn(async () => ({})),
    objectifsGroupés: vi.fn(async () => ({})),
    ...surcharges,
  };
}

const sessionNationale = sessionDeTest({
  habilitations: {
    ...sessionDeTest().habilitations,
    lecture: {
      ...sessionDeTest().habilitations.lecture,
      chantiers: ["A", "B"],
      territoires: ["NAT-FR", "REG-11", "DEPT-75"],
    },
  },
});

describe("chargerDetailsChantiers", () => {
  it("charge les statistiques de tout le lot en un seul appel", async () => {
    const dependances = dependancesDeTest();
    const contexte = construireContexteRapportDetaille(
      {},
      "NAT-FR",
      sessionNationale,
    );

    await chargerDetailsChantiers(
      [chantierDeTest({ id: "A" }), chantierDeTest({ id: "B" })],
      contexte,
      TERRITOIRE_NATIONAL,
      dependances,
    );

    expect(dependances.statistiquesParChantier).toHaveBeenCalledTimes(1);
    expect(dependances.statistiquesParChantier).toHaveBeenCalledWith(
      ["A", "B"],
      "departementale",
      sessionNationale.habilitations,
      contexte.jalon,
    );
  });

  it("renvoie un détail par chantier dans l'ordre reçu", async () => {
    const contexte = construireContexteRapportDetaille(
      {},
      "NAT-FR",
      sessionNationale,
    );

    const details = await chargerDetailsChantiers(
      [chantierDeTest({ id: "B" }), chantierDeTest({ id: "A" })],
      contexte,
      TERRITOIRE_NATIONAL,
      dependancesDeTest(),
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
    const dependances = dependancesDeTest();
    const sessionDépartementale = sessionDeTest({
      habilitations: {
        ...sessionDeTest().habilitations,
        lecture: {
          ...sessionDeTest().habilitations.lecture,
          chantiers: ["A"],
          territoires: ["DEPT-75"],
        },
      },
    });
    const contexte = construireContexteRapportDetaille(
      {},
      "DEPT-75",
      sessionDépartementale,
    );

    const [detail] = await chargerDetailsChantiers(
      [chantierDeTest({ id: "A" })],
      contexte,
      TERRITOIRE_PARIS,
      dependances,
    );

    expect(dependances.décisionsGroupées).not.toHaveBeenCalled();
    expect(detail.décisionStratégique).toBeNull();
  });

  it("lit l'avancement régional d'un département sur sa région parente", async () => {
    const contexte = construireContexteRapportDetaille(
      {},
      "DEPT-75",
      sessionNationale,
    );
    const chantier = chantierDeTest({
      id: "A",
      mailles: {
        nationale: { "NAT-FR": donnéeTerritoireDeTest() },
        regionale: {
          "REG-11": donnéeTerritoireDeTest({
            avancement: { global: 55, annuel: 60, jalonParDefaut: null },
            dateTauxAvancementAnnuel: "2026-06-30",
          }),
        },
        departementale: {
          "DEPT-75": donnéeTerritoireDeTest({
            avancement: { global: 70, annuel: 75, jalonParDefaut: null },
          }),
        },
      },
    });

    const [detail] = await chargerDetailsChantiers(
      [chantier],
      contexte,
      TERRITOIRE_PARIS,
      dependancesDeTest(),
    );

    expect(detail.avancement.regionale.annuel.moyenne).toBe(60);
    expect(detail.avancement.departementale.annuel.moyenne).toBe(75);
  });

  it("construit les données de cartographie depuis la maille sélectionnée", async () => {
    const contexte = construireContexteRapportDetaille(
      { maille: "regionale" },
      "NAT-FR",
      sessionNationale,
    );
    const chantier = chantierDeTest({
      id: "A",
      mailles: {
        nationale: { "NAT-FR": donnéeTerritoireDeTest() },
        regionale: {
          "REG-11": donnéeTerritoireDeTest({
            avancement: { global: 55, annuel: 60, jalonParDefaut: null },
            météo: "SOLEIL",
            estApplicable: false,
          }),
        },
        departementale: {},
      },
    });

    const [detail] = await chargerDetailsChantiers(
      [chantier],
      contexte,
      TERRITOIRE_NATIONAL,
      dependancesDeTest(),
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

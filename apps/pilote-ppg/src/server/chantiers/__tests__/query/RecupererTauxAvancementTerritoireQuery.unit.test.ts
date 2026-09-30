import { extraireTauxAvancementTerritoire } from "@/server/chantiers/query/RecupererTauxAvancementTerritoireQuery";
import {
  Agregat,
  AgregatParTerritoire,
} from "@/server/chantiers/domain/agrégateurListeChantiers/agregateur.interface";

const repartition = (moyenneAnnuelle: number | null) => ({
  avancements: {
    global: { moyenne: null, mediane: null, minimum: null, maximum: null },
    annuel: { moyenne: moyenneAnnuelle },
  },
});

const agregatAvecTerritoires = (
  territoires: Record<string, number | null>,
): Agregat => ({
  repartition: repartition(null),
  territoires: Object.fromEntries(
    Object.entries(territoires).map(([code, moyenne]) => [
      code,
      { repartition: repartition(moyenne), donneesBrutes: { avancements: [] } },
    ]),
  ),
});

const agregat: AgregatParTerritoire = {
  nationale: agregatAvecTerritoires({ "NAT-FR": 52 }),
  regionale: agregatAvecTerritoires({ "REG-11": 61 }),
  departementale: agregatAvecTerritoires({ "DEPT-75": 38, "DEPT-92": null }),
};

describe("extraireTauxAvancementTerritoire", () => {
  it.each([
    ["NAT-FR", 52],
    ["REG-11", 61],
    ["DEPT-75", 38],
  ])(
    "lit la moyenne annuelle de %s dans la maille déduite de son code",
    (code, attendu) => {
      expect(extraireTauxAvancementTerritoire(agregat, code)).toBe(attendu);
    },
  );

  it("retourne null quand le territoire n'a pas de taux", () => {
    expect(extraireTauxAvancementTerritoire(agregat, "DEPT-92")).toBeNull();
  });

  it("retourne null quand le territoire est absent de l'agrégat", () => {
    expect(extraireTauxAvancementTerritoire(agregat, "DEPT-13")).toBeNull();
  });
});

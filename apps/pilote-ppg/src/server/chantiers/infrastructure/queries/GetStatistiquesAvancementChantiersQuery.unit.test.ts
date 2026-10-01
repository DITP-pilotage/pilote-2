import {
  calculerStatistiquesAvancement,
  calculerStatistiquesAvancementParChantier,
} from "@/server/chantiers/infrastructure/queries/GetStatistiquesAvancementChantiersQuery";

const lignes = [
  { id: "A", territoire_code: "DEPT-01", _avg: { taux_avancement: 10 } },
  { id: "A", territoire_code: "DEPT-03", _avg: { taux_avancement: 20 } },
  { id: "B", territoire_code: "DEPT-01", _avg: { taux_avancement: 50 } },
  { id: "A", territoire_code: "DEPT-02", _avg: { taux_avancement: 30 } },
];

describe("calculerStatistiquesAvancementParChantier", () => {
  it("calcule médiane, minimum et maximum de chaque chantier demandé", () => {
    expect(
      calculerStatistiquesAvancementParChantier(lignes, ["A", "B"]),
    ).toEqual({
      A: { médiane: 20, minimum: 10, maximum: 30 },
      B: { médiane: 50, minimum: 50, maximum: 50 },
    });
  });

  it("renvoie des statistiques vides pour un chantier sans valeur", () => {
    expect(calculerStatistiquesAvancementParChantier(lignes, ["C"])).toEqual({
      C: { médiane: null, minimum: null, maximum: null },
    });
  });

  it("donne pour un chantier le même résultat que le calcul sur ce seul chantier", () => {
    const lignesDeA = lignes
      .filter((ligne) => ligne.id === "A")
      .map(({ territoire_code, _avg }) => ({ territoire_code, _avg }));

    expect(calculerStatistiquesAvancementParChantier(lignes, ["A"]).A).toEqual(
      calculerStatistiquesAvancement(lignesDeA),
    );
  });
});

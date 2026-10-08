import { clsxm } from "@/utils/clsxm";

describe("clsxm", () => {
  it("garde une taille de texte DSFR à côté d'une couleur de texte", () => {
    expect(
      clsxm("text-h2 md:text-h2-md font-bold", "text-dsfr-blue-france-sun-113"),
    ).toEqual("text-h2 md:text-h2-md font-bold text-dsfr-blue-france-sun-113");
  });

  it("garde text-lead à côté d'une couleur de texte", () => {
    expect(clsxm("text-lead", "text-primary")).toEqual(
      "text-lead text-primary",
    );
  });

  it("ne garde que la dernière de deux tailles de texte", () => {
    expect(clsxm("text-sm", "text-h4")).toEqual("text-h4");
  });
});

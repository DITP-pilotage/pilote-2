import { cheminDeRetourSur } from "@/server/authentification/domain/cheminDeRetour";

describe("cheminDeRetourSur", () => {
  it.each([
    "/accueil/chantier/NAT-FR",
    "/chantier/CH-001?onglet=indicateurs",
    "/",
  ])("accepte le chemin interne %s", (chemin) => {
    expect(cheminDeRetourSur({ chemin })).toBe(chemin);
  });

  it.each([
    "https://exemple.test/phishing",
    "//exemple.test/phishing",
    "/\\exemple.test",
    "javascript:alert(1)",
  ])("refuse le chemin non interne %s", (chemin) => {
    expect(cheminDeRetourSur({ chemin })).toBeNull();
  });

  it("accepte un chemin long chargé de filtres", () => {
    const chemin = `/${"a".repeat(2047)}`;

    expect(cheminDeRetourSur({ chemin })).toBe(chemin);
  });

  it("refuse un chemin déraisonnablement long", () => {
    expect(cheminDeRetourSur({ chemin: `/${"a".repeat(2048)}` })).toBeNull();
  });

  it.each([null, undefined, ""])("refuse la valeur vide %p", (chemin) => {
    expect(cheminDeRetourSur({ chemin })).toBeNull();
  });
});

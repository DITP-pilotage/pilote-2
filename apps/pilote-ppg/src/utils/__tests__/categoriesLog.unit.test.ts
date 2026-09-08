import { CATEGORIES_LOG, libelleCategorieLog } from "@/utils/categoriesLog";

describe("categoriesLog", () => {
  describe("libelleCategorieLog", () => {
    it.each(Object.entries(CATEGORIES_LOG))(
      "retourne le libelle lisible de la categorie %s",
      (categorie, libelle) => {
        expect(libelleCategorieLog(categorie)).toBe(libelle);
      },
    );

    it.each([
      {
        cas: "une categorie historique disparue",
        categorie: "application-log",
      },
      { cas: "une categorie inconnue", categorie: "acme" },
    ])("retourne la valeur brute pour $cas", ({ categorie }) => {
      expect(libelleCategorieLog(categorie)).toBe(categorie);
    });
  });
});

import rechercheUnTexteContenuDansUnContenant from "@/client/utils/rechercheUnTexteContenuDansUnContenant";

describe("rechercheUnTexteContenuDansUnContenant", () => {
  it.each([
    ["ile", "Île-de-France"],
    ["reunion", "La Réunion"],
    ["ardeche", "Ardèche"],
    ["MORB", "Morbihan"],
    [" morb ", "Morbihan"],
  ])(
    "trouve « %s » dans « %s » sans tenir compte des accents ni de la casse",
    (recherche, contenant) => {
      expect(rechercheUnTexteContenuDansUnContenant(recherche, contenant)).toBe(
        true,
      );
    },
  );

  it("ne trouve pas un texte absent du contenant", () => {
    expect(rechercheUnTexteContenuDansUnContenant("bretagne", "Morbihan")).toBe(
      false,
    );
  });
});

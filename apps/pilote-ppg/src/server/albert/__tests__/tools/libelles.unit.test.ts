import {
  codeMeteoDepuisLibelle,
  libelleCategorieSignalement,
  libelleNiveauDeConfiance,
  libelleTendance,
  mailleDePilotage,
} from "@/server/albert/tools/libelles";

describe("libelleNiveauDeConfiance", () => {
  it.each`
    meteo               | libelle
    ${"ORAGE"}          | ${"Objectifs compromis"}
    ${"NUAGE"}          | ${"Appuis nécessaires"}
    ${"COUVERT"}        | ${"Objectifs atteignables"}
    ${"SOLEIL"}         | ${"Objectifs sécurisés"}
    ${"NON_RENSEIGNEE"} | ${"Non renseignée"}
    ${null}             | ${null}
    ${"INCONNU"}        | ${null}
  `("traduit $meteo en $libelle", ({ meteo, libelle }) => {
    expect(libelleNiveauDeConfiance({ meteo })).toEqual(libelle);
  });
});

describe("codeMeteoDepuisLibelle", () => {
  it("retrouve le code d'un niveau saisissable", () => {
    expect(codeMeteoDepuisLibelle({ libelle: "Appuis nécessaires" })).toEqual(
      "NUAGE",
    );
  });

  it("ne renvoie pas de code pour un libellé hors des quatre niveaux", () => {
    expect(codeMeteoDepuisLibelle({ libelle: "Non renseignée" })).toBeNull();
  });
});

describe("libelleTendance", () => {
  it.each`
    tendance        | libelle
    ${"HAUSSE"}     | ${"En hausse"}
    ${"BAISSE"}     | ${"En baisse"}
    ${"STAGNATION"} | ${"Stable"}
    ${null}         | ${null}
  `("traduit $tendance en $libelle", ({ tendance, libelle }) => {
    expect(libelleTendance({ tendance })).toEqual(libelle);
  });
});

describe("mailleDePilotage", () => {
  it.each`
    mailles                   | maille
    ${["NAT"]}                | ${"nationale"}
    ${["NAT", "REG"]}         | ${"régionale"}
    ${["NAT", "REG", "DEPT"]} | ${"départementale"}
    ${[]}                     | ${null}
  `("retient la maille la plus fine de $mailles", ({ mailles, maille }) => {
    expect(mailleDePilotage({ mailles })).toEqual(maille);
  });
});

describe("libelleCategorieSignalement", () => {
  it("traduit une catégorie de signalement en son libellé officiel", () => {
    expect(
      libelleCategorieSignalement({ categorie: "estEnAlerteÉcart" }),
    ).toEqual("Retard par rapport à la médiane");
  });
});

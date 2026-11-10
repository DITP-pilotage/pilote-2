import {
  codeMeteoDepuisLibelle,
  designationMaille,
  libelleCategorieSignalement,
  libelleMaille,
  libelleOuAbsence,
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

describe("libelleMaille", () => {
  it.each`
    maille    | libelle
    ${"NAT"}  | ${"nationale"}
    ${"REG"}  | ${"régionale"}
    ${"DEPT"} | ${"départementale"}
  `("traduit $maille en $libelle", ({ maille, libelle }) => {
    expect(libelleMaille({ maille })).toEqual(libelle);
  });
});

describe("designationMaille", () => {
  it.each`
    territoireCode | designation
    ${"NAT-FR"}    | ${"national"}
    ${"REG-53"}    | ${"région"}
    ${"DEPT-56"}   | ${"département"}
  `(
    "désigne la maille de $territoireCode : $designation",
    ({ territoireCode, designation }) => {
      expect(designationMaille({ territoireCode })).toEqual(designation);
    },
  );
});

describe("libelleOuAbsence", () => {
  it("écrit le libellé d'une valeur présente", () => {
    expect(
      libelleOuAbsence({
        valeur: 40.2,
        absence: "non calculé",
        libelle: (taux) => `${Math.round(taux)} %`,
      }),
    ).toEqual("40 %");
  });

  it("écrit l'absence d'une valeur nulle", () => {
    expect(
      libelleOuAbsence({ valeur: null, absence: "non renseignée" }),
    ).toEqual("non renseignée");
  });

  it("écrit la restriction d'accès d'une valeur masquée, plutôt que son absence", () => {
    expect(
      libelleOuAbsence({
        valeur: null,
        absence: "non renseignée",
        masquee: true,
      }),
    ).toEqual("non accessible (restriction d'accès)");
  });
});

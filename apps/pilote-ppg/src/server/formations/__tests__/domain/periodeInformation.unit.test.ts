import {
  aujourdhuiAParis,
  jourPrecedent,
  statutPeriode,
  validerPeriode,
} from "@/server/formations/domain/periodeInformation";

const AUJOURDHUI = "2026-11-18";
const valide = {
  dateDebut: "2026-12-01",
  dateFin: "2026-12-31",
  motifIds: [900001],
};

describe("aujourdhuiAParis", () => {
  it("donne le jour à Paris, pas le jour UTC", () => {
    expect(aujourdhuiAParis(new Date("2026-11-18T23:30:00Z"))).toEqual(
      "2026-11-19",
    );
    expect(aujourdhuiAParis(new Date("2026-07-01T21:59:00Z"))).toEqual(
      "2026-07-01",
    );
    expect(aujourdhuiAParis(new Date("2026-07-01T22:00:00Z"))).toEqual(
      "2026-07-02",
    );
  });
});

describe("jourPrecedent", () => {
  it("recule d'un jour en changeant de mois", () => {
    expect(jourPrecedent("2026-03-01")).toEqual("2026-02-28");
  });
});

describe("statutPeriode", () => {
  it("est à venir avant le premier jour, en cours du premier au dernier jour inclus, passée ensuite", () => {
    const periode = { dateDebut: "2026-11-18", dateFin: "2026-11-30" };
    expect(statutPeriode(periode, "2026-11-17")).toEqual("A_VENIR");
    expect(statutPeriode(periode, "2026-11-18")).toEqual("EN_COURS");
    expect(statutPeriode(periode, "2026-11-30")).toEqual("EN_COURS");
    expect(statutPeriode(periode, "2026-12-01")).toEqual("PASSEE");
  });
});

describe("validerPeriode", () => {
  it("accepte une nouvelle période valide", () => {
    expect(
      validerPeriode({
        saisie: valide,
        periodeModifiee: null,
        autresPeriodes: [],
        aujourdhui: AUJOURDHUI,
      }),
    ).toEqual({});
  });

  it("demande les deux dates et au moins une formation", () => {
    expect(
      validerPeriode({
        saisie: { dateDebut: "", dateFin: "", motifIds: [] },
        periodeModifiee: null,
        autresPeriodes: [],
        aujourdhui: AUJOURDHUI,
      }),
    ).toEqual({
      dateDebut: "Indiquez une date de début.",
      dateFin: "Indiquez une date de fin.",
      motifIds: "Choisissez au moins une formation.",
    });
  });

  it("refuse une fin avant le début", () => {
    expect(
      validerPeriode({
        saisie: { ...valide, dateFin: "2026-11-30" },
        periodeModifiee: null,
        autresPeriodes: [],
        aujourdhui: AUJOURDHUI,
      }),
    ).toEqual({
      dateFin:
        "La date de fin doit être égale ou postérieure à la date de début.",
    });
  });

  it("refuse une nouvelle période qui finit avant aujourd'hui", () => {
    expect(
      validerPeriode({
        saisie: { ...valide, dateDebut: "2026-11-01", dateFin: "2026-11-17" },
        periodeModifiee: null,
        autresPeriodes: [],
        aujourdhui: AUJOURDHUI,
      }),
    ).toEqual({ dateFin: "La date de fin ne peut pas être passée." });
  });

  it("refuse un chevauchement d'un seul jour, bornes comprises", () => {
    expect(
      validerPeriode({
        saisie: { ...valide, dateDebut: "2026-11-30" },
        periodeModifiee: null,
        autresPeriodes: [{ dateDebut: "2026-11-03", dateFin: "2026-11-30" }],
        aujourdhui: AUJOURDHUI,
      }),
    ).toEqual({
      dateDebut: "Cette période chevauche celle du 03/11/2026 au 30/11/2026.",
    });
  });

  it("accepte une période qui commence le lendemain de la fin d'une autre", () => {
    expect(
      validerPeriode({
        saisie: valide,
        periodeModifiee: null,
        autresPeriodes: [{ dateDebut: "2026-11-03", dateFin: "2026-11-30" }],
        aujourdhui: AUJOURDHUI,
      }),
    ).toEqual({});
  });

  it("refuse toute modification d'une période passée", () => {
    expect(
      validerPeriode({
        saisie: valide,
        periodeModifiee: { dateDebut: "2026-10-01", dateFin: "2026-10-31" },
        autresPeriodes: [],
        aujourdhui: AUJOURDHUI,
      }),
    ).toEqual({ periode: "Une période passée ne se modifie plus." });
  });

  it("fige le début d'une période en cours et accepte de l'arrêter hier, pas avant", () => {
    const enCours = { dateDebut: "2026-11-10", dateFin: "2026-11-30" };
    expect(
      validerPeriode({
        saisie: { ...valide, dateDebut: "2026-11-12", dateFin: "2026-11-30" },
        periodeModifiee: enCours,
        autresPeriodes: [],
        aujourdhui: AUJOURDHUI,
      }),
    ).toEqual({
      dateDebut: "La date de début d'une période en cours ne se modifie plus.",
    });
    expect(
      validerPeriode({
        saisie: { ...valide, dateDebut: "2026-11-10", dateFin: "2026-11-17" },
        periodeModifiee: enCours,
        autresPeriodes: [],
        aujourdhui: AUJOURDHUI,
      }),
    ).toEqual({});
    expect(
      validerPeriode({
        saisie: { ...valide, dateDebut: "2026-11-10", dateFin: "2026-11-16" },
        periodeModifiee: enCours,
        autresPeriodes: [],
        aujourdhui: AUJOURDHUI,
      }),
    ).toEqual({
      dateFin: "La date de fin ne peut pas être antérieure à hier.",
    });
  });
});

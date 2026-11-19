import {
  aujourdhuiAParis,
  jourISO,
  periodesChevauchees,
  schemaPeriode,
  statutPeriode,
  type JourISO,
  type SaisiePeriode,
} from "@/server/formations/domain/periodeInformation";

const AUJOURDHUI = "2026-11-18";
const valide = {
  dateDebut: "2026-12-01",
  dateFin: "2026-12-31",
  motifIds: [900001],
};

function erreurs(
  saisie: SaisiePeriode,
  debutFige: JourISO | null = null,
): Record<string, string> {
  const resultat = schemaPeriode({
    aujourdhui: AUJOURDHUI,
    debutFige,
  }).safeParse(saisie);
  if (resultat.success) return {};
  return Object.fromEntries(
    resultat.error.issues.map((issue) => [issue.path.join("."), issue.message]),
  );
}

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

describe("jourISO", () => {
  it("donne le jour d'une date lue dans une colonne date", () => {
    expect(jourISO(new Date("2026-11-03T00:00:00Z"))).toEqual("2026-11-03");
  });
});

describe("statutPeriode", () => {
  it("est à venir avant le premier jour, en cours du premier au dernier jour inclus, passée ensuite", () => {
    const periode = {
      dateDebut: "2026-11-18",
      dateFin: "2026-11-30",
      supprimee: false,
    };
    expect(statutPeriode(periode, "2026-11-17")).toEqual("A_VENIR");
    expect(statutPeriode(periode, "2026-11-18")).toEqual("EN_COURS");
    expect(statutPeriode(periode, "2026-11-30")).toEqual("EN_COURS");
    expect(statutPeriode(periode, "2026-12-01")).toEqual("PASSEE");
  });

  it("est supprimée quelles que soient ses dates", () => {
    const periode = {
      dateDebut: "2026-11-18",
      dateFin: "2026-11-30",
      supprimee: true,
    };
    expect(statutPeriode(periode, "2026-11-17")).toEqual("SUPPRIMEE");
    expect(statutPeriode(periode, "2026-11-20")).toEqual("SUPPRIMEE");
    expect(statutPeriode(periode, "2026-12-01")).toEqual("SUPPRIMEE");
  });
});

describe("periodesChevauchees", () => {
  it("garde les périodes qui partagent au moins un jour, bornes comprises", () => {
    const finitLeJourDuDebut = {
      id: "a",
      dateDebut: "2026-11-03",
      dateFin: "2026-12-01",
    };
    const englobee = {
      id: "b",
      dateDebut: "2026-12-10",
      dateFin: "2026-12-12",
    };
    const commenceLeJourDeLaFin = {
      id: "c",
      dateDebut: "2026-12-31",
      dateFin: "2027-01-15",
    };

    expect(
      periodesChevauchees(valide, [
        finitLeJourDuDebut,
        englobee,
        commenceLeJourDeLaFin,
      ]),
    ).toEqual([finitLeJourDuDebut, englobee, commenceLeJourDeLaFin]);
  });

  it("écarte les périodes accolées", () => {
    expect(
      periodesChevauchees(valide, [
        { dateDebut: "2026-11-03", dateFin: "2026-11-30" },
        { dateDebut: "2027-01-01", dateFin: "2027-01-31" },
      ]),
    ).toEqual([]);
  });
});

describe("schemaPeriode", () => {
  it("accepte une période d'un seul jour qui commence aujourd'hui", () => {
    expect(
      erreurs({ ...valide, dateDebut: AUJOURDHUI, dateFin: AUJOURDHUI }),
    ).toEqual({});
  });

  it("demande les deux dates et au moins une formation", () => {
    expect(erreurs({ dateDebut: "", dateFin: "", motifIds: [] })).toEqual({
      dateDebut: "Indiquez une date de début.",
      dateFin: "Indiquez une date de fin.",
      motifIds: "Choisissez au moins une formation.",
    });
  });

  it("refuse une fin avant le début", () => {
    expect(erreurs({ ...valide, dateFin: "2026-11-30" })).toEqual({
      dateFin:
        "La date de fin doit être égale ou postérieure à la date de début.",
    });
  });

  it("refuse un début passé", () => {
    expect(erreurs({ ...valide, dateDebut: "2026-11-17" })).toEqual({
      dateDebut: "La date de début ne peut pas être passée.",
    });
  });

  it("refuse une fin passée", () => {
    expect(
      erreurs({ ...valide, dateDebut: "2026-11-01", dateFin: "2026-11-17" }),
    ).toEqual({
      dateDebut: "La date de début ne peut pas être passée.",
      dateFin: "La date de fin ne peut pas être passée.",
    });
  });

  it("fige le début d'une période en cours et accepte de la finir aujourd'hui", () => {
    expect(
      erreurs(
        { ...valide, dateDebut: "2026-11-03", dateFin: AUJOURDHUI },
        "2026-11-03",
      ),
    ).toEqual({});
    expect(
      erreurs(
        { ...valide, dateDebut: "2026-11-04", dateFin: AUJOURDHUI },
        "2026-11-03",
      ),
    ).toEqual({
      dateDebut: "La date de début d'une période en cours ne se modifie plus.",
    });
  });
});

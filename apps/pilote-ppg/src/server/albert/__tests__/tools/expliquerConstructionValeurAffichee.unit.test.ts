import { expliquerConstructionValeurAffichee } from "@/server/albert/tools/expliquerConstructionValeurAffichee";

const DECUMUL_ANNUEL =
  "Les valeurs importées sont cumulées depuis janvier : PILOTE retire de chaque valeur importée la valeur importée précédente de la même année, la première valeur de l'année étant conservée telle quelle.";
const DECUMUL_DEPUIS_LA_PREMIERE_VALEUR =
  "Les valeurs importées sont cumulées depuis la première valeur : PILOTE retire de chaque valeur importée la valeur importée précédente, la première valeur importée étant conservée telle quelle.";
const DECUMUL_SANS_CUMUL =
  "La valeur affichée dans PILOTE est la valeur ainsi décumulée.";
const cumulAnnuel = (typeValeurs: string) =>
  `La valeur affichée dans PILOTE est la somme des valeurs ${typeValeurs} depuis janvier de l'année, jusqu'à la date de la valeur.`;
const cumulDepuisLeDebut = (typeValeurs: string) =>
  `La valeur affichée dans PILOTE est la somme de toutes les valeurs ${typeValeurs} jusqu'à la date de la valeur.`;
const cumulDouzeMoisGlissants = (typeValeurs: string) =>
  `La valeur affichée dans PILOTE est la somme des valeurs ${typeValeurs} des 12 derniers mois, mois de la valeur compris.`;

describe("expliquerConstructionValeurAffichee", () => {
  it("retourne null quand l'indicateur n'a pas de paramétrage", () => {
    // When
    const result = expliquerConstructionValeurAffichee(null);

    // Then
    expect(result).toBeNull();
  });

  it.each`
    decumul              | cumul
    ${"_"}               | ${"_"}
    ${"from_year_start"} | ${"from_year_start"}
    ${"from_beginning"}  | ${"from_beginning"}
  `(
    "retourne null quand la valeur affichée est la valeur importée (décumul $decumul, cumul $cumul)",
    ({ decumul, cumul }) => {
      // When
      const result = expliquerConstructionValeurAffichee({ decumul, cumul });

      // Then
      expect(result).toBeNull();
    },
  );

  it.each`
    decumul              | cumul                        | explication
    ${"_"}               | ${"from_year_start"}         | ${cumulAnnuel("importées")}
    ${"_"}               | ${"from_beginning"}          | ${cumulDepuisLeDebut("importées")}
    ${"_"}               | ${"from_previous_month::12"} | ${cumulDouzeMoisGlissants("importées")}
    ${"from_year_start"} | ${"_"}                       | ${`${DECUMUL_ANNUEL} ${DECUMUL_SANS_CUMUL}`}
    ${"from_year_start"} | ${"from_beginning"}          | ${`${DECUMUL_ANNUEL} ${cumulDepuisLeDebut("décumulées")}`}
    ${"from_year_start"} | ${"from_previous_month::12"} | ${`${DECUMUL_ANNUEL} ${cumulDouzeMoisGlissants("décumulées")}`}
    ${"from_beginning"}  | ${"_"}                       | ${`${DECUMUL_DEPUIS_LA_PREMIERE_VALEUR} ${DECUMUL_SANS_CUMUL}`}
    ${"from_beginning"}  | ${"from_year_start"}         | ${`${DECUMUL_DEPUIS_LA_PREMIERE_VALEUR} ${cumulAnnuel("décumulées")}`}
    ${"from_beginning"}  | ${"from_previous_month::12"} | ${`${DECUMUL_DEPUIS_LA_PREMIERE_VALEUR} ${cumulDouzeMoisGlissants("décumulées")}`}
  `(
    "décrit le calcul quand la valeur affichée diffère de la valeur importée (décumul $decumul, cumul $cumul)",
    ({ decumul, cumul, explication }) => {
      // When
      const result = expliquerConstructionValeurAffichee({ decumul, cumul });

      // Then
      expect(result).toEqual(explication);
    },
  );

  it.each`
    decumul              | cumul
    ${"from_month"}      | ${"from_year_start"}
    ${"_"}               | ${"from_semester"}
    ${"from_year_start"} | ${"from_semester"}
  `(
    "prévient que la valeur affichée peut différer quand le paramétrage n'est pas reconnu (décumul $decumul, cumul $cumul)",
    ({ decumul, cumul }) => {
      // When
      const result = expliquerConstructionValeurAffichee({ decumul, cumul });

      // Then
      expect(result).toEqual(
        "La valeur affichée dans PILOTE est calculée à partir des valeurs importées selon le paramétrage de l'indicateur : elle peut en différer.",
      );
    },
  );
});

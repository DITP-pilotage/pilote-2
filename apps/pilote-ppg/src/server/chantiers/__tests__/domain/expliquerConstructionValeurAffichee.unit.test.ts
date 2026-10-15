import { expliquerConstructionValeurAffichee } from "@/server/chantiers/domain/expliquerConstructionValeurAffichee";

const DECUMUL_ANNUEL =
  "Les valeurs importées sont cumulées depuis janvier : PILOTE retire de chaque valeur importée la valeur importée précédente de la même année, la première valeur de l'année étant conservée telle quelle.";
const DECUMUL_DEPUIS_LE_DEBUT =
  "Les valeurs importées sont cumulées depuis le début : PILOTE retire de chaque valeur importée la valeur importée précédente, la première valeur étant conservée telle quelle.";
const SANS_CUMUL =
  "La valeur affichée dans PILOTE est la valeur ainsi décumulée.";
const cumulAnnuel = (valeurs: string) =>
  `La valeur affichée dans PILOTE est la somme des valeurs ${valeurs} depuis janvier de l'année, jusqu'à la date de la valeur.`;
const cumulDepuisLeDebut = (valeurs: string) =>
  `La valeur affichée dans PILOTE est la somme de toutes les valeurs ${valeurs} jusqu'à la date de la valeur.`;
const cumulDouzeMoisGlissants = (valeurs: string) =>
  `La valeur affichée dans PILOTE est la somme des valeurs ${valeurs} des 12 derniers mois, mois de la valeur compris.`;

describe("expliquerConstructionValeurAffichee", () => {
  it("retourne null quand l'indicateur n'a pas de paramétrage", () => {
    // When
    const result = expliquerConstructionValeurAffichee(null);

    // Then
    expect(result).toBeNull();
  });

  it.each`
    decumulFrom          | partitionDate        | operation
    ${"_"}               | ${"_"}               | ${"current_value"}
    ${"from_year_start"} | ${"from_year_start"} | ${"sum"}
    ${"from_beginning"}  | ${"from_beginning"}  | ${"sum"}
    ${"_"}               | ${"from_year_start"} | ${"current_value"}
    ${"_"}               | ${"_"}               | ${"sum"}
  `(
    "retourne null quand la valeur affichée est la valeur importée (décumul $decumulFrom, cumul $partitionDate, opération $operation)",
    ({ decumulFrom, partitionDate, operation }) => {
      // When
      const result = expliquerConstructionValeurAffichee({
        decumulFrom,
        partitionDate,
        operation,
      });

      // Then
      expect(result).toBeNull();
    },
  );

  it.each`
    decumulFrom          | partitionDate                | operation          | explication
    ${"_"}               | ${"from_year_start"}         | ${"sum"}           | ${cumulAnnuel("importées")}
    ${"_"}               | ${"from_beginning"}          | ${"sum"}           | ${cumulDepuisLeDebut("importées")}
    ${"_"}               | ${"from_previous_month::12"} | ${"sum"}           | ${cumulDouzeMoisGlissants("importées")}
    ${"from_year_start"} | ${"_"}                       | ${"current_value"} | ${`${DECUMUL_ANNUEL} ${SANS_CUMUL}`}
    ${"from_year_start"} | ${"from_year_start"}         | ${"current_value"} | ${`${DECUMUL_ANNUEL} ${SANS_CUMUL}`}
    ${"from_year_start"} | ${"from_beginning"}          | ${"sum"}           | ${`${DECUMUL_ANNUEL} ${cumulDepuisLeDebut("décumulées")}`}
    ${"from_year_start"} | ${"from_previous_month::12"} | ${"sum"}           | ${`${DECUMUL_ANNUEL} ${cumulDouzeMoisGlissants("décumulées")}`}
    ${"from_beginning"}  | ${"_"}                       | ${"current_value"} | ${`${DECUMUL_DEPUIS_LE_DEBUT} ${SANS_CUMUL}`}
    ${"from_beginning"}  | ${"from_year_start"}         | ${"sum"}           | ${`${DECUMUL_DEPUIS_LE_DEBUT} ${cumulAnnuel("décumulées")}`}
    ${"from_beginning"}  | ${"from_previous_month::12"} | ${"sum"}           | ${`${DECUMUL_DEPUIS_LE_DEBUT} ${cumulDouzeMoisGlissants("décumulées")}`}
  `(
    "décrit le calcul quand la valeur affichée diffère de la valeur importée (décumul $decumulFrom, cumul $partitionDate, opération $operation)",
    ({ decumulFrom, partitionDate, operation, explication }) => {
      // When
      const result = expliquerConstructionValeurAffichee({
        decumulFrom,
        partitionDate,
        operation,
      });

      // Then
      expect(result).toEqual(explication);
    },
  );

  it.each`
    decumulFrom          | partitionDate        | operation
    ${"from_month"}      | ${"from_year_start"} | ${"sum"}
    ${"_"}               | ${"from_semester"}   | ${"sum"}
    ${"from_year_start"} | ${"from_semester"}   | ${"sum"}
  `(
    "prévient que la valeur affichée peut différer quand le paramétrage n'est pas reconnu (décumul $decumulFrom, cumul $partitionDate, opération $operation)",
    ({ decumulFrom, partitionDate, operation }) => {
      // When
      const result = expliquerConstructionValeurAffichee({
        decumulFrom,
        partitionDate,
        operation,
      });

      // Then
      expect(result).toEqual(
        "La valeur affichée dans PILOTE est calculée à partir des valeurs importées selon le paramétrage de l'indicateur : elle peut en différer.",
      );
    },
  );
});

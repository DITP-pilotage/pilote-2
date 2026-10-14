import { expliquerConstructionValeurAffichee } from "@/server/chantiers/domain/expliquerConstructionValeurAffichee";

const IMPORT_MENSUEL = "Les valeurs sont importées mois par mois.";
const IMPORT_CUMUL_ANNUEL =
  "Les valeurs sont importées déjà cumulées depuis janvier de l'année.";
const IMPORT_CUMUL_DEPUIS_LE_DEBUT =
  "Les valeurs sont importées déjà cumulées depuis le début.";
const DECUMUL =
  "les valeurs mensuelles étant obtenues en retirant de chaque valeur importée celle du mois précédent";

describe("expliquerConstructionValeurAffichee", () => {
  it("retourne null quand l'indicateur n'a pas de paramétrage", () => {
    // When
    const result = expliquerConstructionValeurAffichee(null);

    // Then
    expect(result).toBeNull();
  });

  it.each`
    decumulFrom                       | partitionDate                     | operation
    ${"_"}                            | ${"_"}                            | ${"current_value"}
    ${"_"}                            | ${"from_year_start"}              | ${"current_value"}
    ${"_"}                            | ${"_"}                            | ${"sum"}
    ${"_"}                            | ${"_"}                            | ${"_"}
    ${"from_year_start"}              | ${"from_year_start"}              | ${"sum"}
    ${"from_custom_date::2019-01-01"} | ${"from_custom_date::2019-01-01"} | ${"sum"}
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
    decumulFrom                       | partitionDate                     | operation          | explication
    ${"_"}                            | ${"from_year_start"}              | ${"sum"}           | ${`${IMPORT_MENSUEL} La valeur affichée dans PILOTE est la somme des valeurs mensuelles depuis janvier de l'année.`}
    ${"_"}                            | ${"from_custom_date::2019-01-01"} | ${"sum"}           | ${`${IMPORT_MENSUEL} La valeur affichée dans PILOTE est la somme des valeurs mensuelles depuis le début.`}
    ${"_"}                            | ${"from_previous_month::12"}      | ${"sum"}           | ${`${IMPORT_MENSUEL} La valeur affichée dans PILOTE est la somme des valeurs mensuelles sur les 12 derniers mois glissants.`}
    ${"_"}                            | ${"from_year_start"}              | ${"avg"}           | ${`${IMPORT_MENSUEL} La valeur affichée dans PILOTE est la moyenne des valeurs mensuelles depuis janvier de l'année.`}
    ${"_"}                            | ${"from_year_start"}              | ${"moy"}           | ${`${IMPORT_MENSUEL} La valeur affichée dans PILOTE est la moyenne des valeurs mensuelles depuis janvier de l'année.`}
    ${"from_custom_date::2019-01-01"} | ${"from_year_start"}              | ${"sum"}           | ${`${IMPORT_CUMUL_DEPUIS_LE_DEBUT} La valeur affichée dans PILOTE est la somme des valeurs mensuelles depuis janvier de l'année, ${DECUMUL}.`}
    ${"from_year_start"}              | ${"from_year_start"}              | ${"avg"}           | ${`${IMPORT_CUMUL_ANNUEL} La valeur affichée dans PILOTE est la moyenne des valeurs mensuelles depuis janvier de l'année, ${DECUMUL}.`}
    ${"from_year_start"}              | ${"_"}                            | ${"sum"}           | ${`${IMPORT_CUMUL_ANNUEL} La valeur affichée dans PILOTE est la valeur du seul mois, obtenue en retirant de la valeur importée celle du mois précédent.`}
    ${"from_custom_date::2019-01-01"} | ${"from_custom_date::2019-01-01"} | ${"current_value"} | ${`${IMPORT_CUMUL_DEPUIS_LE_DEBUT} La valeur affichée dans PILOTE est la valeur du seul mois, obtenue en retirant de la valeur importée celle du mois précédent.`}
  `(
    "explique la construction quand la valeur affichée diffère de la valeur importée (décumul $decumulFrom, cumul $partitionDate, opération $operation)",
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
    ${"_"}               | ${"from_year_start"} | ${"max"}
    ${null}              | ${"from_year_start"} | ${"sum"}
    ${"from_year_start"} | ${"from_year_start"} | ${null}
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

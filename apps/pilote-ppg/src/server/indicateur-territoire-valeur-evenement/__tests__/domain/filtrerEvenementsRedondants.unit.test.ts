import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { filtrerEvenementsRedondants } from "@/server/indicateur-territoire-valeur-evenement/domain/filtrerEvenementsRedondants";
import { TypeEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/TypeEvenement";
import { EvenementValeurEnum } from "@/server/app/domain/EvenementValeurEnum";

const creerEvenement = (
  typeEvenement: TypeEvenement,
  ordre: number,
): IndicateurTerritoireValeurEvenement =>
  IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
    {
      indicId: "INDIC_001",
      territoireCode: "FR",
      typeEvenement,
      typeValeur: "VALEUR_AVANCEMENT",
      dateValeur: new Date("2024-01-01"),
      valeur: 10,
      donneesComplementaires: undefined,
      idAuteurModification: "user1",
      correlationId: "corr1",
      ordre,
      dateCreation: new Date("2024-01-01"),
    },
  );

describe("filtrerEvenementsRedondants", () => {
  it.each([
    EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE,
    EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION,
    EvenementValeurEnum.PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE,
  ])(
    "retire un VALEUR_MODIFIEE immédiatement suivi (ordre décroissant) par %s",
    (typeTerminal) => {
      const evenementValeurModifiee = creerEvenement("VALEUR_MODIFIEE", 2);
      const evenementTerminal = creerEvenement(typeTerminal, 1);

      const result = filtrerEvenementsRedondants([
        evenementValeurModifiee,
        evenementTerminal,
      ]);

      expect(result).toEqual([evenementTerminal]);
    },
  );

  it("garde un VALEUR_MODIFIEE quand il n'est pas suivi d'un événement terminal", () => {
    const evenementCreee = creerEvenement("VALEUR_CREEE", 2);
    const evenementValeurModifiee = creerEvenement("VALEUR_MODIFIEE", 1);

    const result = filtrerEvenementsRedondants([
      evenementCreee,
      evenementValeurModifiee,
    ]);

    expect(result).toEqual([evenementCreee, evenementValeurModifiee]);
  });

  it("retire un VALEUR_HISTORISEE immédiatement suivi par PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE", () => {
    const evenementHistorisee = creerEvenement("VALEUR_HISTORISEE", 2);
    const evenementIgnoree = creerEvenement(
      "PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE",
      1,
    );

    const result = filtrerEvenementsRedondants([
      evenementHistorisee,
      evenementIgnoree,
    ]);

    expect(result).toEqual([evenementIgnoree]);
  });

  it("garde un VALEUR_HISTORISEE quand il n'est suivi d'aucun événement", () => {
    const evenementHistorisee = creerEvenement("VALEUR_HISTORISEE", 1);

    const result = filtrerEvenementsRedondants([evenementHistorisee]);

    expect(result).toEqual([evenementHistorisee]);
  });

  it("garde tout autre type d'événement tel quel", () => {
    const evenementPropositionCreee = creerEvenement(
      "PROPOSITION_VALEUR_CREEE",
      1,
    );

    const result = filtrerEvenementsRedondants([evenementPropositionCreee]);

    expect(result).toEqual([evenementPropositionCreee]);
  });
});

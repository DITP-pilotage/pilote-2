import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { EvenementValeurEnum } from "@/server/app/domain/EvenementValeurEnum";
import { toISODate } from "@/server/app/domain/Dates";

export function filtrerEvenementsRedondants(
  evenementsTriesParOrdreDecroissant: IndicateurTerritoireValeurEvenement[],
): IndicateurTerritoireValeurEvenement[] {
  return evenementsTriesParOrdreDecroissant.filter((evenement, index) => {
    const evenementSuivant =
      evenementsTriesParOrdreDecroissant[index + 1]?.typeEvenement;

    if (evenement.typeEvenement === EvenementValeurEnum.VALEUR_MODIFIEE) {
      return ![
        EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE,
        EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION,
        EvenementValeurEnum.PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE,
      ].some((typeTerminal) => typeTerminal === evenementSuivant);
    }

    if (evenement.typeEvenement === EvenementValeurEnum.VALEUR_HISTORISEE) {
      return (
        evenementSuivant !==
        EvenementValeurEnum.PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE
      );
    }

    return true;
  });
}

/**
 * Regroupe les événements par date de valeur et retire les événements
 * redondants au sein de chaque groupe. Chaque groupe est retourné trié par
 * ordre décroissant (forme canonique attendue par filtrerEvenementsRedondants) —
 * l'ordre des groupes entre eux et l'ordre final des événements dans chaque
 * groupe restent à la charge de l'appelant.
 */
export function regrouperEvenementsParDate(
  evenements: IndicateurTerritoireValeurEvenement[],
): Map<string, IndicateurTerritoireValeurEvenement[]> {
  const evenementsParDate = new Map<
    string,
    IndicateurTerritoireValeurEvenement[]
  >();

  evenements.forEach((evenement) => {
    const dateKey = toISODate(evenement.dateValeur);
    const groupe = evenementsParDate.get(dateKey) ?? [];
    groupe.push(evenement);
    evenementsParDate.set(dateKey, groupe);
  });

  const resultat = new Map<string, IndicateurTerritoireValeurEvenement[]>();
  evenementsParDate.forEach((evenementsDuJour, dateKey) => {
    const evenementsDuJourTriesDesc = [...evenementsDuJour].sort(
      (a, b) => b.ordre - a.ordre,
    );
    resultat.set(
      dateKey,
      filtrerEvenementsRedondants(evenementsDuJourTriesDesc),
    );
  });

  return resultat;
}

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

export type GroupeEvenementsParDate = {
  dateValeur: string;
  evenements: IndicateurTerritoireValeurEvenement[];
};

/**
 * Regroupe les événements par date de valeur et retire les événements
 * redondants au sein de chaque groupe. Le résultat est trié du plus ancien
 * au plus récent, à la fois entre les groupes et au sein de chaque groupe
 * (ordre croissant) : un appelant qui veut l'ordre inverse peut simplement
 * faire .reverse() (et .reverse() sur chaque groupe.evenements) plutôt que
 * de retrier.
 */
export function regrouperEvenementsParDate(
  evenements: IndicateurTerritoireValeurEvenement[],
): GroupeEvenementsParDate[] {
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

  return Array.from(evenementsParDate.entries())
    .sort(([dateA], [dateB]) => (dateA < dateB ? -1 : 1))
    .map(([dateValeur, evenementsDuJour]) => {
      const evenementsDuJourTriesDesc = [...evenementsDuJour].sort(
        (a, b) => b.ordre - a.ordre,
      );

      return {
        dateValeur,
        evenements: filtrerEvenementsRedondants(
          evenementsDuJourTriesDesc,
        ).reverse(),
      };
    });
}

import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { EvenementValeurEnum } from "@/server/app/domain/EvenementValeurEnum";

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

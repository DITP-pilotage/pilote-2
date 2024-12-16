// Impossible d'utiliser convict ici

const DATE_BASCULE_TAUX_ANNUEL_ANNEE_COURANTE_DEFAULT : string = '2000-12-25';

/**
 * Indique la date de bascule d'affichage du TA de l'année précédente
 * @returns {{Date, boolean}} Date de la bascule pour année en cours, et booleen si la date est dépassée pour cette année
 */
function getDateBasculeAnneeCourante(): {
  dateBascule: Date, dateBasculeDepassee: boolean
} {

  const maintenant: Date = new Date();
  const dateBasculeTauxAnnuelAnneeCouranteString: string = process.env.DATE_BASCULE_TAUX_ANNUEL_ANNEE_COURANTE || DATE_BASCULE_TAUX_ANNUEL_ANNEE_COURANTE_DEFAULT;
  const dateBasculeTauxAnnuelAnneeCouranteDate: Date = new Date(dateBasculeTauxAnnuelAnneeCouranteString);
  const dateBasculeTauxAnnuelAnneeCouranteDateAnneeCourante: Date = new Date(dateBasculeTauxAnnuelAnneeCouranteDate.setFullYear(maintenant.getFullYear()));

  return {
    dateBascule: dateBasculeTauxAnnuelAnneeCouranteDateAnneeCourante,
    dateBasculeDepassee: dateBasculeTauxAnnuelAnneeCouranteDateAnneeCourante < maintenant,
  };

}

export default getDateBasculeAnneeCourante;

export const getDateBasculeAffichageValeursAnneePrecedente = (dateBascule: string): {
  dateBascule: Date, dateBasculeDepassee: boolean
} => {
  const maintenant: Date = new Date();

  const dateBasculeTauxAnnuelAnneeCouranteDate: Date = new Date(dateBascule as string);

  dateBasculeTauxAnnuelAnneeCouranteDate.setFullYear(maintenant.getFullYear());

  return {
    dateBascule: dateBasculeTauxAnnuelAnneeCouranteDate,
    dateBasculeDepassee: dateBasculeTauxAnnuelAnneeCouranteDate < maintenant,
  };
};

export const getAnneeAffichageDateDeBascule = (date: Date, dateBascule: string): number => {
  const maintenant: Date = new Date();

  const dateBasculeTauxAnnuelAnneeCouranteDate: Date = new Date(dateBascule);

  dateBasculeTauxAnnuelAnneeCouranteDate.setFullYear(maintenant.getFullYear());

  return date < dateBasculeTauxAnnuelAnneeCouranteDate ? dateBasculeTauxAnnuelAnneeCouranteDate.getFullYear() - 1 : dateBasculeTauxAnnuelAnneeCouranteDate.getFullYear();
};

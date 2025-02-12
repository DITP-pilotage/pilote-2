export const getAnneeDateDeBascule = (date: Date, dateBascule: string): number => {
  const maintenant: Date = new Date();

  const dateBasculeTauxAnnuelAnneeCouranteDate: Date = new Date(dateBascule);

  dateBasculeTauxAnnuelAnneeCouranteDate.setFullYear(maintenant.getFullYear());

  return date < dateBasculeTauxAnnuelAnneeCouranteDate ? dateBasculeTauxAnnuelAnneeCouranteDate.getFullYear() - 1 : dateBasculeTauxAnnuelAnneeCouranteDate.getFullYear();
};


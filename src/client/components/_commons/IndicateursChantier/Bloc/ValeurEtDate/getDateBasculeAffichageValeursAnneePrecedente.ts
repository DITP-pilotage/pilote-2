import api from '@/server/infrastructure/api/trpc/api';

export const getDateBasculeAffichageValeursAnneePrecedente = (): {
  dateBascule: Date, dateBasculeDepassee: boolean
} => {
  const maintenant: Date = new Date();
  const { data: dateBasculeTauxAnnuelAnneeCouranteString } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_DATE_BASCULE_AFFICHAGE_VALEURS_ANNEE_PRECEDENTE' });
  
  const dateBasculeTauxAnnuelAnneeCouranteDate: Date = new Date(dateBasculeTauxAnnuelAnneeCouranteString as string);

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

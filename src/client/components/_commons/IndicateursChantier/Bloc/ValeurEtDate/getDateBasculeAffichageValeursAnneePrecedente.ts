import api from '@/server/infrastructure/api/trpc/api';

export const getDateBasculeAffichageValeursAnneePrecedente = (): {
  dateBascule: Date, dateBasculeDepassee: boolean
} => {

  const maintenant: Date = new Date();
  const { data: dateBasculeTauxAnnuelAnneeCouranteString } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_DATE_BASCULE_AFFICHAGE_VALEURS_ANNEE_PRECEDENTE' });
  
  const dateBasculeTauxAnnuelAnneeCouranteDate: Date = new Date(dateBasculeTauxAnnuelAnneeCouranteString as string);
  const dateBasculeTauxAnnuelAnneeCouranteDateAnneeCourante: Date = new Date(dateBasculeTauxAnnuelAnneeCouranteDate.setFullYear(maintenant.getFullYear()));

  return {
    dateBascule: dateBasculeTauxAnnuelAnneeCouranteDateAnneeCourante,
    dateBasculeDepassee: dateBasculeTauxAnnuelAnneeCouranteDateAnneeCourante < maintenant,
  };

};

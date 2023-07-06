import {
  createColumnHelper,
  getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel, Row,
  useReactTable,
} from '@tanstack/react-table';
import { ChangeEvent, useCallback, useState } from 'react';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import rechercheUnTexteContenuDansUnContenant from '@/client/utils/rechercheUnTexteContenuDansUnContenant';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import { formaterDate } from '@/client/utils/date/date';
import { filtresUtilisateursActifs as filtresUtilisateursActifsStore } from '@/stores/useFiltresUtilisateursStore/useFiltresUtilisateursStore';
import { FiltresUtilisateursActifs } from '@/stores/useFiltresUtilisateursStore/useFiltresUtilisateursStore.interface';

const reactTableColonnesHelper = createColumnHelper<Utilisateur>();
const colonnes = [
  reactTableColonnesHelper.accessor('email', {
    header: 'Adresse électronique',
    cell: props => props.getValue(),
  }),
  reactTableColonnesHelper.accessor('nom', {
    header: 'Nom',
    cell: props => props.getValue(),
  }),
  reactTableColonnesHelper.accessor('prénom', {
    header: 'Prénom',
    cell: props => props.getValue(),
  }),
  reactTableColonnesHelper.accessor('profil', {
    header: 'Profil',
    cell: props => props.getValue(),
  }),
  reactTableColonnesHelper.accessor('fonction', {
    header: 'Fonction',
    cell: props => props.getValue(),
  }),
  reactTableColonnesHelper.accessor(row =>  `${formaterDate(row.dateModification, 'DD/MM/YYYY')} par ${row.auteurModification}`, {
    header: 'Dernière modification',
    cell: props => props.getValue(),
    sortingFn: (a, b) => {
      const dateA = new Date(a.original.dateModification);
      const dateB = new Date(b.original.dateModification);

      if ( dateA.getTime() > dateB.getTime()) {
        return 1;
      }

      if ( dateA.getTime() < dateB.getTime()) {
        return -1;
      }

      return 0;
    },
  }),
];

function passeLesFiltres(utilisateur: Utilisateur, filtresActifs: FiltresUtilisateursActifs) {
  if (filtresActifs.territoires.length === 0) {
    return true;
  }
  return utilisateur.habilitations.lecture.territoires.some((territoire) => filtresActifs.territoires.includes(territoire));
}

export default function useTableauPageAdminUtilisateurs(utilisateurs :Utilisateur[]) {
  const [valeurDeLaRecherche, setValeurDeLaRecherche] = useState('');
  const filtresUtilisateursActifs = filtresUtilisateursActifsStore();

  const changementDeLaRechercheCallback = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setValeurDeLaRecherche(event.target.value);
  }, [setValeurDeLaRecherche]);

  const tableau = useReactTable({
    data : utilisateurs,
    columns: colonnes,

    globalFilterFn: (ligne, colonneId, globalFilterValue) => {
      const { rechercheTextuelle, filtresActifs } = globalFilterValue;
      return passeLesFiltres(ligne.original, filtresActifs)
       && rechercheUnTexteContenuDansUnContenant(rechercheTextuelle, ligne.getValue<ProjetStructurant>(colonneId).toString());
    },
    state: {
      globalFilter: {
        rechercheTextuelle: valeurDeLaRecherche,
        filtresActifs: filtresUtilisateursActifs,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const changementDePageCallback = useCallback((numéroDePage: number) => (
    tableau.setPageIndex(numéroDePage - 1)
  ), [tableau]);

  return {
    tableau,
    changementDePageCallback,
    valeurDeLaRecherche,
    changementDeLaRechercheCallback,
  };
}

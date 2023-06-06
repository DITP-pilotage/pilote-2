import {
  createColumnHelper,
  getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChangeEvent, useCallback, useState } from 'react';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import rechercheUnTexteContenuDansUnContenant from '@/client/utils/rechercheUnTexteContenuDansUnContenant';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import { formaterDate } from '@/client/utils/date/date';

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
  reactTableColonnesHelper.accessor('dateModification', {
    header: 'Dernière modification',
    cell: props => `${formaterDate(props.row.original.dateModification, 'jj/mm/aaaa')} par ${props.row.original.auteurModification}`,
  }),
];

export default function useTableauPageAdminUtilisateurs(utilisateurs :Utilisateur[]) {
  const [valeurDeLaRecherche, setValeurDeLaRecherche] = useState('');

  const changementDeLaRechercheCallback = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setValeurDeLaRecherche(event.target.value);
  }, [setValeurDeLaRecherche]);

  const tableau = useReactTable({
    data : utilisateurs,
    columns: colonnes,
    globalFilterFn: (ligne, colonneId, filtreValeur) => {
      return rechercheUnTexteContenuDansUnContenant(filtreValeur, ligne.getValue<ProjetStructurant>(colonneId).toString());
    },
    state: {
      globalFilter: valeurDeLaRecherche,
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
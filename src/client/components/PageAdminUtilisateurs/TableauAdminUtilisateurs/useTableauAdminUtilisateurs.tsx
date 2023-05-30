import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useCallback } from 'react';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';

const reactTableColonnesHelper = createColumnHelper<Utilisateur>();
const colonnes = [
  reactTableColonnesHelper.accessor('email', {
    header: 'Adresse email',
    cell: props => props.getValue(),
    size: 200,
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
  reactTableColonnesHelper.display({
    header: 'Dernière modification',
    cell: '',

  }),
];

export default function useTableauPageAdminUtilisateurs(utilisateurs :Utilisateur[]) {

  const tableau = useReactTable({
    data : utilisateurs,
    columns: colonnes,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const changementDePageCallback = useCallback((numéroDePage: number) => (
    tableau.setPageIndex(numéroDePage - 1)
  ), [tableau]);

  return {
    tableau,
    changementDePageCallback,
  };
}

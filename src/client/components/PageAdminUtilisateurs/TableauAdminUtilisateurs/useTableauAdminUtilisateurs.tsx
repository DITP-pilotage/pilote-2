import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChangeEvent, useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import rechercheUnTexteContenuDansUnContenant from '@/client/utils/rechercheUnTexteContenuDansUnContenant';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import { formaterDate } from '@/client/utils/date/date';
import api from '@/server/infrastructure/api/trpc/api';
import { filtresUtilisateursActifsStore } from '@/stores/useFiltresUtilisateursStore/useFiltresUtilisateursStore';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import { UtilisateurContrat } from '@/server/gestion-utilisateur/app/contrats/UtilisateurContrat';

const reactTableColonnesHelper = createColumnHelper<UtilisateurContrat>();
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
  reactTableColonnesHelper.accessor(row => `${formaterDate(row.dateModification, 'DD/MM/YYYY')} par ${row.auteurModification}`, {
    header: 'Dernière modification',
    cell: props => props.getValue(),
    sortingFn: (a, b) => {
      const dateA = new Date(a.original.dateModification);
      const dateB = new Date(b.original.dateModification);

      if (dateA.getTime() > dateB.getTime()) {
        return 1;
      }

      if (dateA.getTime() < dateB.getTime()) {
        return -1;
      }

      return 0;
    },
  }),
  reactTableColonnesHelper.accessor(row => row.listeNomsTerritoires.join(', '), {
    id: 'territoire',
    header: 'Territoire',
    cell: props => props.getValue(),
  }),
];

export default function useTableauPageAdminUtilisateurs() {
  const { data: session } = useSession();
  const filtresActifs = filtresUtilisateursActifsStore();

  const [valeurDeLaRecherche, setValeurDeLaRecherche] = useState('');

  const estAutoriseAVoirLaColonneTerritoire = [ProfilEnum.DITP_ADMIN, ProfilEnum.DITP_PILOTAGE].includes(session!.profil);

  const {
    data: utilisateurs = [],
    isLoading: estEnChargement,
  } = api.utilisateur.récupérerUtilisateursFiltrés.useQuery({
    filtres: filtresActifs,
  });

  const changementDeLaRechercheCallback = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setValeurDeLaRecherche(event.target.value);
  }, [setValeurDeLaRecherche]);

  const tableau = useReactTable({
    data: utilisateurs,
    columns: colonnes,

    globalFilterFn: (ligne, colonneId, texteRecherché) => {
      const valeurCellule = ligne.getValue<ProjetStructurant>(colonneId);
      return valeurCellule !== null && rechercheUnTexteContenuDansUnContenant(texteRecherché, valeurCellule.toString());
    },
    state: {
      globalFilter: valeurDeLaRecherche,
      columnVisibility: {
        territoire: estAutoriseAVoirLaColonneTerritoire,
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
    estEnChargement,
    changementDePageCallback,
    valeurDeLaRecherche,
    changementDeLaRechercheCallback,
  };
}

import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChangeEvent, useCallback, useState } from 'react';
import rechercheUnTexteContenuDansUnContenant from '@/client/utils/rechercheUnTexteContenuDansUnContenant';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import api from '@/server/infrastructure/api/trpc/api';
import {
  filtresModifierIndicateursActifsStore,
} from '@/stores/useFiltresModifierIndicateursStore/useFiltresModifierIndicateursStore';
import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';

const reactTableColonnesHelper = createColumnHelper<MetadataParametrageIndicateurContrat>();
const colonnes = [
  reactTableColonnesHelper.accessor('indicParentCh', {
    header: 'Chantier associé',
    cell: props => props.getValue(),
  }),
  reactTableColonnesHelper.accessor('chantierNom', {
    header: 'Nom du chantier',
    cell: props => props.getValue(),
  }),
  reactTableColonnesHelper.accessor('indicId', {
    header: 'Identifiant indicateur',
    sortingFn: 'alphanumericCaseSensitive',
    cell: props => props.getValue(),
  }),
  reactTableColonnesHelper.accessor('indicNom', {
    header: 'Nom de l\'indicateur',
    sortingFn: 'auto',
    cell: props => props.getValue(),
  }),
  reactTableColonnesHelper.accessor('indicHiddenPilote', {
    header: 'Actif / Inactif',
    sortingFn: 'auto',
    cell: props => props.getValue() ? (
      <div className='flex justify-center'>
        <span
          aria-hidden='true'
          className='fr-icon-close-circle-fill fr-icon-red'
        />
      </div>
    ) : (
      <div className='flex justify-center'>
        <span
          aria-hidden='true'
          className='fr-icon-checkbox-circle-fill fr-icon-green'
        />
      </div>
    ),
  }),
];

export default function useTableauPageAdminIndicateurs() {
  const filtresActifs = filtresModifierIndicateursActifsStore();
  
  const [valeurDeLaRecherche, setValeurDeLaRecherche] = useState('');

  const { data: metadataIndicateurs = [], isLoading: estEnChargement } = api.metadataIndicateur.récupérerMetadataIndicateurFiltrés.useQuery({
    filtres: filtresActifs,
  });


  const changementDeLaRechercheCallback = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setValeurDeLaRecherche(event.target.value);
  }, [setValeurDeLaRecherche]);

  const tableau = useReactTable({
    data : metadataIndicateurs,
    columns: colonnes,

    globalFilterFn: (ligne, colonneId, texteRecherché) => {
      const valeurCellule = ligne.getValue<ProjetStructurant>(colonneId);
      return valeurCellule !== null && rechercheUnTexteContenuDansUnContenant(texteRecherché, valeurCellule.toString());
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
    estEnChargement,
    changementDePageCallback,
    valeurDeLaRecherche,
    changementDeLaRechercheCallback,
  };
}

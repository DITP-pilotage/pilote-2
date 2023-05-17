import { createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { ChangeEvent, useCallback, useState } from 'react';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import { comparerMétéo } from '@/client/utils/chantier/météo/météo';
import TableauRéformesMétéo from '@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo';
import { comparerAvancementRéforme } from '@/client/utils/chantier/avancement/avancement';
import TableauRéformesAvancement from '@/client/components/PageAccueil/TableauRéformes/Avancement/TableauRéformesAvancement';
import rechercheUnTexteContenuDansUnContenant from '@/client/utils/rechercheUnTexteContenuDansUnContenant';
import useTableauRéformes from '@/client/components/PageAccueil/TableauRéformes/useTableauRéformes';
import { DirectionDeTri } from '@/components/_commons/Tableau/EnTête/BoutonsDeTri/BoutonsDeTri.interface';

const reactTableColonnesHelper = createColumnHelper<ProjetStructurant>();

const colonnesTableauProjetsStructurants = [
  reactTableColonnesHelper.accessor('nom', {
    header: 'Projets',
    id: 'nom',
    enableSorting: false,
    meta: {
      width: 'auto',
    },
  }),
  reactTableColonnesHelper.accessor('territoireNomÀAfficher', {
    header: 'Territoire',
    id: 'territoire',
    enableSorting: false,
  }),
  reactTableColonnesHelper.accessor('météo', {
    header: 'Météo',
    id: 'météo',
    cell: météo => <TableauRéformesMétéo météo={météo.getValue()} />,
    enableGlobalFilter: false,
    sortingFn: (a, b, columnId) => comparerMétéo(a.getValue(columnId), b.getValue(columnId)),
    meta: {
      width: '10rem',
    },
  }),
  reactTableColonnesHelper.accessor('avancement', {
    header: 'Avancement',
    id: 'avancement',
    cell: avancement => <TableauRéformesAvancement avancement={avancement.getValue()} />,
    enableGlobalFilter: false,
    sortingFn: (a, b, columnId) => comparerAvancementRéforme(a.getValue(columnId), b.getValue(columnId)),
    meta: {
      width: '11rem',
    },
  }),
];

export default function useTableauProjetsStructurants(projetsStructurants: ProjetStructurant[]) {
  const [valeurDeLaRecherche, setValeurDeLaRecherche] = useState('');
  const [tri, setTri] = useState<SortingState>([]);
  const [sélectionColonneÀTrier, setSélectionColonneÀTrier] = useState<string>('avancement');

  const tableau = useReactTable({
    data: projetsStructurants,
    columns: colonnesTableauProjetsStructurants,
    globalFilterFn: (ligne, colonneId, filtreValeur) => {
      return rechercheUnTexteContenuDansUnContenant(filtreValeur, ligne.getValue<ProjetStructurant>(colonneId).toString());
    },
    state: {
      globalFilter: valeurDeLaRecherche,
      sorting: tri,
    },
    onSortingChange: setTri,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const changementDeLaRechercheCallback = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setValeurDeLaRecherche(event.target.value);
  }, [setValeurDeLaRecherche]);

  const {
    transformerEnDirectionDeTri,
    transformerEnSortingState,
    changementDePageCallback, 
  } = useTableauRéformes(tableau);

  return {
    tableau,
    changementDeLaRechercheCallback,
    changementDePageCallback,
    valeurDeLaRecherche,
    sélectionColonneÀTrier,
    changementSélectionColonneÀTrierCallback: setSélectionColonneÀTrier,
    directionDeTri: transformerEnDirectionDeTri(tri),
    changementDirectionDeTriCallback: (directionDeTri: DirectionDeTri) => setTri(transformerEnSortingState(sélectionColonneÀTrier, directionDeTri)),
  };
}

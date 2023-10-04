import { createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { ChangeEvent, useCallback, useState } from 'react';
import ProjetStructurant, {
  ProjetStructurantVueDEnsemble,
} from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import { comparerMétéo } from '@/client/utils/chantier/météo/météo';
import TableauRéformesMétéo from '@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo';
import { comparerAvancementRéforme } from '@/client/utils/chantier/avancement/avancement';
import TableauRéformesAvancement from '@/client/components/PageAccueil/TableauRéformes/Avancement/TableauRéformesAvancement';
import rechercheUnTexteContenuDansUnContenant from '@/client/utils/rechercheUnTexteContenuDansUnContenant';
import useTableauRéformes from '@/client/components/PageAccueil/TableauRéformes/useTableauRéformes';
import { DirectionDeTri } from '@/components/_commons/Tableau/EnTête/BoutonsDeTri/BoutonsDeTri.interface';
import IcônesMultiplesEtTexte from '@/components/_commons/IcônesMultiplesEtTexte/IcônesMultiplesEtTexte';
import { estLargeurDÉcranActuelleMoinsLargeQue } from '@/stores/useLargeurDÉcranStore/useLargeurDÉcranStore';
import TableauProjetsStructurantsTuileProjetStructurant from './Tuile/TableauProjetsStructurantsTuileProjetStructurant';

const reactTableColonnesHelper = createColumnHelper<ProjetStructurantVueDEnsemble>();

const colonnesTableauProjetsStructurants = [
  reactTableColonnesHelper.accessor('nom', {
    header: 'Projets',
    id: 'nom',
    cell: cellContext => (
      <IcônesMultiplesEtTexte
        icônesId={cellContext.row.original.iconesMinistères ?? []}
      >
        {cellContext.getValue()}
      </IcônesMultiplesEtTexte>
    ),
    enableSorting: false,
    meta: {
      width: 'auto',
    },
  }),
  reactTableColonnesHelper.accessor('territoireNomÀAfficher', {
    header: 'Territoire',
    id: 'territoire',
    enableSorting: false,
    meta: {
      tabIndex: -1,
    },
  }),
  reactTableColonnesHelper.accessor('météo', {
    header: 'Météo',
    id: 'météo',
    cell: météo => <TableauRéformesMétéo météo={météo.getValue()} />,
    enableGlobalFilter: false,
    sortingFn: (a, b, columnId) => comparerMétéo(a.getValue(columnId), b.getValue(columnId)),
    meta: {
      width: '10rem',
      tabIndex: -1,
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
      tabIndex: -1,
    },
  }),
  reactTableColonnesHelper.display({
    id: 'projet-structurant-tuile',
    cell: projetStructuranCellContext => (
      <TableauProjetsStructurantsTuileProjetStructurant
        afficherIcône={projetStructuranCellContext.row.original.iconesMinistères.length > 0}
        projetStructurant={projetStructuranCellContext.row.original}
      />    
    ),
    enableSorting: false,
    enableGrouping: false,
  }),
];

export default function useTableauProjetsStructurants(projetsStructurants: ProjetStructurantVueDEnsemble[]) {
  const [valeurDeLaRecherche, setValeurDeLaRecherche] = useState('');
  const [tri, setTri] = useState<SortingState>([{ id: 'avancement', desc: true }]);
  const [sélectionColonneÀTrier, setSélectionColonneÀTrier] = useState<string>('avancement');
  const estVueTuile = estLargeurDÉcranActuelleMoinsLargeQue('lg');

  const tableau = useReactTable({
    data: projetsStructurants,
    columns: colonnesTableauProjetsStructurants,
    globalFilterFn: (ligne, colonneId, filtreValeur) => {
      return rechercheUnTexteContenuDansUnContenant(filtreValeur, ligne.getValue<ProjetStructurant>(colonneId).toString());
    },
    state: {
      globalFilter: valeurDeLaRecherche,
      sorting: tri,
      columnVisibility: estVueTuile ? ({
        'nom': false,
        'météo': false,
        'territoire': false,
        'avancement': false,
        'projet-structurant-tuile': true,
      }) : ({
        'projet-structurant-tuile': false,
      }),
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
    estVueTuile,
  };
}

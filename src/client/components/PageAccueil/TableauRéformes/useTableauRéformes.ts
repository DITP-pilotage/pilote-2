import { SortingState, Table } from '@tanstack/react-table';
import { useCallback } from 'react';
import { DirectionDeTri } from '@/client/components/_commons/Tableau/EnTête/BoutonsDeTri/BoutonsDeTri.interface';
import { DonnéesTableauChantiers } from '@/components/PageRapportDétaillé/VueDEnsemble/RapportDétailléTableauChantiers/RapportDétailléTableauChantiers.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';

function transformerEnDirectionDeTri(tri: SortingState): DirectionDeTri {
  if (!tri[0]) return false;
  return (tri[0].desc ? 'desc' : 'asc');
}

function transformerEnSortingState(sélectionColonneÀTrier: string, directionDeTri: DirectionDeTri): SortingState {
  return directionDeTri === false ? [] 
    :
    [{
      id: sélectionColonneÀTrier,
      desc: directionDeTri === 'desc',
    }];
}

export default function useTableauRéformes(tableau: Table<DonnéesTableauChantiers> | Table<ProjetStructurant>) {
  const changementDePageCallback = useCallback((numéroDePage: number) => (
    tableau.setPageIndex(numéroDePage - 1)
  ), [tableau]);

  return {
    transformerEnDirectionDeTri,
    transformerEnSortingState,
    changementDePageCallback,
  };
}

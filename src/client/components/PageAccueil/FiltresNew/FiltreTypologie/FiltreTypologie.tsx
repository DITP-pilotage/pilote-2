import { useCallback } from 'react';
import { parseAsBoolean, useQueryState } from 'nuqs';
import Interrupteur from '@/components/_commons/Interrupteur/Interrupteur';
import { FiltreTypologieType } from '@/stores/useFiltresStore/useFiltresStore.interface';


interface FiltreTypologieProps {
  filtre: FiltreTypologieType
  categorie: 'estTerritorialise' | 'estBarometre'
}

export default function FiltreTypologie({ filtre, categorie }: FiltreTypologieProps) {
  const [filtreTypologie, setFiltreTypologie] = useQueryState(categorie, parseAsBoolean.withDefault(false).withOptions({ shallow: false, clearOnDefault: true, history: 'push' }));

  const auChangement = useCallback(() => {
    return setFiltreTypologie(!filtreTypologie);
  }, [filtreTypologie, setFiltreTypologie]);

  return (
    <Interrupteur
      auChangement={auChangement}
      checked={filtreTypologie}
      id={filtre.id}
      libellé={filtre.nom}
    />
  );
}

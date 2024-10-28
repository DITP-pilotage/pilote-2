import { FunctionComponent, useCallback } from 'react';
import { parseAsBoolean, parseAsInteger, useQueryState } from 'nuqs';
import Interrupteur from '@/components/_commons/Interrupteur/Interrupteur';
import { sauvegarderFiltres } from '@/stores/useFiltresStoreNew/useFiltresStoreNew';

interface FiltreTypologieProps {
  filtre: { id: string, attribut: 'estBaromètre' | 'estTerritorialisé', nom: string }
  categorie: 'estTerritorialise' | 'estBarometre'
}

const FiltreTypologie: FunctionComponent<FiltreTypologieProps> = ({ filtre, categorie }) => {
  const [filtreTypologie, setFiltreTypologie] = useQueryState(categorie, parseAsBoolean.withDefault(false).withOptions({
    shallow: false,
    clearOnDefault: true,
    history: 'push',
  }));


  const [, setPagination] = useQueryState('pageIndex', parseAsInteger.withDefault(1).withOptions({
    shallow: false,
  }));

  const auChangement = useCallback(() => {
    sauvegarderFiltres({ [categorie]: !filtreTypologie });
    setPagination(1);
    return setFiltreTypologie(!filtreTypologie);
  }, [categorie, filtreTypologie, setFiltreTypologie]);

  return (
    <Interrupteur
      auChangement={auChangement}
      checked={filtreTypologie}
      id={filtre.id}
      libellé={filtre.nom}
    />
  );
};

export default FiltreTypologie;

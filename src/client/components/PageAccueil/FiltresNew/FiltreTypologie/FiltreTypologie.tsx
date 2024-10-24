import { FunctionComponent, useCallback } from 'react';
import { parseAsBoolean, useQueryState } from 'nuqs';
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

  const auChangement = useCallback(() => {
    sauvegarderFiltres({ [categorie]: !filtreTypologie });
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

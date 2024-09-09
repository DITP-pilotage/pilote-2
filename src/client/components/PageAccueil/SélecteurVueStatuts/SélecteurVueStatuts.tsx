import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { FunctionComponent } from 'react';
import ContrôleSegmenté from '@/components/_commons/ContrôleSegmentéNew/ContrôleSegmenté';
import { sauvegarderFiltres } from '@/stores/useFiltresStoreNew/useFiltresStoreNew';
import useSélecteurVueStatut from './useSélecteurVueStatut.interface';

export const typesVueStatuts = ['BROUILLON_ET_PUBLIE', 'PUBLIE', 'BROUILLON'] as const;
export type TypeVueStatuts = typeof typesVueStatuts[number];

const SélecteurVueStatuts: FunctionComponent<{}> = () => {

  const { options } = useSélecteurVueStatut();

  const [statut, setStatut] = useQueryState('statut', parseAsStringLiteral(['BROUILLON', 'PUBLIE', 'BROUILLON_ET_PUBLIE']).withDefault('PUBLIE').withOptions({
    shallow: false,
    clearOnDefault: true,
    history: 'push',
  }));

  const auChangement = (vueStatuts: TypeVueStatuts) => {
    sauvegarderFiltres({ statut: vueStatuts });

    return setStatut(vueStatuts);
  };

  return (
    <ContrôleSegmenté
      options={options}
      valeurModifiéeCallback={auChangement}
      valeurSélectionnée={statut}
    />
  );
};

export default SélecteurVueStatuts;

import { parseAsStringLiteral, useQueryState } from 'nuqs';
import ContrôleSegmenté from '@/components/_commons/ContrôleSegmentéNew/ContrôleSegmenté';
import { TypeVueStatuts } from '@/stores/useStatutsStore/useStatutStore.interface';
import { sauvegarderFiltres } from '@/stores/useFiltresStoreNew/useFiltresStoreNew';
import useSélecteurVueStatut from './useSélecteurVueStatut.interface';

export default function SélecteurVueStatuts() {

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
}

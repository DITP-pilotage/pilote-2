import { parseAsBoolean, useQueryState } from 'nuqs';
import ContrôleSegmenté from '@/components/_commons/ContrôleSegmentéNew/ContrôleSegmenté';
import { TypeVueStatuts } from '@/stores/useStatutsStore/useStatutStore.interface';
import useSélecteurVueStatut from './useSélecteurVueStatut.interface';

export default function SélecteurVueStatuts() {

  const { options } = useSélecteurVueStatut();

  const [brouillon, setBrouillon] = useQueryState('brouillon', parseAsBoolean.withDefault(true).withOptions({ shallow: false, clearOnDefault: true, history: 'push' }));

  const auChangement = (vueStatuts: TypeVueStatuts) => {
    return setBrouillon(vueStatuts === 'BROUILLON_ET_PUBLIE');
  };

  return (
    <ContrôleSegmenté
      options={options}
      valeurModifiéeCallback={auChangement}
      valeurSélectionnée={brouillon ? 'BROUILLON_ET_PUBLIE' : 'PUBLIE'}
    />
  );
}

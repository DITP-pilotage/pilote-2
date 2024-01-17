import ContrôleSegmenté from '@/components/_commons/ContrôleSegmenté/ContrôleSegmenté';
import { vueStatutsSélectionnéeStore } from '@/client/stores/useStatutsStore/useStatutsStore';
import useSélecteurVueStatut from './useSélecteurVueStatut.interface';

export default function SélecteurVueStatuts() {

  const { options, auChangement } = useSélecteurVueStatut();

  return (
    <ContrôleSegmenté
      options={options}
      valeurModifiéeCallback={auChangement}
      valeurSélectionnée={vueStatutsSélectionnéeStore()}
    />
  );
}

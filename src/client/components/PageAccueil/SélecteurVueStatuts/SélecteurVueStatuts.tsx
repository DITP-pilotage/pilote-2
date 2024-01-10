import { useCallback } from 'react';
import ContrôleSegmenté from '@/components/_commons/ContrôleSegmenté/ContrôleSegmenté';
import { TypeVueStatuts } from '@/client/stores/useStatutsStore/useStatutStore.interface';
import { actionsStatutsStore, vueStatutsSélectionnéeStore } from '@/client/stores/useStatutsStore/useStatutsStore';
import optionChoixVueStatuts from './SélecteurVueStatut.interface';

export default function SélecteurVueStatuts() {

  const { modifierLaVueSélectionnéeEtLesStatutsAssociés } = actionsStatutsStore();

  const options: optionChoixVueStatuts[] = [
    { valeur: 'BROUILLON_ET_PUBLIE', libellé: 'Chantiers publiés et non publiés' },
    { valeur: 'PUBLIE', libellé: 'Chantiers publiés' },
  ];
  
  const auChangement = useCallback((vueStatuts: TypeVueStatuts) => {
    modifierLaVueSélectionnéeEtLesStatutsAssociés(vueStatuts);
  }, [modifierLaVueSélectionnéeEtLesStatutsAssociés]);

  return (
    <ContrôleSegmenté
      options={options}
      valeurModifiéeCallback={auChangement}
      valeurSélectionnée={vueStatutsSélectionnéeStore()}
    />
  );
}

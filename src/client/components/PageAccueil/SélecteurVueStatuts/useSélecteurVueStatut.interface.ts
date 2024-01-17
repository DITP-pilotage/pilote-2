import { useCallback, useEffect, useMemo, useState } from 'react';
import { actionsStatutsStore } from '@/client/stores/useStatutsStore/useStatutsStore';
import { TypeVueStatuts } from '@/client/stores/useStatutsStore/useStatutStore.interface';
import optionChoixVueStatuts from './SélecteurVueStatut.interface';

export default function useSélecteurVueStatut() {
  const { modifierLaVueSélectionnéeEtLesStatutsAssociés } = actionsStatutsStore();

  const optionsParDéfaut: optionChoixVueStatuts[] = useMemo(() => [
    { valeur: 'BROUILLON_ET_PUBLIE', libellé: 'Chantiers validés et en cours de publication' },
    { valeur: 'PUBLIE', libellé: 'Chantiers validés uniquement' },
  ], []);

  const optionsMobile: optionChoixVueStatuts[] = useMemo(() => [
    { valeur: 'BROUILLON_ET_PUBLIE', libellé: 'Non validés' },
    { valeur: 'PUBLIE', libellé: 'Validés' },    
  ], []);

  const [options, setOptions] = useState(optionsParDéfaut);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 576) {
        setOptions(optionsMobile);
      } else {
        setOptions(optionsParDéfaut);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [optionsMobile, optionsParDéfaut]);

  const auChangement = useCallback((vueStatuts: TypeVueStatuts) => {
    modifierLaVueSélectionnéeEtLesStatutsAssociés(vueStatuts);
  }, [modifierLaVueSélectionnéeEtLesStatutsAssociés]);
  return {
    options,
    auChangement,
  };
}

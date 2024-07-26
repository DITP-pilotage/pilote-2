import { useCallback, useEffect, useMemo, useState } from 'react';
import { actionsStatutsStore } from '@/client/stores/useStatutsStore/useStatutsStore';
import { TypeVueStatuts } from '@/client/stores/useStatutsStore/useStatutStore.interface';
import optionChoixVueStatuts from './SélecteurVueStatut.interface';

export default function useSélecteurVueStatut() {
  const { modifierLaVueSélectionnéeEtLesStatutsAssociés } = actionsStatutsStore();

  const optionsParDéfaut: optionChoixVueStatuts[] = useMemo(() => [
    { valeur: 'PUBLIE', libellé: 'Chantiers validés' },
    { valeur: 'BROUILLON', libellé: 'Chantiers en cours de publication' },
    { valeur: 'BROUILLON_ET_PUBLIE', libellé: 'Tous' },
  ], []);

  const optionsMobile: optionChoixVueStatuts[] = useMemo(() => [
    { valeur: 'PUBLIE', libellé: 'Validés' },
    { valeur: 'BROUILLON', libellé: 'Brouillons' },
    { valeur: 'BROUILLON_ET_PUBLIE', libellé: 'Tous' },
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

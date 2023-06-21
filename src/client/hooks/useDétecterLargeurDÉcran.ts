import { useEffect, useState } from 'react';
import { actionsLargeurDÉcranStore } from '@/stores/useLargeurDÉcranStore/useLargeurDÉcranStore';

const POINT_RUPTURE_LARGEUR_XS = 576;
const POINT_RUPTURE_LARGEUR_SM = 768;
const POINT_RUPTURE_LARGEUR_MD = 992;
const POINT_RUPTURE_LARGEUR_LG = 1440;
const DURÉE_DEBOUNCE_MS = 300;

export default function useDétecterLargeurDÉcran() {
  const [largeurDÉcran, setLargeurDÉcran] = useState<number | null>(null);
  const { modifierLargeurDÉcran } = actionsLargeurDÉcranStore();

  useEffect(() => {
    if (largeurDÉcran === null) {
      modifierLargeurDÉcran(null);
    } else if (largeurDÉcran < POINT_RUPTURE_LARGEUR_XS) {
      modifierLargeurDÉcran('xs');
    } else if (largeurDÉcran < POINT_RUPTURE_LARGEUR_SM) {
      modifierLargeurDÉcran('sm');
    } else if (largeurDÉcran < POINT_RUPTURE_LARGEUR_MD) {
      modifierLargeurDÉcran('md');
    } else if (largeurDÉcran < POINT_RUPTURE_LARGEUR_LG) {
      modifierLargeurDÉcran('lg');
    } else {
      modifierLargeurDÉcran('xl');
    }
  }, [largeurDÉcran, modifierLargeurDÉcran]);

  useEffect(() => {
    setLargeurDÉcran(window.innerWidth);

    let timeout: NodeJS.Timeout | null = null;

    const auRedimensionnementDeLaFenêtre = () => {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      setTimeout(() => {
        setLargeurDÉcran(window.innerWidth);
      }, DURÉE_DEBOUNCE_MS);
    };

    window.addEventListener('resize', auRedimensionnementDeLaFenêtre);

    return () => {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      window.removeEventListener('resize', auRedimensionnementDeLaFenêtre);
    };
  }, []);
}

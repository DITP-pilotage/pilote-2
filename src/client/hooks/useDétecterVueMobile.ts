import { useEffect, useState } from 'react';
import { actionsEstVueMobileStore } from '@/stores/useEstVueMobileStore/useEstVueMobileStore';

const VUE_MOBILE_SEUIL_LARGEUR = 768; // breakpoint 'md' du DSFR
const DURÉE_DEBOUNCE_MS = 300;

export default function useDétecterVueMobile() {
  const [largeurDÉcran, setLargeurDÉcran] = useState<number | null>(null);
  const { modifierEstVueMobile } = actionsEstVueMobileStore();

  useEffect(() => {
    if (largeurDÉcran === null) {
      modifierEstVueMobile(null);
    } else {
      modifierEstVueMobile(largeurDÉcran < VUE_MOBILE_SEUIL_LARGEUR);
    }
  }, [largeurDÉcran, modifierEstVueMobile]);

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

import { useEffect, useState } from 'react';

const VUE_MOBILE_SEUIL_LARGEUR = 768;

export default function useEstVueMobile() {
  const [largeurDÉcran, setLargeurDÉcran] = useState<number | null>(null);
  const [estVueMobile, setEstVueMobile] = useState<boolean | null>(null);

  useEffect(() => {
    if (largeurDÉcran === null) {
      setEstVueMobile(null);
    } else {
      setEstVueMobile(largeurDÉcran < VUE_MOBILE_SEUIL_LARGEUR);
    }
  }, [largeurDÉcran]);

  useEffect(() => {
    setLargeurDÉcran(window.innerWidth);

    const auRedimensionnementDeLaFenêtre = () => {
      setLargeurDÉcran(window.innerWidth);
    };

    window.addEventListener('resize', auRedimensionnementDeLaFenêtre);

    return () => window.removeEventListener('resize', auRedimensionnementDeLaFenêtre);
  }, []);

  return estVueMobile;
}

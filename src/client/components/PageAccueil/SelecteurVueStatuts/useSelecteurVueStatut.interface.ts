import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import optionChoixVueStatuts from './SelecteurVueStatut.interface';

export default function useSélecteurVueStatut() {

  const { data: session } = useSession();
  const profilPeutAccederAuxBrouillons = !!session?.profilAAccèsAuxChantiersBrouillons;
  
  const optionsParDéfaut: optionChoixVueStatuts[] = useMemo(() => [
    { valeur: 'PUBLIE', libellé: 'PPG actives', position: 'gauche', estVisible: true },
    { valeur: 'BROUILLON', libellé: 'PPG en cours de publication', position: 'gauche', estVisible: profilPeutAccederAuxBrouillons },
    { valeur: 'BROUILLON_ET_PUBLIE', libellé: 'Tous', position: 'gauche', estVisible: profilPeutAccederAuxBrouillons },
    { valeur: 'ARCHIVE', libellé: 'PPG archivés', position: 'droite', estVisible: true, icone: 'fr-icon-archive-fill' },
  ], [profilPeutAccederAuxBrouillons]);

  const optionsMobile: optionChoixVueStatuts[] = useMemo(() => [
    { valeur: 'PUBLIE', libellé: 'Actives', position: 'gauche', estVisible: true },
    { valeur: 'BROUILLON', libellé: 'En cours de publication', position: 'gauche', estVisible: profilPeutAccederAuxBrouillons },
    { valeur: 'BROUILLON_ET_PUBLIE', libellé: 'Tous', position: 'gauche', estVisible: profilPeutAccederAuxBrouillons },
    { valeur: 'ARCHIVE', libellé: 'Archivées', position: 'droite', estVisible: true, icone: 'fr-icon-archive-fill' },
  ], [profilPeutAccederAuxBrouillons]);

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

  return {
    options,
  };
}

import { useEffect, useMemo, useState } from 'react';
import optionChoixVueStatuts from './SelecteurVueStatut.interface';

export default function useSélecteurVueStatut() {
  const optionsParDéfaut: optionChoixVueStatuts[] = useMemo(() => [
    { valeur: 'PUBLIE', libellé: 'Chantiers validés', position: 'gauche', estVisible: true },
    { valeur: 'BROUILLON', libellé: 'Chantiers en cours de publication', position: 'gauche', estVisible: true },
    { valeur: 'BROUILLON_ET_PUBLIE', libellé: 'Tous', position: 'gauche', estVisible: true },
    { valeur: 'ARCHIVE', libellé: 'Chantiers archivés', position: 'droite', estVisible: true, icone: 'fr-icon-archive-fill' },
  ], []);

  const optionsMobile: optionChoixVueStatuts[] = useMemo(() => [
    { valeur: 'PUBLIE', libellé: 'Validés', position: 'gauche', estVisible: true },
    { valeur: 'BROUILLON', libellé: 'En cours de publication', position: 'gauche', estVisible: true },
    { valeur: 'BROUILLON_ET_PUBLIE', libellé: 'Tous', position: 'gauche', estVisible: true },
    { valeur: 'ARCHIVE', libellé: 'Archivés', position: 'droite', estVisible: true, icone: 'fr-icon-archive-fill' },
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

  return {
    options,
  };
}

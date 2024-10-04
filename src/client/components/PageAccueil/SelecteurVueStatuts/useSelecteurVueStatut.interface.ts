import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import api from '@/server/infrastructure/api/trpc/api';
import optionChoixVueStatuts from './SelecteurVueStatut.interface';

export default function useSélecteurVueStatut() {

  const { data: session } = useSession();
  const { data: variableContenuFFPpgArchive } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_FF_PPG_ARCHIVE' });

  const profilPeutAccederAuxBrouillons = !!session?.profilAAccèsAuxChantiersBrouillons;
  
  const optionsParDéfaut: optionChoixVueStatuts[] = useMemo(() => [
    { valeur: 'PUBLIE', libellé: 'PPG actives', position: 'gauche', estVisible: true },
    { valeur: 'BROUILLON', libellé: 'PPG en cours de publication', position: 'gauche', estVisible: profilPeutAccederAuxBrouillons },
    { valeur: 'BROUILLON_ET_PUBLIE', libellé: 'Tous', position: 'gauche', estVisible: profilPeutAccederAuxBrouillons },
    { valeur: 'ARCHIVE', libellé: 'PPG archivés', position: 'droite', estVisible: !!variableContenuFFPpgArchive, icone: 'fr-icon-archive-fill' },
  ], [profilPeutAccederAuxBrouillons, variableContenuFFPpgArchive]);

  const optionsMobile: optionChoixVueStatuts[] = useMemo(() => [
    { valeur: 'PUBLIE', libellé: 'Actives', position: 'gauche', estVisible: true },
    { valeur: 'BROUILLON', libellé: 'En cours de publication', position: 'gauche', estVisible: profilPeutAccederAuxBrouillons },
    { valeur: 'BROUILLON_ET_PUBLIE', libellé: 'Tous', position: 'gauche', estVisible: profilPeutAccederAuxBrouillons },
    { valeur: 'ARCHIVE', libellé: 'Archivées', position: 'droite', estVisible: !!variableContenuFFPpgArchive, icone: 'fr-icon-archive-fill' },
  ], [profilPeutAccederAuxBrouillons, variableContenuFFPpgArchive]);

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

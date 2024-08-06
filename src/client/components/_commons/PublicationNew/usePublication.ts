import { useEffect, useState } from 'react';
import AlerteProps from '@/components/_commons/Alerte/Alerte.interface';
import { RouterOutputs } from '@/server/infrastructure/api/trpc/trpc.interface';
import PublicationProps from './Publication.interface';

export default function usePublication(publicationInitiale: PublicationProps['publicationInitiale']) {
  const [modeÉdition, setModeÉdition] = useState(false);
  const [publication, setPublication] = useState(publicationInitiale);
  const [alerte, setAlerte] = useState <AlerteProps | null>(null);

  const désactiverLeModeÉdition = () => {
    setModeÉdition(false);
  };

  const activerLeModeÉdition = () => {
    setModeÉdition(true);
  };

  const afficherAlerteErreur = (message: string) => {
    setAlerte({
      type: 'erreur',
      titre: message,
    });
  };

  const publicationCréée = (p: RouterOutputs['publication']['créer']) => {
    setPublication(p);
    setAlerte({
      type: 'succès',
      titre: 'Modification effectuée',
    });
    désactiverLeModeÉdition();
  };

  useEffect(() => {
    setPublication(publicationInitiale);
    setAlerte(null);
    désactiverLeModeÉdition();
  }, [publicationInitiale]);

  return {
    publication,
    modeÉdition,
    alerte,
    afficherAlerteErreur,
    activerLeModeÉdition,
    désactiverLeModeÉdition,
    publicationCréée,
  };
}

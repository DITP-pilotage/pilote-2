import { useEffect, useRef } from 'react';

export default function useModale(setEstAffichée: (valeur: boolean) => void) {
  const modaleRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const modaleHTML = modaleRef.current;
    if (!modaleHTML)
      return;

    const àLaFermetureDeLaModale = () => setEstAffichée(false);
    const àLOuvertureDeLaModale = () => setEstAffichée(true);

    modaleHTML.addEventListener('dsfr.conceal', àLaFermetureDeLaModale);
    modaleHTML.addEventListener('dsfr.disclose', àLOuvertureDeLaModale);

    return () => {
      modaleHTML?.removeEventListener('dsfr.conceal', àLaFermetureDeLaModale);
      modaleHTML?.removeEventListener('dsfr.disclose', àLOuvertureDeLaModale);
    };
  }, [modaleRef, setEstAffichée]);

  return {
    modaleRef,
  };
}

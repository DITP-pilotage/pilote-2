import { useEffect, useRef } from 'react';
import ModaleProps from '@/components/_commons/Modale/Modale.interface';

export default function useModale(ouvertureCallback: ModaleProps['ouvertureCallback'], fermetureCallback: ModaleProps['fermetureCallback']) {
  const modaleRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const modaleHTML = modaleRef.current;
    if (!modaleHTML)
      return;

    const àLaFermetureDeLaModale = () => fermetureCallback?.();
    const àLOuvertureDeLaModale = () => ouvertureCallback?.();

    modaleHTML.addEventListener('dsfr.conceal', àLaFermetureDeLaModale);
    modaleHTML.addEventListener('dsfr.disclose', àLOuvertureDeLaModale);

    return () => {
      modaleHTML?.removeEventListener('dsfr.conceal', àLaFermetureDeLaModale);
      modaleHTML?.removeEventListener('dsfr.disclose', àLOuvertureDeLaModale);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modaleRef]);

  return {
    modaleRef,
  };
}

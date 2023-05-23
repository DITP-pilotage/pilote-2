import { Dispatch, FormEventHandler, SetStateAction } from 'react';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';

type UploadFichierFormulaireElement = { 'file-upload': HTMLInputElement } & HTMLFormElement;

export const usePublierIndicateur = (chantierId: string, indicateurId: string, rapportId: string, setEstFichierPublie: Dispatch<SetStateAction<boolean>>) => {
  const publierLeFichier: FormEventHandler<UploadFichierFormulaireElement> = async (event) => {
    event.preventDefault();

    await fetch(`/api/chantier/${chantierId}/indicateur/${indicateurId}?rapportId=${rapportId}`, {
      method: 'POST',
    }).catch(error => {
      setEstFichierPublie(false);
      throw error;
    }).then(response => {
      setEstFichierPublie(true);
      return response.json() as Promise<DetailValidationFichierContrat>;
    });
  };

  return { publierLeFichier };
};

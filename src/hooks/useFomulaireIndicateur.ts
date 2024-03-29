import { ChangeEventHandler, Dispatch, FormEventHandler, SetStateAction, useState } from 'react';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';

type UploadFichierFormulaireElement = { 'file-upload': HTMLInputElement } & HTMLFormElement;

export const useFormulaireIndicateur = (chantierId: string, indicateurId: string, setRapport: Dispatch<SetStateAction<DetailValidationFichierContrat | null>>) => {
  const [file, setFile] = useState<File | null>(null);

  const définirLeFichier: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (event.target.files && event.target.files[0]) {      
      setFile(event.target.files[0]);
    }

    setRapport(null);
  };

  const verifierLeFichier: FormEventHandler<UploadFichierFormulaireElement> = async (event) => {
    event.preventDefault();

    if (!file) {
      return;
    }

    event.currentTarget['file-upload'].value = '';

    const body = new FormData();

    body.append('file', file);

    const detailValidationFichier: DetailValidationFichierContrat = await fetch(`/api/chantier/${chantierId}/indicateur/${indicateurId}/verifier`, {
      method: 'POST',
      body,
    }).then(response => response.json() as Promise<DetailValidationFichierContrat>);

    setRapport(detailValidationFichier);
    setFile(null);
  };

  return { définirLeFichier, file, verifierLeFichier };
};

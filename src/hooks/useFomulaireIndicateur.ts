import { ChangeEventHandler, Dispatch, FormEventHandler, SetStateAction, useState } from 'react';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';

type UploadFichierFormulaireElement = { 'file-upload': HTMLInputElement } & HTMLFormElement;

export const useFormulaireIndicateur = (chantierId: string, setRapport: Dispatch<SetStateAction<DetailValidationFichierContrat | null>>) => {
  const [file, setFile] = useState<File | null>(null);

  const définirLeFichier: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (event.target.files && event.target.files[0]) {      
      setFile(event.target.files[0]);
    }

    setRapport(null);
  };

  const uploadLeFichier: FormEventHandler<UploadFichierFormulaireElement> = async (event) => {
    event.preventDefault();
  
    if (!file) {
      return;
    }

    const body = new FormData();
    const schéma = 'https://raw.githubusercontent.com/DITP-pilotage/poc-imports/master/schemas/templates/arbre/schema_arbre.json';

    body.append('file', file);
    body.append('schema', schéma);

    const detailValidationFichier: DetailValidationFichierContrat = await fetch(`/api/chantier/${chantierId}/indicateur/indicateurIdToBeDefined`, {
      method: 'POST',
      body,
    }).then(response => response.json());
    
    setRapport(detailValidationFichier);
    setFile(null);
    event.currentTarget['file-upload'].value = ''; 
  };

  return { définirLeFichier, uploadLeFichier };  
};

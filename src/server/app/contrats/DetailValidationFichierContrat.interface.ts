export interface DetailValidationFichierContrat {
  estValide: boolean
  listeErreursValidation: ErreurValidationFichierContrat[];
}

interface ErreurValidationFichierContrat {
  cellule: string;
  nom: string;
  message: string;
  numeroDeLigne: number;
  positionDeLigne: number;
  nomDuChamp: string;
  positionDuChamp: number;
}

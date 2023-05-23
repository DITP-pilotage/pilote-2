import { Dispatch, SetStateAction } from 'react';

export interface FormulairePublierImportIndicateurProps {
  chantierId: string,
  indicateurId: string,
  rapportId: string,
  setEstFichierPublie: Dispatch<SetStateAction<boolean>>
}

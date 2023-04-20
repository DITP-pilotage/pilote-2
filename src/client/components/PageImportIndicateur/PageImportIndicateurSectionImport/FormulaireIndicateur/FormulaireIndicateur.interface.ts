import { Dispatch, SetStateAction } from 'react';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';

export interface FormulaireIndicateurProps {
  chantierId: string,
  indicateurId: string,
  setRapport: Dispatch<SetStateAction<DetailValidationFichierContrat | null>>
}

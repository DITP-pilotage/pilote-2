import { Dispatch, SetStateAction } from 'react';
import Bouton from '@/components/_commons/Bouton/Bouton';
import InputFichier from '@/components/_commons/InputFichier/InputFichier';
import { useFormulaireIndicateur } from '@/hooks/useFomulaireIndicateur';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';

interface FormulaireIndicateurProps {
  chantierId: string,
  setRapport: Dispatch<SetStateAction<DetailValidationFichierContrat | null>>
}

export default function FormulaireIndicateur({ chantierId, setRapport }: FormulaireIndicateurProps) {
  const { définirLeFichier, uploadLeFichier } = useFormulaireIndicateur(chantierId, setRapport);
  
  return (
    <div className='fr-grid-row fr-grid-row--middle fr-grid-row--center fr-gap-2w'>
      <InputFichier
        label='Importer des données'
        onChange={définirLeFichier}
      />
      <Bouton
        label='Importer les données'
        onClick={uploadLeFichier}
      />
    </div>
  );
}

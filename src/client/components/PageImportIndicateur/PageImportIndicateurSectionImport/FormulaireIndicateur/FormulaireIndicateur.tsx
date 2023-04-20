import { Dispatch, SetStateAction } from 'react';
import InputFichier from '@/components/_commons/InputFichier/InputFichier';
import { useFormulaireIndicateur } from '@/hooks/useFomulaireIndicateur';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';
import SubmitBouton from '@/components/_commons/SubmitBouton/SubmitBouton';

interface FormulaireIndicateurProps {
  chantierId: string,
  indicateurId: string,
  setRapport: Dispatch<SetStateAction<DetailValidationFichierContrat | null>>
}

export default function FormulaireIndicateur({ chantierId, indicateurId, setRapport }: FormulaireIndicateurProps) {
  const { définirLeFichier, uploadLeFichier, file } = useFormulaireIndicateur(chantierId, indicateurId, setRapport);  

  return (
    <form
      className='flex align-center'
      onSubmit={uploadLeFichier}
    >
      <InputFichier
        onChange={définirLeFichier}
      />
      <SubmitBouton
        disabled={!file}
        label='Importer les données'
      />
    </form>
  );
}

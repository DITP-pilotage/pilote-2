import { Dispatch, SetStateAction } from 'react';
import InputFichier from '@/components/_commons/InputFichier/InputFichier';
import { useFormulaireIndicateur } from '@/hooks/useFomulaireIndicateur';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';
import SubmitBouton from '@/components/_commons/SubmitBouton/SubmitBouton';

interface FormulaireIndicateurProps {
  chantierId: string,
  setRapport: Dispatch<SetStateAction<DetailValidationFichierContrat | null>>
}

export default function FormulaireIndicateur({ chantierId, setRapport }: FormulaireIndicateurProps) {
  const { définirLeFichier, uploadLeFichier } = useFormulaireIndicateur(chantierId, setRapport);

  return (
    <form
      className='fr-grid-row fr-grid-row--middle fr-grid-row--center fr-gap-2w'
      onSubmit={uploadLeFichier}
    >
      <InputFichier
        label='Importer des données'
        onChange={définirLeFichier}
      />
      <SubmitBouton label='Importer les données' />
    </form>
  );
}

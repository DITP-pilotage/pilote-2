import InputFichier from '@/components/_commons/InputFichier/InputFichier';
import { useFormulaireIndicateur } from '@/hooks/useFomulaireIndicateur';
import SubmitBouton from '@/components/_commons/SubmitBouton/SubmitBouton';
import { FormulaireIndicateurProps } from './FormulaireIndicateur.interface';

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

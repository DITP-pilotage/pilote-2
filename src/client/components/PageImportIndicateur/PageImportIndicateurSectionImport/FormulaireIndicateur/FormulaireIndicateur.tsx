import InputFichier from '@/components/_commons/InputFichier/InputFichier';
import { useFormulaireIndicateur } from '@/hooks/useFomulaireIndicateur';
import SubmitBouton from '@/components/_commons/SubmitBouton/SubmitBouton';
import { FormulaireIndicateurProps } from './FormulaireIndicateur.interface';

export default function FormulaireIndicateur({ chantierId, indicateurId, setRapport }: FormulaireIndicateurProps) {
  const { définirLeFichier, verifierLeFichier, file } = useFormulaireIndicateur(chantierId, indicateurId, setRapport);

  return (
    <form
      className='flex align-center'
      onSubmit={verifierLeFichier}
    >
      <InputFichier
        onChange={définirLeFichier}
      />
      <SubmitBouton
        disabled={!file}
        label='Vérifier le fichier'
      />
    </form>
  );
}

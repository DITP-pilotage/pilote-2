import SubmitBouton from '@/components/_commons/SubmitBouton/SubmitBouton';
import { usePublierIndicateur } from '@/hooks/usePublierIndicateur';
import { FormulairePublierImportIndicateurProps } from './FormulairePublierImportIndicateur.interface';

export default function FormulairePublierImportIndicateur({
  chantierId,
  indicateurId,
  rapportId,
  setEstFichierPublie,
}: FormulairePublierImportIndicateurProps) {
  const { publierLeFichier } = usePublierIndicateur(chantierId, indicateurId, rapportId, setEstFichierPublie);

  return (
    <form
      className='flex align-center'
      onSubmit={publierLeFichier}
    >
      <SubmitBouton
        label='Publier les données'
      />
    </form>
  );
}

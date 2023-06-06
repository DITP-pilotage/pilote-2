import SubmitBouton from '@/components/_commons/SubmitBouton/SubmitBouton';
import { usePublierIndicateur } from '@/hooks/usePublierIndicateur';
import { wording } from '@/client/utils/i18n/i18n';
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
        label={wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_PUBLIER_FICHIER.LABEL_BOUTON_PROCHAINE_ETAPE}
      />
    </form>
  );
}

import { Dispatch, FunctionComponent, SetStateAction } from 'react';
import SubmitBouton from '@/components/_commons/SubmitBouton/SubmitBouton';
import { usePublierIndicateur } from '@/hooks/usePublierIndicateur';
import { wording } from '@/client/utils/i18n/i18n';

interface FormulairePublierImportIndicateurProps {
  chantierId: string,
  indicateurId: string,
  rapportId: string,
  setEstFichierPublie: Dispatch<SetStateAction<boolean>>
}

const FormulairePublierImportIndicateur: FunctionComponent<FormulairePublierImportIndicateurProps> = ({
  chantierId,
  indicateurId,
  rapportId,
  setEstFichierPublie,
}) => {
  const { publierLeFichier } = usePublierIndicateur(chantierId, indicateurId, rapportId, setEstFichierPublie);

  return (
    <form
      className='flex justify-end'
      onSubmit={publierLeFichier}
    >
      <SubmitBouton
        label={wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_PUBLIER_FICHIER.LABEL_BOUTON_PROCHAINE_ETAPE}
      />
    </form>
  );
};

export default FormulairePublierImportIndicateur;

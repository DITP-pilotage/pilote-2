import InputFichier from '@/components/_commons/InputFichier/InputFichier';
import { useFormulaireIndicateur } from '@/hooks/useFomulaireIndicateur';
import SubmitBouton from '@/components/_commons/SubmitBouton/SubmitBouton';
import { wording } from '@/client/utils/i18n/i18n';
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
        label={wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_SELECTION_INDICATEUR.LABEL_BOUTON_VERIFIER_FICHIER}
      />
    </form>
  );
}

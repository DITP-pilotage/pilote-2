import InputFichier from '@/components/_commons/InputFichier/InputFichier';
import { useFormulaireIndicateur } from '@/hooks/useFomulaireIndicateur';
import SubmitBouton from '@/components/_commons/SubmitBouton/SubmitBouton';
import { wording } from '@/client/utils/i18n/i18n';
import { FormulaireIndicateurProps } from './FormulaireIndicateur.interface';

export default function FormulaireIndicateur({ chantierId, indicateurId, setRapport }: FormulaireIndicateurProps) {
  const { définirLeFichier, verifierLeFichier, file } = useFormulaireIndicateur(chantierId, indicateurId, setRapport);

  return (

    <>
      <form
        className='flex align-center fr-mb-3w'
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
      <p>
        {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_SELECTION_INDICATEUR.EXPLICATION_TELECHARGEMENT_TEMPLATE}
      </p>
      <p>
        {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_SELECTION_INDICATEUR.EXPLICATION_INDICATEUR_ID}
        {' '}
        <b>
          {indicateurId}
        </b>
      </p>
      <div className='flex'>
        <div className='fr-download fr-mr-3w'>
          <p>
            <a
              className='fr-download__link'
              download
              href='/model/template_import_PILOTE.csv'
            >
              {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_SELECTION_INDICATEUR.LABEL_BOUTON_TELECHARGER_MODELE_CSV}
              <span className='fr-download__detail'>
                {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_SELECTION_INDICATEUR.FORMAT_BOUTON_TELECHARGER_MODELE_CSV}
              </span>
            </a>
          </p>
        </div>
        <div className='fr-download'>
          <p>
            <a
              className='fr-download__link'
              download
              href='/model/template_import_PILOTE.xlsx'
            >
              {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_SELECTION_INDICATEUR.LABEL_BOUTON_TELECHARGER_MODELE_XLSX}
              <span className='fr-download__detail'>
                {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_SELECTION_INDICATEUR.FORMAT_BOUTON_TELECHARGER_MODELE_XLSX}
              </span>
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

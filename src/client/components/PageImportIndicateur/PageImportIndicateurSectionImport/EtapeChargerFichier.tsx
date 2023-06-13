import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';
import Titre from '@/components/_commons/Titre/Titre';
import { wording } from '@/client/utils/i18n/i18n';
import FormulaireIndicateur
  from '@/components/PageImportIndicateur/PageImportIndicateurSectionImport/FormulaireIndicateur/FormulaireIndicateur';
import ResultatValidationFichier
  from '@/components/PageImportIndicateur/ResultatValidationFichier/ResultatValidationFichier';
import SubmitBouton from '@/components/_commons/SubmitBouton/SubmitBouton';

export function EtapeChargerFichier({ indicateur, indicateurId, setRapport, rapport, chantierId }: {
  indicateur: Indicateur,
  chantierId: string,
  indicateurId: string,
  setRapport: (value: (((prevState: (DetailValidationFichierContrat | null)) => (DetailValidationFichierContrat | null)) | DetailValidationFichierContrat | null)) => void,
  rapport: DetailValidationFichierContrat | null
}) {
  return (
    <>
      <Titre baliseHtml="h4">
        {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_CHARGER_FICHIER.TITRE}
      </Titre>
      <p>
        {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_CHARGER_FICHIER.SOUS_TITRE}
      </p>
      <p>
        {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_CHARGER_FICHIER.LABEL_BOUTON_CHARGER_FICHIER(indicateur?.nom)}
      </p>
      <FormulaireIndicateur
        chantierId={chantierId}
        indicateurId={indicateurId}
        setRapport={setRapport}
      />
      {
        rapport !== null &&
          <ResultatValidationFichier rapport={rapport} />
      }
      {
        rapport?.estValide ?
          <div className="fr-mt-4w">
            <form method="GET">
              <input
                name="etapeCourante"
                type="hidden"
                value={3}
              />
              <input
                name="indicateurId"
                type="hidden"
                value={indicateur?.id}
              />
              <input
                name="rapportId"
                type="hidden"
                value={rapport?.id}
              />
              <div className="fr-mt-4w flex justify-end">
                <SubmitBouton
                  className="fr-btn--icon-right fr-icon-arrow-right-line"
                  label={wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_CHARGER_FICHIER.LABEL_BOUTON_PROCHAINE_ETAPE}
                />
              </div>
            </form>
          </div>
          : null
      }
    </>
  );
}

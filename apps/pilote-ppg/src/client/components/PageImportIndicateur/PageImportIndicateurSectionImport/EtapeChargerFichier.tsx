import { FunctionComponent } from "react";
import { Button } from "@/components/shared/Button";
import { Indicateur } from "@/shared/indicateur/Indicateur.interface";
import { DetailValidationFichierContrat } from "@/server/app/contrats/DetailValidationFichierContrat.interface";
import { wording } from "@/client/utils/i18n/i18n";
import FormulaireIndicateur from "@/components/PageImportIndicateur/PageImportIndicateurSectionImport/FormulaireIndicateur/FormulaireIndicateur";
import ResultatValidationFichier from "@/components/PageImportIndicateur/ResultatValidationFichier/ResultatValidationFichier";
import { Icone } from "@/components/_commons/Icone";
import { ArrowLine1Icon } from "@/components/_commons/Icones/ArrowLine1Icon";

const EtapeChargerFichier: FunctionComponent<{
  indicateur: Indicateur;
  chantierId: string;
  indicateurId: string;
  setRapport: (
    value:
      | ((
          prevState: DetailValidationFichierContrat | null,
        ) => DetailValidationFichierContrat | null)
      | DetailValidationFichierContrat
      | null,
  ) => void;
  rapport: DetailValidationFichierContrat | null;
}> = ({ indicateur, indicateurId, setRapport, rapport, chantierId }) => {
  return (
    <>
      <h4>
        {
          wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
            .ETAPE_CHARGER_FICHIER.TITRE
        }
      </h4>
      <p>
        {
          wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
            .ETAPE_CHARGER_FICHIER.SOUS_TITRE
        }
      </p>
      <p>
        {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT.ETAPE_CHARGER_FICHIER.LABEL_BOUTON_CHARGER_FICHIER(
          indicateur?.nom,
        )}
      </p>
      <FormulaireIndicateur
        chantierId={chantierId}
        indicateurId={indicateurId}
        setRapport={setRapport}
      />
      {rapport !== null && <ResultatValidationFichier rapport={rapport} />}
      {rapport?.estValide ? (
        <div className="fr-mt-4w">
          <form method="GET">
            <input name="etapeCourante" type="hidden" value={3} />
            <input name="indicateurId" type="hidden" value={indicateur?.id} />
            <input name="rapportId" type="hidden" value={rapport?.id} />
            <div className="fr-mt-4w flex justify-end">
              <Button
                className="ml-8"
                iconRight={
                  <Icone
                    className="text-current h-4 w-4"
                    icone={ArrowLine1Icon}
                  />
                }
                title={
                  wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                    .ETAPE_CHARGER_FICHIER.LABEL_BOUTON_PROCHAINE_ETAPE
                }
                type="submit"
              >
                {
                  wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                    .ETAPE_CHARGER_FICHIER.LABEL_BOUTON_PROCHAINE_ETAPE
                }
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
};

export default EtapeChargerFichier;

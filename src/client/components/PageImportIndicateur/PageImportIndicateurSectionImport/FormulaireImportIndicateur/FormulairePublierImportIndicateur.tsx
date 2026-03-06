import "@gouvfr/dsfr/dist/component/button/button.min.css";
import { FunctionComponent } from "react";
import { usePublierIndicateur } from "@/hooks/usePublierIndicateur";
import { wording } from "@/client/utils/i18n/i18n";

interface FormulairePublierImportIndicateurProps {
  chantierId: string;
  indicateurId: string;
  rapportId: string;
}

const FormulairePublierImportIndicateur: FunctionComponent<
  FormulairePublierImportIndicateurProps
> = ({ chantierId, indicateurId, rapportId }) => {
  const { publierLeFichier, estEnChargement } = usePublierIndicateur(
    chantierId,
    indicateurId,
    rapportId,
  );

  return (
    <div className="flex justify-end">
      <button
        className="fr-btn"
        disabled={estEnChargement}
        onClick={publierLeFichier}
        title={
          wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
            .ETAPE_PUBLIER_FICHIER.LABEL_BOUTON_PROCHAINE_ETAPE
        }
        type="button"
      >
        {
          wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
            .ETAPE_PUBLIER_FICHIER.LABEL_BOUTON_PROCHAINE_ETAPE
        }
      </button>
    </div>
  );
};

export default FormulairePublierImportIndicateur;

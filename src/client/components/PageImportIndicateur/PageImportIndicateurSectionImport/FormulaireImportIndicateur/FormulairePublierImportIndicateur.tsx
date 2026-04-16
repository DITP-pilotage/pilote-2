import { FunctionComponent, SubmitEventHandler } from "react";
import { SubmitBouton } from "@/components/_commons/SubmitBouton/SubmitBouton";
import { wording } from "@/client/utils/i18n/i18n";

interface FormulairePublierImportIndicateurProps {
  isPending: boolean;
  publierLeFichier: SubmitEventHandler<HTMLFormElement>;
}

const FormulairePublierImportIndicateur: FunctionComponent<
  FormulairePublierImportIndicateurProps
> = ({ isPending, publierLeFichier }) => {
  return (
    <form className="flex justify-end" onSubmit={publierLeFichier}>
      <SubmitBouton
        className="ml-8"
        disabled={isPending}
        label={
          isPending
            ? "Publication en cours..."
            : wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                .ETAPE_PUBLIER_FICHIER.LABEL_BOUTON_PROCHAINE_ETAPE
        }
      />
    </form>
  );
};

export default FormulairePublierImportIndicateur;

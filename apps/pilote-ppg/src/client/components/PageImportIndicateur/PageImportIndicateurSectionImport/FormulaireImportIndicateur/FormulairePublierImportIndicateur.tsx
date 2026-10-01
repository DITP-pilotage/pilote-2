import { FunctionComponent, SubmitEventHandler } from "react";
import { Button } from "@/components/shared/Button";
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
      <Button
        className="ml-8"
        disabled={isPending}
        title={
          isPending
            ? "Publication en cours..."
            : wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                .ETAPE_PUBLIER_FICHIER.LABEL_BOUTON_PROCHAINE_ETAPE
        }
        type="submit"
      >
        {isPending
          ? "Publication en cours..."
          : wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
              .ETAPE_PUBLIER_FICHIER.LABEL_BOUTON_PROCHAINE_ETAPE}
      </Button>
    </form>
  );
};

export default FormulairePublierImportIndicateur;

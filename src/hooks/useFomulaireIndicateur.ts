import {
  ChangeEventHandler,
  Dispatch,
  FormEventHandler,
  SetStateAction,
  useState,
} from "react";
import { DetailValidationFichierContrat } from "@/server/app/contrats/DetailValidationFichierContrat.interface";
import { wording } from "@/client/utils/i18n/i18n";
import { Toaster } from "@/client/utils/toaster";

type UploadFichierFormulaireElement = {
  "file-upload": HTMLInputElement;
} & HTMLFormElement;

export const useFormulaireIndicateur = (
  chantierId: string,
  indicateurId: string,
  setRapport: Dispatch<SetStateAction<DetailValidationFichierContrat | null>>,
) => {
  const [file, setFile] = useState<File | null>(null);
  const [estEnChargement, setEstEnChargement] = useState(false);

  const définirLeFichier: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }

    setRapport(null);
  };

  const verifierLeFichier: FormEventHandler<
    UploadFichierFormulaireElement
  > = async (event) => {
    event.preventDefault();

    if (!file) {
      return;
    }

    event.currentTarget["file-upload"].value = "";

    const body = new FormData();

    body.append("file", file);

    setEstEnChargement(true);

    try {
      const detailValidationFichier: DetailValidationFichierContrat =
        await fetch(
          `/api/chantier/${chantierId}/indicateur/${indicateurId}/verifier`,
          {
            method: "POST",
            body,
          },
        ).then(
          (response) =>
            response.json() as Promise<DetailValidationFichierContrat>,
        );

      setRapport(detailValidationFichier);
      setFile(null);

      if (detailValidationFichier.estValide) {
        Toaster.success(
          wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
            .ETAPE_CHARGER_FICHIER.TITRE_ALERT_SUCCES,
        );
      } else {
        const contientDesErreursNonIdentifies =
          detailValidationFichier.listeErreursValidation.some(
            (erreur) => erreur.nom === "Erreur non identifié",
          );
        Toaster.error(
          contientDesErreursNonIdentifies
            ? wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                .ETAPE_CHARGER_FICHIER.TITRE_ALERT_ERREUR_SUPPORT
            : wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_ETAPE_IMPORT
                .ETAPE_CHARGER_FICHIER.TITRE_ALERT_ERREUR,
        );
      }
    } finally {
      setEstEnChargement(false);
    }
  };

  return { définirLeFichier, estEnChargement, file, verifierLeFichier };
};

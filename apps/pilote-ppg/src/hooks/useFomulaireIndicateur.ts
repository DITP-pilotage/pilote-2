import {
  ChangeEventHandler,
  Dispatch,
  FormEventHandler,
  SetStateAction,
  useState,
} from "react";
import { DetailValidationFichierContrat } from "@/server/app/contrats/DetailValidationFichierContrat.interface";

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
      const réponse = await fetch(
        `/api/chantier/${chantierId}/indicateur/${indicateurId}/verifier`,
        { method: "POST", body },
      );

      // Sans ce contrôle, une réponse d'erreur renvoie du HTML, `json()` lève,
      // et l'absence de `catch` laissait l'utilisateur devant un écran muet :
      // le chargement s'arrêtait sans le moindre message.
      if (!réponse.ok) {
        setRapport({
          id: "",
          estValide: false,
          listeErreursValidation: [
            {
              cellule: "Cellule non définie",
              nom: "Erreur inattendue",
              message:
                "Le fichier n'a pas pu être vérifié. Réessayez, et si le problème persiste contactez le support de la DITP : pilote.ditp@modernisation.gouv.fr.",
              numeroDeLigne: 0,
              positionDeLigne: 0,
              nomDuChamp: "",
              positionDuChamp: -1,
            },
          ],
        });
        return;
      }

      setRapport((await réponse.json()) as DetailValidationFichierContrat);
      setFile(null);
    } catch {
      setRapport({
        id: "",
        estValide: false,
        listeErreursValidation: [
          {
            cellule: "Cellule non définie",
            nom: "Erreur inattendue",
            message:
              "Le fichier n'a pas pu être vérifié. Vérifiez votre connexion et réessayez.",
            numeroDeLigne: 0,
            positionDeLigne: 0,
            nomDuChamp: "",
            positionDuChamp: -1,
          },
        ],
      });
    } finally {
      setEstEnChargement(false);
    }
  };

  return { définirLeFichier, estEnChargement, file, verifierLeFichier };
};

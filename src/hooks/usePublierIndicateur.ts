import { Dispatch, SetStateAction, SubmitEventHandler, useState } from "react";
import { DetailValidationFichierContrat } from "@/server/app/contrats/DetailValidationFichierContrat.interface";

export const usePublierIndicateur = (
  chantierId: string,
  indicateurId: string,
  rapportId: string,
  setEstFichierPublie: Dispatch<SetStateAction<boolean>>,
) => {
  const [isPending, setIsPending] = useState(false);

  const publierLeFichier: SubmitEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    event.preventDefault();
    setIsPending(true);

    await fetch(
      `/api/chantier/${chantierId}/indicateur/${indicateurId}?rapportId=${rapportId}`,
      {
        method: "POST",
      },
    )
      .catch((error) => {
        setEstFichierPublie(false);
        throw error;
      })
      .then((response) => {
        setEstFichierPublie(true);
        return response.json() as Promise<DetailValidationFichierContrat>;
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  return { publierLeFichier, isPending };
};

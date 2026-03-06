import { useEffect, useState } from "react";
import { RouterOutputs } from "@/server/infrastructure/api/trpc/trpc.interface";
import { Toaster } from "@/client/utils/toaster";
import PublicationProps from "./Publication.interface";

export default function usePublication(
  publicationInitiale: PublicationProps["publicationInitiale"],
) {
  const [modeÉdition, setModeÉdition] = useState(false);
  const [publication, setPublication] = useState(publicationInitiale);

  const désactiverLeModeÉdition = () => {
    setModeÉdition(false);
  };

  const activerLeModeÉdition = () => {
    setModeÉdition(true);
  };

  const afficherAlerteErreur = (message: string) => {
    Toaster.error(message);
  };

  const publicationCréée = (p: RouterOutputs["publication"]["créer"]) => {
    setPublication(p);
    Toaster.success("Modification effectuée");
    désactiverLeModeÉdition();
  };

  useEffect(() => {
    setPublication(publicationInitiale);
    désactiverLeModeÉdition();
  }, [publicationInitiale]);

  return {
    publication,
    modeÉdition,
    afficherAlerteErreur,
    activerLeModeÉdition,
    désactiverLeModeÉdition,
    publicationCréée,
  };
}

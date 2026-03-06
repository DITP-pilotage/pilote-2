import { useState } from "react";
import { Toaster } from "@/client/utils/toaster";
import api from "@/server/infrastructure/api/trpc/api";
import { pageHabilitationsCoordinateur } from "@/components/PageHabilitationsCoordinateur/PageHabilitationsCoordinateurServerSideContext";

export const useAjouterChantierAuxHabilitations = () => {
  const { chantiers } =
    pageHabilitationsCoordinateur.useServerSidePropsContext();
  const [chantierIdsSelectionnes, setChantierIdsSelectionnes] = useState<
    string[]
  >([]);

  const mutation =
    api.habilitationsCoordinateur.ajouterChantierAuxHabilitations.useMutation();

  const changerSelectionChantiers = (ids: string[]) => {
    setChantierIdsSelectionnes(ids);
  };

  const ajouterAuxHabilitations = async (
    scope: "saisieCommentaire" | "gestionUtilisateur",
  ) => {
    if (chantierIdsSelectionnes.length === 0) return;

    await mutation.mutateAsync(
      {
        chantierIds: chantierIdsSelectionnes,
        scope,
      },
      {
        onSuccess: () => {
          Toaster.success("Chantiers ajoutés aux habilitations");
        },
        onError: () => {
          Toaster.error("Erreur lors de l'ajout des chantiers");
        },
      },
    );
  };

  return {
    chantiers,
    chantierIdsSelectionnes,
    changerSelectionChantiers,
    ajouterAuxHabilitations,
    isLoading: mutation.isPending,
  };
};

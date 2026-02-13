import { useState } from "react";
import { toast } from "sonner";
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
          toast.success("Chantiers ajoutés aux habilitations", {
            position: "top-right",
            richColors: true,
          });
        },
        onError: () => {
          toast.error("Erreur lors de l'ajout des chantiers", {
            position: "top-right",
            richColors: true,
          });
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

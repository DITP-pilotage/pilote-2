import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { CommentaireV2 } from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { CommentaireAction } from "@/components/_commons/CommentairesNew/CommentaireSection/AlerteCommentaire";

export const useEditerBrouillonCommentaire = ({
  brouillon,
  onSuccess,
}: {
  brouillon: CommentaireV2;
  onSuccess: (action: CommentaireAction) => void;
}) => {
  const publierUnBrouillonMutation =
    api.commentaire.publierUnBrouillon.useMutation();
  const modifierLeBrouillonMutation =
    api.commentaire.modifierLeBrouillon.useMutation();

  const input = (data: { contenu: string }) => ({
    brouillon,
    contenu: data.contenu,
    csrf: récupérerUnCookie("csrf") ?? "",
  });

  const publier = (data: { contenu: string }) =>
    publierUnBrouillonMutation.mutateAsync(input(data), {
      onSuccess: () => onSuccess("publication-reussie"),
    });

  const enregistrerEnBrouillon = (data: { contenu: string }) =>
    modifierLeBrouillonMutation.mutateAsync(input(data), {
      onSuccess: () => onSuccess("brouillon-enregistre"),
    });

  return { publier, enregistrerEnBrouillon };
};

import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { CommentaireAvecNomsAuteurs } from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { CommentaireAction } from "@/components/_commons/CommentairesNew/CommentaireSection/AlerteCommentaire";

export const useModifierCommentaire = ({
  commentaire,
  onSuccess,
}: {
  commentaire: CommentaireAvecNomsAuteurs;
  onSuccess: (action: CommentaireAction) => void;
}) => {
  const modifier = api.commentaire.modifier.useMutation();

  return (data: { contenu: string }) =>
    modifier.mutateAsync(
      {
        commentaireAModifier: commentaire,
        contenu: data.contenu,
        csrf: récupérerUnCookie("csrf") ?? "",
      },
      { onSuccess: () => onSuccess("modification-reussie") },
    );
};

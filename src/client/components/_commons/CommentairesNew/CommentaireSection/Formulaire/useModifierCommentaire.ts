import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { CommentaireAction } from "@/components/_commons/CommentairesNew/CommentaireSection/AlerteCommentaire";

export const useModifierCommentaire = ({
  commentaireId,
  onSuccess,
}: {
  commentaireId: string;
  onSuccess: (action: CommentaireAction) => void;
}) => {
  const modifier = api.commentaire.modifier.useMutation();

  return (data: { contenu: string }) =>
    modifier.mutateAsync(
      {
        commentaireId,
        contenu: data.contenu,
        csrf: récupérerUnCookie("csrf") ?? "",
      },
      { onSuccess: () => onSuccess("modification-reussie") },
    );
};

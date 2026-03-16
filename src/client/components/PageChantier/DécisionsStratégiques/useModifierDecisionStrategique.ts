import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { CommentaireAction } from "@/components/_commons/CommentairesNew/CommentaireSection/AlerteCommentaire";

export const useModifierDecisionStrategique = ({
  decisionStrategiqueId,
  onSuccess,
}: {
  decisionStrategiqueId: string;
  onSuccess: (action: CommentaireAction) => void;
}) => {
  const modifierMutation = api.decisionStrategique.modifier.useMutation();

  return (data: { contenu: string }) =>
    modifierMutation.mutateAsync(
      {
        decisionStrategiqueId,
        contenu: data.contenu,
        csrf: récupérerUnCookie("csrf") ?? "",
      },
      { onSuccess: () => onSuccess("modification-reussie") },
    );
};

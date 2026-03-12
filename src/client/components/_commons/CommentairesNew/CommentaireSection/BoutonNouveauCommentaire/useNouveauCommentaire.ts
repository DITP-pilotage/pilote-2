import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { TypeCommentaireChantier } from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { CommentaireAction } from "@/components/_commons/CommentairesNew/CommentaireSection/AlerteCommentaire";

export const useNouveauCommentaire = ({
  réformeId,
  territoireCode,
  type,
  onSuccess,
}: {
  réformeId: string;
  territoireCode: string;
  type: TypeCommentaireChantier;
  onSuccess: (action: CommentaireAction) => void;
}) => {
  const publierMutation = api.commentaire.publier.useMutation();
  const enregistrerEnBrouillonMutation =
    api.commentaire.enregistrerEnBrouillon.useMutation();

  const input = (data: { contenu: string }) => ({
    réformeId,
    territoireCode,
    type,
    contenu: data.contenu,
    csrf: récupérerUnCookie("csrf") ?? "",
  });

  const publier = (data: { contenu: string }) =>
    publierMutation.mutateAsync(input(data), {
      onSuccess: () => onSuccess("publication-reussie"),
    });

  const enregistrerEnBrouillon = (data: { contenu: string }) =>
    enregistrerEnBrouillonMutation.mutateAsync(input(data), {
      onSuccess: () => onSuccess("brouillon-enregistre"),
    });

  return { publier, enregistrerEnBrouillon };
};

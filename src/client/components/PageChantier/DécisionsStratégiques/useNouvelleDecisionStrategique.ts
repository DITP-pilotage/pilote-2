import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { TypeDecisionStrategique } from "@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface";
import { CommentaireAction } from "@/components/_commons/CommentairesNew/CommentaireSection/AlerteCommentaire";

export const useNouvelleDecisionStrategique = ({
  chantierId,
  type,
  onSuccess,
}: {
  chantierId: string;
  type: TypeDecisionStrategique;
  onSuccess: (action: CommentaireAction) => void;
}) => {
  const publierMutation = api.decisionStrategique.publier.useMutation();
  const enregistrerEnBrouillonMutation =
    api.decisionStrategique.enregistrerEnBrouillon.useMutation();

  const input = (data: { contenu: string }) => ({
    chantierId,
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

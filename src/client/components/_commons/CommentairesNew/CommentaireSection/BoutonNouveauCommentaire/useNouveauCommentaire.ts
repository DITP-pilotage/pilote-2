import { parseAsStringLiteral, useQueryState } from "nuqs";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { TypeCommentaireChantier } from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { COMMENTAIRE_ACTIONS } from "@/components/_commons/CommentairesNew/CommentaireSection/AlerteCommentaire";

export const useNouveauCommentaire = ({
  réformeId,
  territoireCode,
  type,
  onSuccess,
}: {
  réformeId: string;
  territoireCode: string;
  type: TypeCommentaireChantier;
  onSuccess: () => void;
}) => {
  const publierMutation = api.commentaire.publier.useMutation();
  const enregistrerEnBrouillonMutation =
    api.commentaire.enregistrerEnBrouillon.useMutation();

  const [, setAction] = useQueryState(
    `_action-${type}`,
    parseAsStringLiteral(COMMENTAIRE_ACTIONS).withDefault("").withOptions({
      history: "push",
      shallow: false,
      clearOnDefault: true,
    }),
  );

  const input = (data: { contenu: string }) => ({
    réformeId,
    territoireCode,
    type,
    contenu: data.contenu,
    csrf: récupérerUnCookie("csrf") ?? "",
  });

  const publier = (data: { contenu: string }) =>
    publierMutation.mutateAsync(input(data), {
      onSuccess: async () => {
        onSuccess();
        await setAction(null, { shallow: true });
        await setAction("publication-reussie");
      },
    });

  const enregistrerEnBrouillon = (data: { contenu: string }) =>
    enregistrerEnBrouillonMutation.mutateAsync(input(data), {
      onSuccess: async () => {
        onSuccess();
        await setAction(null, { shallow: true });
        await setAction("brouillon-enregistre");
      },
    });

  return { publier, enregistrerEnBrouillon };
};

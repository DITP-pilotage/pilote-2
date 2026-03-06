import { parseAsStringLiteral, useQueryState } from "nuqs";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import {
  CommentaireV2,
  TypeCommentaireChantier,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { COMMENTAIRE_ACTIONS } from "@/components/_commons/CommentairesNew/CommentaireSection/AlerteCommentaire";

export const useEditerBrouillonCommentaire = ({
  brouillon,
  type,
  onSuccess,
}: {
  brouillon: CommentaireV2;
  type: TypeCommentaireChantier;
  onSuccess: () => void;
}) => {
  const publierUnBrouillonMutation =
    api.commentaire.publierUnBrouillon.useMutation();
  const modifierLeBrouillonMutation =
    api.commentaire.modifierLeBrouillon.useMutation();

  const [, setAction] = useQueryState(
    `_action-${type}`,
    parseAsStringLiteral(COMMENTAIRE_ACTIONS).withDefault("").withOptions({
      history: "push",
      shallow: false,
      clearOnDefault: true,
    }),
  );

  const input = (data: { contenu: string }) => ({
    brouillon,
    contenu: data.contenu,
    csrf: récupérerUnCookie("csrf") ?? "",
  });

  const publier = (data: { contenu: string }) =>
    publierUnBrouillonMutation.mutateAsync(input(data), {
      onSuccess: async () => {
        onSuccess();
        await setAction(null, { shallow: true });
        await setAction("publication-reussie");
      },
    });

  const enregistrerEnBrouillon = (data: { contenu: string }) =>
    modifierLeBrouillonMutation.mutateAsync(input(data), {
      onSuccess: async () => {
        onSuccess();
        await setAction(null, { shallow: true });
        await setAction("brouillon-enregistre");
      },
    });

  return { publier, enregistrerEnBrouillon };
};

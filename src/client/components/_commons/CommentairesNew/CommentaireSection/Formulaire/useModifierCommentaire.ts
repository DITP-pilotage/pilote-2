import { parseAsBoolean, parseAsStringLiteral, useQueryState } from "nuqs";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import {
  CommentaireAvecNomsAuteurs,
  TypeCommentaireChantier,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { COMMENTAIRE_ACTIONS } from "@/components/_commons/CommentairesNew/CommentaireSection/AlerteCommentaire";

export const useModifierCommentaire = ({
  commentaire,
  type,
}: {
  commentaire: CommentaireAvecNomsAuteurs;
  type: TypeCommentaireChantier;
}) => {
  const modifier = api.commentaire.modifier.useMutation();

  const [, setAction] = useQueryState(
    `_action-${type}`,
    parseAsStringLiteral(COMMENTAIRE_ACTIONS).withDefault("").withOptions({
      history: "push",
      shallow: false,
      clearOnDefault: true,
    }),
  );

  const [, setModeÉdition] = useQueryState(
    `edition-${type}`,
    parseAsBoolean.withDefault(false).withOptions({
      history: "push",
      shallow: false,
      clearOnDefault: true,
    }),
  );

  return (data: { contenu: string }) =>
    modifier.mutateAsync(
      {
        commentaireAModifier: commentaire,
        contenu: data.contenu,
        csrf: récupérerUnCookie("csrf") ?? "",
      },
      {
        onSuccess: async () => {
          setAction(null, { shallow: true });
          setAction("modification-reussie", { shallow: true });
          await setModeÉdition(false);
        },
      },
    );
};

import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import {
  CommentaireV2,
  TypeCommentaireChantier,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { PublicationActions } from "@/components/PageChantier/PublicationV2/Publication.interface";

export const useCommentaireActions = ({
  chantierId,
  territoireCode,
  type,
  commentaire,
  brouillon,
}: {
  chantierId: string;
  territoireCode: string;
  type: TypeCommentaireChantier;
  commentaire: CommentaireV2 | null;
  brouillon: CommentaireV2 | null;
}): PublicationActions => {
  const csrf = () => récupérerUnCookie("csrf") ?? "";
  const refreshRouter = useRefreshRouter();

  const publierMutation = api.commentaire.publier.useMutation();
  const enregistrerEnBrouillonMutation =
    api.commentaire.enregistrerEnBrouillon.useMutation();
  const publierUnBrouillonMutation =
    api.commentaire.publierUnBrouillon.useMutation();
  const modifierLeBrouillonMutation =
    api.commentaire.modifierLeBrouillon.useMutation();
  const modifierMutation = api.commentaire.modifier.useMutation();

  const publier = (data: { contenu: string }) =>
    publierMutation.mutateAsync(
      { chantierId, territoireCode, type, contenu: data.contenu, csrf: csrf() },
      { onSuccess: () => refreshRouter() },
    );

  const enregistrerEnBrouillon = (data: { contenu: string }) =>
    enregistrerEnBrouillonMutation.mutateAsync(
      { chantierId, territoireCode, type, contenu: data.contenu, csrf: csrf() },
      { onSuccess: () => refreshRouter() },
    );

  const publierBrouillon = (data: { contenu: string }) =>
    publierUnBrouillonMutation.mutateAsync(
      { brouillonId: brouillon!.id, contenu: data.contenu, csrf: csrf() },
      { onSuccess: () => refreshRouter() },
    );

  const modifierBrouillon = (data: { contenu: string }) =>
    modifierLeBrouillonMutation.mutateAsync(
      { brouillonId: brouillon!.id, contenu: data.contenu, csrf: csrf() },
      { onSuccess: () => refreshRouter() },
    );

  const modifier = (data: { contenu: string }) =>
    modifierMutation.mutateAsync(
      { commentaireId: commentaire!.id, contenu: data.contenu, csrf: csrf() },
      { onSuccess: () => refreshRouter() },
    );

  return {
    publier,
    enregistrerEnBrouillon,
    publierBrouillon,
    modifierBrouillon,
    modifier,
  };
};

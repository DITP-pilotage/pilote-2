import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import {
  ObjectifV2,
  ObjectifV2AvecNomAuteur,
  TypeObjectif,
} from "@/server/domain/chantier/objectif/Objectif.interface";
import { PublicationActions } from "@/components/PageChantier/PublicationV2/Publication.interface";

export const useObjectifActions = ({
  chantierId,
  type,
  objectif,
  brouillon,
}: {
  chantierId: string;
  type: TypeObjectif;
  objectif: ObjectifV2AvecNomAuteur | null;
  brouillon: ObjectifV2 | null;
}): PublicationActions => {
  const csrf = () => récupérerUnCookie("csrf") ?? "";
  const refreshRouter = useRefreshRouter();

  const publierMutation = api.objectif.publier.useMutation();
  const enregistrerEnBrouillonMutation =
    api.objectif.enregistrerEnBrouillon.useMutation();
  const publierUnBrouillonMutation =
    api.objectif.publierUnBrouillon.useMutation();
  const modifierLeBrouillonMutation =
    api.objectif.modifierLeBrouillon.useMutation();
  const modifierMutation = api.objectif.modifier.useMutation();

  const publier = (data: { contenu: string }) =>
    publierMutation.mutateAsync(
      { chantierId, type, contenu: data.contenu, csrf: csrf() },
      { onSuccess: () => refreshRouter() },
    );

  const enregistrerEnBrouillon = (data: { contenu: string }) =>
    enregistrerEnBrouillonMutation.mutateAsync(
      { chantierId, type, contenu: data.contenu, csrf: csrf() },
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
      { objectifId: objectif!.id, contenu: data.contenu, csrf: csrf() },
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

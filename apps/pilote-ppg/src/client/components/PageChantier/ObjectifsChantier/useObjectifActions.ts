import { api } from "@/server/framework/trpc/api";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import {
  ObjectifV2,
  ObjectifV2AvecNomAuteur,
  TypeObjectif,
} from "@/shared/chantier/objectif/Objectif.interface";
import { PublicationActions } from "@/components/PageChantier/Publication/Publication.interface";

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
      { chantierId, type, contenu: data.contenu },
      { onSuccess: () => refreshRouter() },
    );

  const enregistrerEnBrouillon = (data: { contenu: string }) =>
    enregistrerEnBrouillonMutation.mutateAsync(
      { chantierId, type, contenu: data.contenu },
      { onSuccess: () => refreshRouter() },
    );

  const publierBrouillon = (data: { contenu: string }) =>
    publierUnBrouillonMutation.mutateAsync(
      { brouillonId: brouillon!.id, contenu: data.contenu },
      { onSuccess: () => refreshRouter() },
    );

  const modifierBrouillon = (data: { contenu: string }) =>
    modifierLeBrouillonMutation.mutateAsync(
      { brouillonId: brouillon!.id, contenu: data.contenu },
      { onSuccess: () => refreshRouter() },
    );

  const modifier = (data: { contenu: string }) =>
    modifierMutation.mutateAsync(
      { objectifId: objectif!.id, contenu: data.contenu },
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

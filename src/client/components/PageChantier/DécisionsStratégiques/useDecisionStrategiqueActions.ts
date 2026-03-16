import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import {
  DecisionStrategiqueV2,
  TypeDecisionStrategique,
} from "@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface";
import { PublicationActions } from "@/components/_commons/CommentairesNew/CommentaireSection/Publication.interface";

export const useDecisionStrategiqueActions = ({
  chantierId,
  type,
  decisionStrategique,
  brouillon,
}: {
  chantierId: string;
  type: TypeDecisionStrategique;
  decisionStrategique: DecisionStrategiqueV2 | null;
  brouillon: DecisionStrategiqueV2 | null;
}): PublicationActions => {
  const csrf = () => récupérerUnCookie("csrf") ?? "";
  const refreshRouter = useRefreshRouter();

  const publierMutation = api.decisionStrategique.publier.useMutation();
  const enregistrerEnBrouillonMutation =
    api.decisionStrategique.enregistrerEnBrouillon.useMutation();
  const publierUnBrouillonMutation =
    api.decisionStrategique.publierUnBrouillon.useMutation();
  const modifierLeBrouillonMutation =
    api.decisionStrategique.modifierLeBrouillon.useMutation();
  const modifierMutation = api.decisionStrategique.modifier.useMutation();

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
      {
        decisionStrategiqueId: decisionStrategique!.id,
        contenu: data.contenu,
        csrf: csrf(),
      },
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

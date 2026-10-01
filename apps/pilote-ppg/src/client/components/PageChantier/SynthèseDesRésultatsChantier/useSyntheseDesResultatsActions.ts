import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { PublicationActions } from "@/components/PageChantier/Publication/Publication.interface";
import { ValeursSyntheseDesResultats } from "./ValeursSyntheseDesResultats";

export const useSyntheseDesResultatsActions = ({
  chantierId,
  territoireCode,
  syntheseId,
  brouillonId,
}: {
  chantierId: string;
  territoireCode: string;
  syntheseId: string | undefined;
  brouillonId: string | undefined;
}): PublicationActions<ValeursSyntheseDesResultats> => {
  const csrf = () => récupérerUnCookie("csrf") ?? "";
  const refreshRouter = useRefreshRouter();

  const publierMutation = api.synthèseDesRésultats.publier.useMutation();
  const enregistrerEnBrouillonMutation =
    api.synthèseDesRésultats.enregistrerEnBrouillon.useMutation();
  const publierUnBrouillonMutation =
    api.synthèseDesRésultats.publierUnBrouillon.useMutation();
  const modifierLeBrouillonMutation =
    api.synthèseDesRésultats.modifierLeBrouillon.useMutation();
  const modifierMutation = api.synthèseDesRésultats.modifier.useMutation();

  const publier = ({ contenu, meteo }: ValeursSyntheseDesResultats) =>
    publierMutation.mutateAsync(
      { chantierId, territoireCode, contenu, meteo, csrf: csrf() },
      { onSuccess: () => refreshRouter() },
    );

  const enregistrerEnBrouillon = ({
    contenu,
    meteo,
  }: ValeursSyntheseDesResultats) =>
    enregistrerEnBrouillonMutation.mutateAsync(
      { chantierId, territoireCode, contenu, meteo, csrf: csrf() },
      { onSuccess: () => refreshRouter() },
    );

  const publierBrouillon = ({ contenu, meteo }: ValeursSyntheseDesResultats) =>
    publierUnBrouillonMutation.mutateAsync(
      { brouillonId: brouillonId!, contenu, meteo, csrf: csrf() },
      { onSuccess: () => refreshRouter() },
    );

  const modifierBrouillon = ({ contenu, meteo }: ValeursSyntheseDesResultats) =>
    modifierLeBrouillonMutation.mutateAsync(
      { brouillonId: brouillonId!, contenu, meteo, csrf: csrf() },
      { onSuccess: () => refreshRouter() },
    );

  const modifier = ({ contenu, meteo }: ValeursSyntheseDesResultats) =>
    modifierMutation.mutateAsync(
      { syntheseId: syntheseId!, contenu, meteo, csrf: csrf() },
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

import { api } from "@/server/framework/trpc/api";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { PublicationActions } from "@/components/PageChantier/Publication/Publication.interface";
import {
  SyntheseDesResultatsPublieeValues,
  SyntheseDesResultatsValues,
} from "./SyntheseDesResultatsValues";

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
}): PublicationActions<
  SyntheseDesResultatsValues,
  SyntheseDesResultatsPublieeValues
> => {
  const refreshRouter = useRefreshRouter();

  const publierMutation = api.syntheseDesResultats.publier.useMutation();
  const enregistrerEnBrouillonMutation =
    api.syntheseDesResultats.enregistrerEnBrouillon.useMutation();
  const publierUnBrouillonMutation =
    api.syntheseDesResultats.publierUnBrouillon.useMutation();
  const modifierLeBrouillonMutation =
    api.syntheseDesResultats.modifierLeBrouillon.useMutation();
  const modifierMutation = api.syntheseDesResultats.modifier.useMutation();

  const publier = ({ contenu, meteo }: SyntheseDesResultatsPublieeValues) =>
    publierMutation.mutateAsync(
      { chantierId, territoireCode, contenu, meteo },
      { onSuccess: () => refreshRouter() },
    );

  const enregistrerEnBrouillon = ({
    contenu,
    meteo,
  }: SyntheseDesResultatsValues) =>
    enregistrerEnBrouillonMutation.mutateAsync(
      { chantierId, territoireCode, contenu, meteo },
      { onSuccess: () => refreshRouter() },
    );

  const publierBrouillon = ({
    contenu,
    meteo,
  }: SyntheseDesResultatsPublieeValues) =>
    publierUnBrouillonMutation.mutateAsync(
      { brouillonId: brouillonId!, contenu, meteo },
      { onSuccess: () => refreshRouter() },
    );

  const modifierBrouillon = ({ contenu, meteo }: SyntheseDesResultatsValues) =>
    modifierLeBrouillonMutation.mutateAsync(
      { brouillonId: brouillonId!, contenu, meteo },
      { onSuccess: () => refreshRouter() },
    );

  const modifier = ({ contenu, meteo }: SyntheseDesResultatsPublieeValues) =>
    modifierMutation.mutateAsync(
      { syntheseId: syntheseId!, contenu, meteo },
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

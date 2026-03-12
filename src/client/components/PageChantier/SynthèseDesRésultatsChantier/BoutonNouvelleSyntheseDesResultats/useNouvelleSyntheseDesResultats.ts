import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { SyntheseDesResultatsFormulaireInputs } from "@/components/PageChantier/SynthèseDesRésultatsChantier/SyntheseDesResultatsFormulaire/SyntheseDesResultatsFormulaire.interface";
import { SyntheseDesResultatsAction } from "@/components/PageChantier/SynthèseDesRésultatsChantier/AlerteSyntheseDesResultats";

export const useNouvelleSyntheseDesResultats = ({
  onSuccess,
  onAction,
}: {
  onSuccess: () => void;
  onAction: (action: SyntheseDesResultatsAction) => void;
}) => {
  const { chantier, territoireCode } = pageChantier.useServerSidePropsContext();

  const publierMutation = api.synthèseDesRésultats.publier.useMutation();
  const enregistrerEnBrouillonMutation =
    api.synthèseDesRésultats.enregistrerEnBrouillon.useMutation();

  const input = (data: SyntheseDesResultatsFormulaireInputs) => ({
    chantierId: chantier.id,
    territoireCode,
    contenu: data.contenu,
    meteo: data.meteo,
    csrf: récupérerUnCookie("csrf") ?? "",
  });

  const publier = (data: SyntheseDesResultatsFormulaireInputs) =>
    publierMutation.mutateAsync(input(data), {
      onSuccess: () => {
        onSuccess();
        onAction("publication-reussie");
      },
    });

  const enregistrerEnBrouillon = (data: SyntheseDesResultatsFormulaireInputs) =>
    enregistrerEnBrouillonMutation.mutateAsync(input(data), {
      onSuccess: () => {
        onSuccess();
        onAction("brouillon-enregistre");
      },
    });

  return { publier, enregistrerEnBrouillon };
};

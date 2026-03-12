import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { SyntheseDesResultatsFormulaireInputs } from "@/components/PageChantier/SynthèseDesRésultatsChantier/SyntheseDesResultatsFormulaire/SyntheseDesResultatsFormulaire.interface";
import { SyntheseDesResultatsAction } from "@/components/PageChantier/SynthèseDesRésultatsChantier/AlerteSyntheseDesResultats";

export const useEditerBrouillonSyntheseDesResultats = ({
  brouillonId,
  onSuccess,
  onAction,
}: {
  brouillonId: string;
  onSuccess: () => void;
  onAction: (action: SyntheseDesResultatsAction) => void;
}) => {
  const publierUnBrouillonMutation =
    api.synthèseDesRésultats.publierUnBrouillon.useMutation();
  const modifierLeBrouillonMutation =
    api.synthèseDesRésultats.modifierLeBrouillon.useMutation();

  const input = (data: SyntheseDesResultatsFormulaireInputs) => ({
    brouillonId,
    contenu: data.contenu,
    meteo: data.meteo,
    csrf: récupérerUnCookie("csrf") ?? "",
  });

  const publier = (data: SyntheseDesResultatsFormulaireInputs) =>
    publierUnBrouillonMutation.mutateAsync(input(data), {
      onSuccess: () => {
        onSuccess();
        onAction("publication-reussie");
      },
    });

  const enregistrerEnBrouillon = (data: SyntheseDesResultatsFormulaireInputs) =>
    modifierLeBrouillonMutation.mutateAsync(input(data), {
      onSuccess: () => {
        onSuccess();
        onAction("brouillon-enregistre");
      },
    });

  return { publier, enregistrerEnBrouillon };
};

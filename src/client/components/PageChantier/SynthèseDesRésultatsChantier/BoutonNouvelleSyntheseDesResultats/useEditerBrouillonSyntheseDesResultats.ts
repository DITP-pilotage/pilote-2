import { parseAsStringLiteral, useQueryState } from "nuqs";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { SyntheseDesResultatsFormulaireInputs } from "@/components/PageChantier/SynthèseDesRésultatsChantier/SyntheseDesResultatsFormulaire/SyntheseDesResultatsFormulaire.interface";
import { SynthèseDesRésultatsV2 } from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface";
import { SYNTHESE_ACTIONS } from "@/components/PageChantier/SynthèseDesRésultatsChantier/AlerteSyntheseDesResultats";

export const useEditerBrouillonSyntheseDesResultats = ({
  brouillon,
  onSuccess,
}: {
  brouillon: SynthèseDesRésultatsV2;
  onSuccess: () => void;
}) => {
  const publierUnBrouillonMutation =
    api.synthèseDesRésultats.publierUnBrouillon.useMutation();
  const modifierLeBrouillonMutation =
    api.synthèseDesRésultats.modifierLeBrouillon.useMutation();

  const [, setAction] = useQueryState(
    "_action",
    parseAsStringLiteral(SYNTHESE_ACTIONS).withDefault("").withOptions({
      history: "push",
      shallow: false,
      clearOnDefault: true,
    }),
  );

  const input = (data: SyntheseDesResultatsFormulaireInputs) => ({
    brouillon,
    contenu: data.contenu,
    meteo: data.meteo,
    csrf: récupérerUnCookie("csrf") ?? "",
  });

  const publier = (data: SyntheseDesResultatsFormulaireInputs) =>
    publierUnBrouillonMutation.mutateAsync(input(data), {
      onSuccess: async () => {
        onSuccess();
        await setAction(null, { shallow: true });
        await setAction("publication-reussie");
      },
    });

  const enregistrerEnBrouillon = (data: SyntheseDesResultatsFormulaireInputs) =>
    modifierLeBrouillonMutation.mutateAsync(input(data), {
      onSuccess: async () => {
        onSuccess();
        await setAction(null, { shallow: true });
        await setAction("brouillon-enregistre");
      },
    });

  return { publier, enregistrerEnBrouillon };
};

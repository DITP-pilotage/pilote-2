import { parseAsBoolean, useQueryState } from "nuqs";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { SyntheseDesResultatsAction } from "@/components/PageChantier/SynthèseDesRésultatsChantier/AlerteSyntheseDesResultats";
import { SyntheseDesResultatsFormulaireInputs } from "./SyntheseDesResultatsFormulaire.interface";

export const useModifierSyntheseDesResultats = ({
  onAction,
}: {
  onAction: (action: SyntheseDesResultatsAction) => void;
}) => {
  const { syntheseDesResultats } = pageChantier.useServerSidePropsContext();

  const modifier = api.synthèseDesRésultats.modifier.useMutation();

  const [, setModeÉdition] = useQueryState(
    "edition",
    parseAsBoolean.withDefault(false).withOptions({
      history: "push",
      shallow: false,
      clearOnDefault: true,
    }),
  );

  return (data: SyntheseDesResultatsFormulaireInputs) =>
    modifier.mutateAsync(
      {
        syntheseAModifier: syntheseDesResultats!,
        contenu: data.contenu,
        meteo: data.meteo,
        csrf: récupérerUnCookie("csrf") ?? "",
      },
      {
        onSuccess: async () => {
          onAction("modification-reussie");
          await setModeÉdition(false);
        },
      },
    );
};

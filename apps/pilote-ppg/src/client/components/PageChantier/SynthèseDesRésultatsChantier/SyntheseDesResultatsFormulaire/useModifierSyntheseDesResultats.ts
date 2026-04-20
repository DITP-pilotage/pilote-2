import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { SyntheseDesResultatsAction } from "@/components/PageChantier/SynthèseDesRésultatsChantier/AlerteSyntheseDesResultats";
import { SyntheseDesResultatsFormulaireInputs } from "./SyntheseDesResultatsFormulaire.interface";

export const useModifierSyntheseDesResultats = ({
  onSucess,
}: {
  onSucess: (action: SyntheseDesResultatsAction) => void;
}) => {
  const { syntheseDesResultats } = pageChantier.useServerSidePropsContext();

  const modifier = api.synthèseDesRésultats.modifier.useMutation();

  return (data: SyntheseDesResultatsFormulaireInputs) =>
    modifier.mutateAsync(
      {
        syntheseId: syntheseDesResultats!.id,
        contenu: data.contenu,
        meteo: data.meteo,
        csrf: récupérerUnCookie("csrf") ?? "",
      },
      {
        onSuccess: () => {
          onSucess("modification-reussie");
        },
      },
    );
};

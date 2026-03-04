import { parseAsStringLiteral, useQueryState } from "nuqs";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { SyntheseDesResultatsFormulaireInputs } from "@/components/PageChantier/SynthèseDesRésultatsChantier/SyntheseDesResultatsFormulaire/SyntheseDesResultatsFormulaire.interface";

export const useNouvelleSyntheseDesResultats = ({
  onSuccess,
}: {
  onSuccess: () => void;
}) => {
  const { chantier, territoireCode } = pageChantier.useServerSidePropsContext();

  const publierMutation = api.synthèseDesRésultats.publier.useMutation();
  const enregistrerEnBrouillonMutation =
    api.synthèseDesRésultats.enregistrerEnBrouillon.useMutation();

  const [, setAction] = useQueryState(
    "_action",
    parseAsStringLiteral(["creation-reussie", ""]).withDefault("").withOptions({
      history: "push",
      shallow: false,
      clearOnDefault: true,
    }),
  );

  const input = (data: SyntheseDesResultatsFormulaireInputs) => ({
    réformeId: chantier.id,
    territoireCode,
    contenu: data.contenu,
    meteo: data.meteo,
    csrf: récupérerUnCookie("csrf") ?? "",
  });

  const publier = (data: SyntheseDesResultatsFormulaireInputs) =>
    publierMutation.mutateAsync(input(data), {
      onSuccess: async () => {
        onSuccess();
        await setAction("creation-reussie");
      },
    });

  const enregistrerEnBrouillon = (data: SyntheseDesResultatsFormulaireInputs) =>
    enregistrerEnBrouillonMutation.mutateAsync(input(data), {
      onSuccess: () => {
        onSuccess();
      },
    });

  return { publier, enregistrerEnBrouillon };
};

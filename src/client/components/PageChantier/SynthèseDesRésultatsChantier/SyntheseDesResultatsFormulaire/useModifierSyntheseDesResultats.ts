import { parseAsBoolean, parseAsStringLiteral, useQueryState } from "nuqs";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { SyntheseDesResultatsFormulaireInputs } from "./SyntheseDesResultatsFormulaire.interface";

export const useModifierSyntheseDesResultats = () => {
  const { synthèseDesRésultats } = pageChantier.useServerSidePropsContext();

  const modifier = api.synthèseDesRésultats.modifier.useMutation();

  const [, setAction] = useQueryState(
    "_action",
    parseAsStringLiteral(["creation-reussie", ""]).withDefault("").withOptions({
      history: "push",
      shallow: false,
      clearOnDefault: true,
    }),
  );

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
        synthèsePrécédente: synthèseDesRésultats!,
        contenu: data.contenu,
        météo: data.météo,
        csrf: récupérerUnCookie("csrf") ?? "",
      },
      {
        onSuccess: async () => {
          setAction("creation-reussie");
          await setModeÉdition(false);
        },
      },
    );
};

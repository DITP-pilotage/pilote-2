import { parseAsBoolean, parseAsStringLiteral, useQueryState } from "nuqs";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { SyntheseDesResultatsFormulaireInputs } from "./SyntheseDesResultatsFormulaire.interface";

export const useModifierSyntheseDesResultats = () => {
  const { syntheseDesResultats } = pageChantier.useServerSidePropsContext();

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
        syntheseAModifier: syntheseDesResultats!,
        contenu: data.contenu,
        meteo: data.meteo,
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

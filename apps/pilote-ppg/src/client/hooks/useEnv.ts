import api from "@/server/infrastructure/api/trpc/api";
import type { VariableContenuDisponibleEnv } from "@/server/gestion-contenu/domain/VariableContenuDisponible";
import { useDonneesCommunesPage } from "@/components/_commons/DonneesCommunesPage/DonneesCommunesPageContext";

const DUREE_FRAICHEUR_VARIABLES_CONTENU_EN_MS = 60_000;

export const useEnv = <T extends keyof VariableContenuDisponibleEnv>(
  nomVariable: T,
): VariableContenuDisponibleEnv[T] => {
  const { variablesContenu } = useDonneesCommunesPage();
  const [variables] =
    api.gestionContenu.recupererToutesLesVariablesContenu.useSuspenseQuery(
      undefined,
      {
        initialData: variablesContenu,
        staleTime: DUREE_FRAICHEUR_VARIABLES_CONTENU_EN_MS,
      },
    );
  return variables[nomVariable];
};

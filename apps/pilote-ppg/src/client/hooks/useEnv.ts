import api from "@/server/infrastructure/api/trpc/api";
import type { VariableContenuDisponibleEnv } from "@/server/gestion-contenu/domain/VariableContenuDisponible";
import { useBootstrap } from "@/components/_commons/Bootstrap/BootstrapContext";

const VARIABLES_CONTENU_STALE_TIME_MS = 60_000;

export const useEnv = <T extends keyof VariableContenuDisponibleEnv>(
  nomVariable: T,
): VariableContenuDisponibleEnv[T] => {
  const { variablesContenu } = useBootstrap();
  const [variables] =
    api.gestionContenu.recupererToutesLesVariablesContenu.useSuspenseQuery(
      undefined,
      {
        initialData: variablesContenu,
        staleTime: VARIABLES_CONTENU_STALE_TIME_MS,
      },
    );
  return variables[nomVariable];
};

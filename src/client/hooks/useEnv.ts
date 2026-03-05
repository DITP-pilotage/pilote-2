import api from "@/server/infrastructure/api/trpc/api";
import type { VariableContenuDisponibleEnv } from "@/server/gestion-contenu/domain/VariableContenuDisponible";

export const useEnv = <T extends keyof VariableContenuDisponibleEnv>(
  nomVariable: T,
): VariableContenuDisponibleEnv[T] => {
  const [variables] =
    api.gestionContenu.recupererToutesLesVariablesContenu.useSuspenseQuery();
  return variables[nomVariable];
};

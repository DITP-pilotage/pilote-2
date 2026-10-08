import { DétailsIndicateurTerritoire } from "@/shared/indicateur/DetailsIndicateur.interface";
import { objectEntries } from "@/client/utils/objects/objects";

export const useIndicateurDétails = (
  detailsIndicateurTerritoire: DétailsIndicateurTerritoire,
) => {
  const donnéesCartographieAvancementTerritorialisées = objectEntries(
    detailsIndicateurTerritoire,
  ).some(
    ([, détailsIndicateur]) => détailsIndicateur.avancement.global != null,
  );
  const donnéesCartographieValeurAvancementTerritorialisées = objectEntries(
    detailsIndicateurTerritoire,
  ).some(([, détailsIndicateur]) => détailsIndicateur.valeurAvancement != null);

  return {
    donnéesCartographieAvancementTerritorialisées,
    donnéesCartographieValeurAvancementTerritorialisées,
  };
};

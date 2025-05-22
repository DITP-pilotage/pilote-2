import { DétailsIndicateurTerritoire } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { objectEntries } from '@/client/utils/objects/objects';

export const useIndicateurDétails = (detailsIndicateurTerritoire: DétailsIndicateurTerritoire) => {

  const donnéesCartographieAvancementTerritorialisées = objectEntries(detailsIndicateurTerritoire).
    some(([, détailsIndicateur]) => (détailsIndicateur.avancement.global != null ));
  const donnéesCartographieValeurActuelleTerritorialisées = objectEntries(detailsIndicateurTerritoire).
    some(([, détailsIndicateur]) => (détailsIndicateur.valeurActuelle != null ));

  return {
    donnéesCartographieAvancementTerritorialisées,
    donnéesCartographieValeurActuelleTerritorialisées,
  };
};

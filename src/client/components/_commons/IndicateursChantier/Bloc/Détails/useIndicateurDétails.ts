import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import {
  CartographieDonnéesValeurActuelle,
} from '@/components/_commons/Cartographie/CartographieValeurActuelle/CartographieValeurActuelle.interface';
import {
  CartographieDonnéesAvancement,
} from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement.interface';
import { DétailsIndicateurTerritoire } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { objectEntries } from '@/client/utils/objects/objects';

export const useIndicateurDétails = (indicateurId: Indicateur['id'], futOuvert: boolean, mailleSelectionnee: MailleInterne, detailsIndicateurTerritoire: DétailsIndicateurTerritoire) => {
  function aDeLaDonnéeTerritoriale(donnéesCartographie: CartographieDonnéesAvancement | CartographieDonnéesValeurActuelle | null): boolean {
    return (donnéesCartographie || []).some(donnéesCarto => donnéesCarto.valeur !== null);
  }

  const donnéesCartographieAvancement = objectEntries(detailsIndicateurTerritoire).map(([codeInsee, détailsIndicateur]) => ({ valeur: détailsIndicateur.avancement.global, codeInsee: codeInsee, estApplicable: détailsIndicateur.est_applicable }));
  const donnéesCartographieValeurActuelle = objectEntries(detailsIndicateurTerritoire).map(([codeInsee, détailsIndicateur]) => ({ valeur: détailsIndicateur.valeurActuelle ?? null, codeInsee: codeInsee, estApplicable: détailsIndicateur.est_applicable }));
  const donnéesCartographieAvancementTerritorialisées = aDeLaDonnéeTerritoriale(donnéesCartographieAvancement);
  const donnéesCartographieValeurActuelleTerritorialisées = aDeLaDonnéeTerritoriale(donnéesCartographieValeurActuelle);

  return {
    donnéesCartographieAvancement,
    donnéesCartographieValeurActuelle,
    donnéesCartographieAvancementTerritorialisées,
    donnéesCartographieValeurActuelleTerritorialisées,
  };
};

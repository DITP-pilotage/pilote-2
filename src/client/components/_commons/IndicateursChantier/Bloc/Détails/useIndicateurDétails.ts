import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { DétailsIndicateurTerritoire } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { objectEntries } from '@/client/utils/objects/objects';
import { CartographieDonnéesAvancement } from '@/components/_commons/Cartographie/CartographieAvancementNew/CartographieAvancement.interface';
import { CartographieDonnéesValeurActuelle } from '@/components/_commons/Cartographie/CartographieValeurActuelleNew/CartographieValeurActuelle.interface';

export const useIndicateurDétails = (indicateurId: Indicateur['id'], futOuvert: boolean, mailleSelectionnee: MailleInterne, detailsIndicateurTerritoire: DétailsIndicateurTerritoire) => {
  function aDeLaDonnéeTerritoriale(donnéesCartographie: CartographieDonnéesAvancement | CartographieDonnéesValeurActuelle | null): boolean {
    return (donnéesCartographie || []).some(donnéesCarto => donnéesCarto.valeur !== null);
  }

  const donnéesCartographieAvancement: CartographieDonnéesAvancement = objectEntries(detailsIndicateurTerritoire).
    map(([codeInsee, détailsIndicateur]) => ({ 
      valeur: détailsIndicateur.avancement.global,
      valeurAnnuelle: détailsIndicateur.avancement.annuel,
      codeInsee: codeInsee, 
      estApplicable: détailsIndicateur.est_applicable }));
  const donnéesCartographieValeurActuelle: CartographieDonnéesValeurActuelle = objectEntries(detailsIndicateurTerritoire).
    map(([codeInsee, détailsIndicateur]) => ({ 
      valeur: détailsIndicateur.valeurActuelle ?? null, 
      valeurCible: détailsIndicateur.valeurCible ?? null,
      codeInsee: codeInsee, 
      estApplicable: détailsIndicateur.est_applicable }));
  const donnéesCartographieAvancementTerritorialisées = aDeLaDonnéeTerritoriale(donnéesCartographieAvancement);
  const donnéesCartographieValeurActuelleTerritorialisées = aDeLaDonnéeTerritoriale(donnéesCartographieValeurActuelle);

  return {
    donnéesCartographieAvancement,
    donnéesCartographieValeurActuelle,
    donnéesCartographieAvancementTerritorialisées,
    donnéesCartographieValeurActuelleTerritorialisées,
  };
};

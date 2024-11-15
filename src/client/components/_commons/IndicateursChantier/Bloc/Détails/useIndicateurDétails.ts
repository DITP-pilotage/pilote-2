import { useSession } from 'next-auth/react';
import { DétailsIndicateurTerritoire } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { objectEntries } from '@/client/utils/objects/objects';
import { CartographieDonnéesAvancement } from '@/components/_commons/Cartographie/CartographieAvancementNew/CartographieAvancement.interface';
import { CartographieDonnéesValeurActuelle } from '@/components/_commons/Cartographie/CartographieValeurActuelleNew/CartographieValeurActuelle.interface';
import { ProfilEnum } from '@/server/app/enum/profil.enum';

const PROFIL_INTERDIT_DE_VOIR_LE_SELECTEUR_DE_MAILLE = new Set([ProfilEnum.COORDINATEUR_DEPARTEMENT, ProfilEnum.RESPONSABLE_DEPARTEMENT]);

export const useIndicateurDétails = (detailsIndicateurTerritoire: DétailsIndicateurTerritoire) => {
  const { data: session } = useSession();

  function aDeLaDonnéeTerritoriale(donnéesCartographie: CartographieDonnéesAvancement | CartographieDonnéesValeurActuelle | null): boolean {
    return (donnéesCartographie || []).some(donnéesCarto => donnéesCarto.valeur !== null);
  }

  const donnéesCartographieAvancement: CartographieDonnéesAvancement = objectEntries(detailsIndicateurTerritoire).
    map(([territoireCode, détailsIndicateur]) => ({
      valeur: détailsIndicateur.avancement.global,
      valeurAnnuelle: détailsIndicateur.avancement.annuel,
      territoireCode: territoireCode,
      estApplicable: détailsIndicateur.est_applicable }));
  const donnéesCartographieValeurActuelle: CartographieDonnéesValeurActuelle = objectEntries(detailsIndicateurTerritoire).
    map(([territoireCode, détailsIndicateur]) => ({
      valeur: détailsIndicateur.valeurActuelle ?? null, 
      valeurCible: détailsIndicateur.valeurCible ?? null,
      valeurCibleAnnuelle: détailsIndicateur.valeurCibleAnnuelle ?? null,
      territoireCode: territoireCode,
      estApplicable: détailsIndicateur.est_applicable }));
  const donnéesCartographieAvancementTerritorialisées = aDeLaDonnéeTerritoriale(donnéesCartographieAvancement);
  const donnéesCartographieValeurActuelleTerritorialisées = aDeLaDonnéeTerritoriale(donnéesCartographieValeurActuelle);

  const estAutoriseAVoirLeSelecteurDeMaille = !PROFIL_INTERDIT_DE_VOIR_LE_SELECTEUR_DE_MAILLE.has(session!.profil);

  return {
    donnéesCartographieAvancement,
    donnéesCartographieValeurActuelle,
    donnéesCartographieAvancementTerritorialisées,
    donnéesCartographieValeurActuelleTerritorialisées,
    estAutoriseAVoirLeSelecteurDeMaille,
  };
};

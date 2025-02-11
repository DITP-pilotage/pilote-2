import { useSession } from 'next-auth/react';
import { DétailsIndicateurTerritoire } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { objectEntries } from '@/client/utils/objects/objects';
import { ProfilEnum } from '@/server/app/enum/profil.enum';

const PROFIL_INTERDIT_DE_VOIR_LE_SELECTEUR_DE_MAILLE = new Set([ProfilEnum.COORDINATEUR_DEPARTEMENT, ProfilEnum.RESPONSABLE_DEPARTEMENT]);

export const useIndicateurDétails = (detailsIndicateurTerritoire: DétailsIndicateurTerritoire) => {
  const { data: session } = useSession();

  const donnéesCartographieAvancementTerritorialisées = objectEntries(detailsIndicateurTerritoire).
    some(([, détailsIndicateur]) => (détailsIndicateur.avancement.global != null ));
  const donnéesCartographieValeurActuelleTerritorialisées = objectEntries(detailsIndicateurTerritoire).
    some(([, détailsIndicateur]) => (détailsIndicateur.valeurActuelle != null ));
  const estAutoriseAVoirLeSelecteurDeMaille = !PROFIL_INTERDIT_DE_VOIR_LE_SELECTEUR_DE_MAILLE.has(session!.profil);

  return {
    donnéesCartographieAvancementTerritorialisées,
    donnéesCartographieValeurActuelleTerritorialisées,
    estAutoriseAVoirLeSelecteurDeMaille,
  };
};

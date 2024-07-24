import { useSession } from 'next-auth/react';
import api from '@/server/infrastructure/api/trpc/api';
import { DétailsIndicateurTerritoire } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';

export const PROFIL_AUTORISE_A_VOIR_LES_ALERTES_MAJ_INDICATEURS = new Set(['DITP_ADMIN', 'DITP_PILOTAGE', 'SECRETARIAT_GENERAL', 'DIR_PROJET', 'EQUIPE_DIR_PROJET']);

export default function useIndicateurAlerteDateMaj(
  détailsIndicateur: DétailsIndicateurTerritoire,
  territoireSélectionné: DétailTerritoire | null,
) {
  const { data: session } = useSession();

  const estAutoriseAVoirLesAlertesMAJIndicateurs = PROFIL_AUTORISE_A_VOIR_LES_ALERTES_MAJ_INDICATEURS.has(session!.profil);
  const { data: alerteMiseAJourIndicateurEstDisponible } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_FF_ALERTE_MAJ_INDICATEUR' });

  const estIndicateurEnAlerte = estAutoriseAVoirLesAlertesMAJIndicateurs && !!alerteMiseAJourIndicateurEstDisponible && détailsIndicateur[territoireSélectionné!.codeInsee]?.estAJour === false && détailsIndicateur[territoireSélectionné!.codeInsee]?.prochaineDateMaj !== null;

  return {
    estIndicateurEnAlerte,
  };
}

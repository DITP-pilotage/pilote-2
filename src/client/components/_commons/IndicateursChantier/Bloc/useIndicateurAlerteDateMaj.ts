import { useSession } from 'next-auth/react';
import api from '@/server/infrastructure/api/trpc/api';
import { ProfilEnum } from '@/server/app/enum/profil.enum';

export const PROFIL_AUTORISE_A_VOIR_LES_ALERTES_MAJ_INDICATEURS = new Set([ProfilEnum.DITP_ADMIN, ProfilEnum.DITP_PILOTAGE, ProfilEnum.SECRETARIAT_GENERAL, ProfilEnum.DIR_PROJET, ProfilEnum.EQUIPE_DIR_PROJET]);

export default function useIndicateurAlerteDateMaj(
  indicateurNonAJour: boolean,
) {
  const { data: session } = useSession();

  const estAutoriseAVoirLesAlertesMAJIndicateurs = PROFIL_AUTORISE_A_VOIR_LES_ALERTES_MAJ_INDICATEURS.has(session!.profil);
  const { data: alerteMiseAJourIndicateurEstDisponible } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_FF_ALERTE_MAJ_INDICATEUR' });

  const estIndicateurEnAlerte = estAutoriseAVoirLesAlertesMAJIndicateurs && !!alerteMiseAJourIndicateurEstDisponible && indicateurNonAJour;

  return {
    estIndicateurEnAlerte,
  };
}

import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";

export const PROFIL_AUTORISE_A_VOIR_LES_ALERTES_MAJ_INDICATEURS = new Set([
  ProfilEnum.DITP_ADMIN,
  ProfilEnum.DITP_PILOTAGE,
  ProfilEnum.SECRETARIAT_GENERAL,
  ProfilEnum.DIR_PROJET,
  ProfilEnum.EQUIPE_DIR_PROJET,
]);

export const useIndicateurAlerteDateMaj = () => {
  const { detailIndicateurDuTerritoire } = useBlocIndicateurContext();

  const estIndicateurEnAlerte =
    !detailIndicateurDuTerritoire.estAJour &&
    detailIndicateurDuTerritoire.est_applicable;

  return {
    estIndicateurEnAlerte,
  };
};

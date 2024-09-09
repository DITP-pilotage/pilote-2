import { ProfilEnum } from '@/server/app/enum/profil.enum';

const PROFIL_AUTORISE_A_CONSULTER  = new Set([ProfilEnum.DITP_ADMIN, ProfilEnum.DITP_PILOTAGE, ProfilEnum.PR, ProfilEnum.PM_ET_CABINET, ProfilEnum.CABINET_MTFP, ProfilEnum.DIR_PROJET, ProfilEnum.EQUIPE_DIR_PROJET, ProfilEnum.CABINET_MINISTERIEL]);

export function estAutoriséAConsulterLaFicheConducteur(profil: string): boolean {
  return PROFIL_AUTORISE_A_CONSULTER.has(profil);
}

import { ProfilEnum } from '@/server/app/enum/profil.enum';

const PROFIL_AUTORISE_A_CONSULTER  = new Set([ProfilEnum.DITP_ADMIN, ProfilEnum.DITP_PILOTAGE, ProfilEnum.PR, ProfilEnum.PM_ET_CABINET, ProfilEnum.CABINET_MTFP]);

export function estAutoriséAConsulterLaFicheTerritoriale(profil: string): boolean {
  return PROFIL_AUTORISE_A_CONSULTER.has(profil);
}

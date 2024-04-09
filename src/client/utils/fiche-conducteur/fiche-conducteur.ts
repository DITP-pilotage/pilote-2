const PROFIL_AUTORISE_A_CONSULTER  = new Set(['DITP_ADMIN', 'DITP_PILOTAGE', 'PR', 'PM_ET_CABINET', 'CABINET_MTFP', 'DIR_PROJET', 'EQUIPE_DIR_PROJET', 'CABINET_MINISTERIEL']);

export function estAutoriséAConsulterLaFicheConducteur(profil: string): boolean {
  return PROFIL_AUTORISE_A_CONSULTER.has(profil);
}

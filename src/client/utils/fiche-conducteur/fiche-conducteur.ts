const PROFIL_AUTORISE_A_CONSULTER  = new Set(['DITP_ADMIN', 'DITP_PILOTAGE', 'DIR_PROJET', 'EQUIPE_DIR_PROJET']);

export function estAutoriséAConsulterLaFicheConducteur(profil: string): boolean {
  return PROFIL_AUTORISE_A_CONSULTER.has(profil);
}

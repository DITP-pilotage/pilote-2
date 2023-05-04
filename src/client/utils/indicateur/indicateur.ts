const AUTHORIZED_PROFIL  = new Set(['DITP_ADMIN', 'SECRETARIAT_GENERAL', 'EQUIPE_DIR_PROJET', 'DIR_PROJET', 'DROM']);

export function estAutoriséAImporterDesIndicateurs(profil: string): boolean {
  return AUTHORIZED_PROFIL.has(profil);
}

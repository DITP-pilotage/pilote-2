const PROFIL_AUTORISE_A_CONSULTER  = new Set(['DITP_ADMIN', 'DITP_PILOTAGE', 'PR', 'PM_ET_CABINET']);

export function estAutoriséAConsulterLaFicheTerritoriale(profil: string): boolean {
  return PROFIL_AUTORISE_A_CONSULTER.has(profil);
}

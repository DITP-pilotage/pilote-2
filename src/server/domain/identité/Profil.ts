export const SANS_HABILITATIONS = 'SANS_HABILITATIONS';
export const DITP_ADMIN = 'DITP_ADMIN';
export const DITP_PILOTAGE = 'DITP_PILOTAGE';
export const PM_ET_CABINET = 'PM_ET_CABINET';
export const PR = 'PR';
export const CABINET_MTFP = 'CABINET_MTFP';
export const CABINET_MINISTERIEL = 'CABINET_MINISTERIEL';
export const DIR_ADMIN_CENTRALE = 'DIR_ADMIN_CENTRALE';
export const SECRETARIAT_GENERAL = 'SECRETARIAT_GENERAL';
export const DIR_PROJET = 'DIR_PROJET';
export const EQUIPE_DIR_PROJET = 'EQUIPE_DIR_PROJET';

const _profils = new Set([
  SANS_HABILITATIONS,
  DITP_ADMIN,
  DITP_PILOTAGE,
  PM_ET_CABINET,
  PR,
  CABINET_MTFP,
  CABINET_MINISTERIEL,
  DIR_ADMIN_CENTRALE,
  SECRETARIAT_GENERAL,
  DIR_PROJET,
  EQUIPE_DIR_PROJET,
]);

export function vérifieCodeProfil(codeProfil: string): boolean {
  return _profils.has(codeProfil);
}

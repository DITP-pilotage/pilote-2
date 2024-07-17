import Indicateur, { TypeIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import { ProfilEnum } from '@/server/app/enum/profil.enum';

const PROFIL_AUTORISE_A_IMPORTER  = new Set([ProfilEnum.DITP_ADMIN, ProfilEnum.DITP_PILOTAGE, ProfilEnum.SECRETARIAT_GENERAL, ProfilEnum.EQUIPE_DIR_PROJET, ProfilEnum.DIR_PROJET, ProfilEnum.DROM]);
const PROFIL_AUTORISE_A_MODIFIER  = new Set([ProfilEnum.DITP_ADMIN]);
const ORDRE_DES_TYPES_INDICATEUR: TypeIndicateur[] = ['IMPACT', 'DEPL', 'Q_SERV', 'REBOND', 'CONTEXTE'];

export function estAutoriséAImporterDesIndicateurs(profil: string): boolean {
  return PROFIL_AUTORISE_A_IMPORTER.has(profil);
}
export function estAutoriséAModifierDesIndicateurs(profil: string): boolean {
  return PROFIL_AUTORISE_A_MODIFIER.has(profil);
}

export function comparerIndicateur(a: Indicateur, b: Indicateur, pondérationA: number | null, pondérationB: number | null) {
  if (a.type === b.type) {
    if (pondérationA === null) {
      return pondérationB === null ? a.nom.localeCompare(b.nom, 'fr', { ignorePunctuation: true }) : 1;
    } else {
      if (pondérationB === null) {
        return -1;
      } else {
        return pondérationA !== pondérationB ? (pondérationA < pondérationB ? 1 : -1) : a.nom.localeCompare(b.nom, 'fr', { ignorePunctuation: true });
      }
    }
  } else {
    return ORDRE_DES_TYPES_INDICATEUR.indexOf(a.type) < ORDRE_DES_TYPES_INDICATEUR.indexOf(b.type) ? - 1 : 1;
  }
}

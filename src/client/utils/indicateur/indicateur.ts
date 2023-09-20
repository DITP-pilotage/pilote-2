import Indicateur, { TypeIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';

const AUTHORIZED_PROFIL  = new Set(['DITP_ADMIN', 'SECRETARIAT_GENERAL', 'EQUIPE_DIR_PROJET', 'DIR_PROJET', 'DROM']);
const ORDRE_DES_TYPES_INDICATEUR: TypeIndicateur[] = ['IMPACT', 'DEPL', 'Q_SERV', 'REBOND', 'CONTEXTE'];

export function estAutoriséAImporterDesIndicateurs(profil: string): boolean {
  return AUTHORIZED_PROFIL.has(profil);
}

export function comparerIndicateur(a: Indicateur, b: Indicateur, mailleSélectionnée: Maille) {

  if (a.type === b.type) {
    if (a.pondération?.[mailleSélectionnée] === null) {
      return b.pondération?.[mailleSélectionnée] === null ? a.nom.localeCompare(b.nom) : 1;
    } else {
      return b.pondération?.[mailleSélectionnée] === null ? -1 : a.nom.localeCompare(b.nom);
    }
  } else {
    return ORDRE_DES_TYPES_INDICATEUR.indexOf(a.type) < ORDRE_DES_TYPES_INDICATEUR.indexOf(b.type) ? - 1 : 1;
  }
}

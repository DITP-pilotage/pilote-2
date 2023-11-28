import Indicateur, { TypeIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';

const PROFIL_AUTORISE_A_IMPORTER  = new Set(['DITP_ADMIN', 'SECRETARIAT_GENERAL', 'EQUIPE_DIR_PROJET', 'DIR_PROJET', 'DROM']);
const PROFIL_AUTORISE_A_MODIFIER  = new Set(['DITP_ADMIN']);
const ORDRE_DES_TYPES_INDICATEUR: TypeIndicateur[] = ['IMPACT', 'DEPL', 'Q_SERV', 'REBOND', 'CONTEXTE'];

export function estAutoriséAImporterDesIndicateurs(profil: string): boolean {
  return PROFIL_AUTORISE_A_IMPORTER.has(profil);
}
export function estAutoriséAModifierDesIndicateurs(profil: string): boolean {
  return PROFIL_AUTORISE_A_MODIFIER.has(profil);
}

export function comparerIndicateur(a: Indicateur, b: Indicateur, mailleSélectionnée: Maille) {
  const pondérationA = a.pondération?.[mailleSélectionnée] ?? null;
  const pondérationB = b.pondération?.[mailleSélectionnée] ?? null;
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

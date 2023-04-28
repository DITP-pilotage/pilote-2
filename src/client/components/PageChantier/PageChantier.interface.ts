import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';

export default interface PageChantierProps {
  indicateurs: Indicateur[]
  habilitation: Utilisateur['scopes']
}

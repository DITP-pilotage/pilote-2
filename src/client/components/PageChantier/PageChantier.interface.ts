import Chantier from '@/server/domain/chantier/Chantier.interface';
import Indicateur, { TypeIndicateur } from '@/server/domain/indicateur/Indicateur.interface';

export type IndicateurPondération = {
  pondération: string,
  nom: string,
  type: TypeIndicateur,
};

export default interface PageChantierProps {
  indicateurs: Indicateur[]
  chantierId: Chantier['id']
}

import Chantier from '@/server/domain/chantier/Chantier.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { Objectifs } from '@/server/domain/objectif/Objectif.interface';

export default interface PageChantierProps {
  chantier: Chantier
  indicateurs: Indicateur[]
  objectifs: Objectifs
}

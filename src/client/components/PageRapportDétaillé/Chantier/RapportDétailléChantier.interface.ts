import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Habilitation } from '@/server/domain/identité/Habilitation';

export default interface RapportDétailléChantierProps {
  chantier: Chantier
  habilitation: Habilitation
}

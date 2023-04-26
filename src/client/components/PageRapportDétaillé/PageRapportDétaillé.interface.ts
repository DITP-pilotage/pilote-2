import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Habilitation } from '@/server/domain/identité/Habilitation';

export default interface PageRapportDétailléProps {
  chantiers: Chantier[]
  habilitation: Habilitation
}

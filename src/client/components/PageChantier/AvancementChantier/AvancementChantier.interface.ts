import Chantier, { TerritoireIdentifiant } from '@/server/domain/chantier/Chantier.interface';

export default interface AvancementChantierProps {
  chantier: Chantier
  territoireSélectionné: TerritoireIdentifiant
}

import Chantier from '@/server/domain/chantier/Chantier.interface';
import Météo from '@/server/domain/chantier/Météo.interface';

export type CompteurMétéos = {
  [k in Météo]: number;
};

export default interface RépartitonMétéoProps {
  chantiers: Chantier[];
}

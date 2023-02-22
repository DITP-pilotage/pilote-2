import Chantier from '@/server/domain/chantier/Chantier.interface';
import Météo from '@/server/domain/chantier/Météo.interface';

export default interface ListeChantiersProps {
  chantiers: Chantier[]
}

export type DonnéesTableauChantiers = {
  id: string;
  nom: string;
  avancement: number | null;
  météo: Météo;
  estBaromètre: boolean;
};

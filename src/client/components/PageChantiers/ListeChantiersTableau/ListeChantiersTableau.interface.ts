import { Météo } from '@/server/domain/météo/Météo.interface';

export default interface ListeChantiersTableauProps {
  données: DonnéesTableauChantiers[],
}

export type DonnéesTableauChantiers = {
  id: string;
  nom: string;
  avancement: number | null;
  météo: Météo;
  estBaromètre: boolean;
  porteur: string;
};

import { ColumnDef } from '@tanstack/react-table';
import { Météo } from '@/server/domain/météo/Météo.interface';

export default interface ListeChantiersTableauProps {
  colonnes: ColumnDef<DonnéesTableauChantiers, any>[],
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

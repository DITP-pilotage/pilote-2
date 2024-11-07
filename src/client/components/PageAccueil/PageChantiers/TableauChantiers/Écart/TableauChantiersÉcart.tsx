import { FunctionComponent } from 'react';
import Badge from '@/components/_commons/Badge/Badge';
import { définirCouleurÉcartArrondi } from '@/client/utils/chantier/écart/écart';
import {
  DonnéesTableauChantiers,
} from '@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers.interface';

interface TableauChantiersÉcartProps {
  écart: DonnéesTableauChantiers['écart']
  estArchive?: boolean
}

const TableauChantiersÉcart: FunctionComponent<TableauChantiersÉcartProps> = ({ écart, estArchive }) => {
  const couleurÉcartArrondi = définirCouleurÉcartArrondi(écart);

  if (couleurÉcartArrondi === null) {
    return null;
  }

  return (
    <Badge type={estArchive ? 'gris' : couleurÉcartArrondi.couleur}>
      {couleurÉcartArrondi.écartArrondi.toFixed(1)}
    </Badge>
  );
};

export default TableauChantiersÉcart;
